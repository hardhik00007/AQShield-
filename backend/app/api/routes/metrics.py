from fastapi import APIRouter

from backend.app.schemas.metrics import MetricsSnapshot
from backend.app.services.metrics_service import get_metrics_snapshot


router = APIRouter()


@router.get("/snapshot", response_model=MetricsSnapshot)
def read_metrics_snapshot() -> MetricsSnapshot:
    return get_metrics_snapshot()
