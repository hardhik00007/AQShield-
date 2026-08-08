from database.repository import run_repository

from backend.app.schemas.metrics import MetricsSnapshot


def get_metrics_snapshot() -> MetricsSnapshot:
    return MetricsSnapshot(
        total_runs=run_repository.count(),
        average_qber=round(run_repository.average("qber"), 4),
        average_latency_ms=round(run_repository.average("latency_ms"), 4),
        active_protocol=run_repository.latest_protocol(),
    )
