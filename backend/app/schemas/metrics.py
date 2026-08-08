from pydantic import BaseModel


class MetricsSnapshot(BaseModel):
    total_runs: int
    average_qber: float
    average_latency_ms: float
    active_protocol: str
