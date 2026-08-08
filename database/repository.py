import os
import sqlite3
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = PROJECT_ROOT / "aqshield.db"
ALLOWED_AVERAGE_FIELDS = {
    "qber",
    "latency_ms",
    "throughput",
    "fidelity",
    "detection_rate",
    "secure_message_rate",
    "decoy_rate",
    "attack_intensity",
    "noise_level",
    "photon_loss",
}


def _resolve_database_path() -> Path:
    configured_path = os.getenv("AQSHIELD_DB_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()
    return DEFAULT_DB_PATH


class SQLiteRepository:
    def __init__(self, database_path: Path | None = None) -> None:
        self.database_path = database_path or _resolve_database_path()
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS runs (
                    run_id TEXT PRIMARY KEY,
                    experiment_id TEXT,
                    protocol TEXT NOT NULL,
                    status TEXT NOT NULL,
                    transmitted_message TEXT NOT NULL,
                    recovered_message TEXT NOT NULL,
                    qber REAL NOT NULL,
                    latency_ms REAL NOT NULL,
                    throughput REAL NOT NULL,
                    fidelity REAL NOT NULL,
                    detection_rate REAL NOT NULL,
                    secure_message_rate REAL NOT NULL,
                    basis_strategy TEXT NOT NULL,
                    decoy_rate REAL NOT NULL,
                    authentication_mode TEXT NOT NULL,
                    adaptation_action TEXT NOT NULL,
                    attack_type TEXT,
                    attack_intensity REAL NOT NULL,
                    noise_level REAL NOT NULL,
                    photon_loss REAL NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            self._ensure_column(
                connection, "runs", "experiment_id", "TEXT"
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS experiments (
                    experiment_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    protocols TEXT NOT NULL,
                    iterations INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    noise_min REAL NOT NULL,
                    noise_max REAL NOT NULL,
                    photon_loss_min REAL NOT NULL,
                    photon_loss_max REAL NOT NULL,
                    attack_intensity_min REAL NOT NULL,
                    attack_intensity_max REAL NOT NULL,
                    attack_type TEXT,
                    latency_ms REAL NOT NULL,
                    total_runs INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS experiment_summaries (
                    experiment_id TEXT NOT NULL,
                    protocol TEXT NOT NULL,
                    total_runs INTEGER NOT NULL,
                    success_rate REAL NOT NULL,
                    average_qber REAL NOT NULL,
                    average_latency_ms REAL NOT NULL,
                    average_throughput REAL NOT NULL,
                    average_fidelity REAL NOT NULL,
                    average_detection_rate REAL NOT NULL,
                    average_secure_message_rate REAL NOT NULL,
                    PRIMARY KEY (experiment_id, protocol),
                    FOREIGN KEY (experiment_id) REFERENCES experiments (experiment_id)
                )
                """
            )

    def _ensure_column(
        self,
        connection: sqlite3.Connection,
        table_name: str,
        column_name: str,
        column_definition: str,
    ) -> None:
        columns = {
            row["name"]
            for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
        }
        if column_name not in columns:
            connection.execute(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
            )

    def add_run(self, payload: dict) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO runs (
                    run_id,
                    experiment_id,
                    protocol,
                    status,
                    transmitted_message,
                    recovered_message,
                    qber,
                    latency_ms,
                    throughput,
                    fidelity,
                    detection_rate,
                    secure_message_rate,
                    basis_strategy,
                    decoy_rate,
                    authentication_mode,
                    adaptation_action,
                    attack_type,
                    attack_intensity,
                    noise_level,
                    photon_loss
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload["run_id"],
                    payload.get("experiment_id"),
                    payload["protocol"],
                    payload["status"],
                    payload["transmitted_message"],
                    payload["recovered_message"],
                    payload["qber"],
                    payload["latency_ms"],
                    payload["throughput"],
                    payload["fidelity"],
                    payload["detection_rate"],
                    payload["secure_message_rate"],
                    payload["basis_strategy"],
                    payload["decoy_rate"],
                    payload["authentication_mode"],
                    payload["adaptation_action"],
                    payload.get("attack_type"),
                    payload["attack_intensity"],
                    payload["noise_level"],
                    payload["photon_loss"],
                ),
            )

    def list_runs(self, limit: int = 25, experiment_id: str | None = None) -> list[dict]:
        query = """
            SELECT *
            FROM runs
        """
        params: tuple[object, ...]
        if experiment_id:
            query += " WHERE experiment_id = ?"
            params = (experiment_id, limit)
        else:
            params = (limit,)
        query += " ORDER BY datetime(created_at) DESC, rowid DESC LIMIT ?"

        with self._connect() as connection:
            rows = connection.execute(query, params).fetchall()
        return [dict(row) for row in rows]

    def count(self) -> int:
        with self._connect() as connection:
            row = connection.execute("SELECT COUNT(*) AS count FROM runs").fetchone()
        return int(row["count"]) if row else 0

    def average(self, field_name: str) -> float:
        if field_name not in ALLOWED_AVERAGE_FIELDS:
            raise ValueError(f"Unsupported average field: {field_name}")
        with self._connect() as connection:
            row = connection.execute(
                f"SELECT AVG({field_name}) AS average_value FROM runs"
            ).fetchone()
        value = row["average_value"] if row else None
        return float(value) if value is not None else 0.0

    def latest_protocol(self) -> str:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT protocol
                FROM runs
                ORDER BY datetime(created_at) DESC, rowid DESC
                LIMIT 1
                """
            ).fetchone()
        return str(row["protocol"]) if row else "aqshield"

    def upsert_experiment(self, payload: dict) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO experiments (
                    experiment_id,
                    name,
                    status,
                    protocols,
                    iterations,
                    message,
                    noise_min,
                    noise_max,
                    photon_loss_min,
                    photon_loss_max,
                    attack_intensity_min,
                    attack_intensity_max,
                    attack_type,
                    latency_ms,
                    total_runs,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
                """,
                (
                    payload["experiment_id"],
                    payload["name"],
                    payload["status"],
                    payload["protocols"],
                    payload["iterations"],
                    payload["message"],
                    payload["noise_min"],
                    payload["noise_max"],
                    payload["photon_loss_min"],
                    payload["photon_loss_max"],
                    payload["attack_intensity_min"],
                    payload["attack_intensity_max"],
                    payload.get("attack_type"),
                    payload["latency_ms"],
                    payload["total_runs"],
                    payload.get("created_at"),
                ),
            )

    def replace_experiment_summaries(self, experiment_id: str, summaries: list[dict]) -> None:
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM experiment_summaries WHERE experiment_id = ?",
                (experiment_id,),
            )
            for summary in summaries:
                connection.execute(
                    """
                    INSERT INTO experiment_summaries (
                        experiment_id,
                        protocol,
                        total_runs,
                        success_rate,
                        average_qber,
                        average_latency_ms,
                        average_throughput,
                        average_fidelity,
                        average_detection_rate,
                        average_secure_message_rate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        experiment_id,
                        summary["protocol"],
                        summary["total_runs"],
                        summary["success_rate"],
                        summary["average_qber"],
                        summary["average_latency_ms"],
                        summary["average_throughput"],
                        summary["average_fidelity"],
                        summary["average_detection_rate"],
                        summary["average_secure_message_rate"],
                    ),
                )

    def get_experiment(self, experiment_id: str) -> dict | None:
        with self._connect() as connection:
            experiment = connection.execute(
                """
                SELECT *
                FROM experiments
                WHERE experiment_id = ?
                """,
                (experiment_id,),
            ).fetchone()
        return dict(experiment) if experiment else None

    def list_experiments(self, limit: int = 25) -> list[dict]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM experiments
                ORDER BY datetime(created_at) DESC, rowid DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def list_experiment_summaries(self, experiment_id: str) -> list[dict]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM experiment_summaries
                WHERE experiment_id = ?
                ORDER BY protocol
                """,
                (experiment_id,),
            ).fetchall()
        return [dict(row) for row in rows]


repository = SQLiteRepository()
run_repository = repository
experiment_repository = repository
