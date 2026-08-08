from fastapi import APIRouter

from backend.app.schemas.runs import PersistedRunResponse, RunRequest, RunResponse
from backend.app.services.run_service import list_recent_runs, run_simulation


router = APIRouter()


@router.post("", response_model=RunResponse)
def create_run(payload: RunRequest) -> RunResponse:
    return run_simulation(payload)


@router.get("", response_model=list[PersistedRunResponse])
def get_recent_runs(limit: int = 25) -> list[PersistedRunResponse]:
    return list_recent_runs(limit=limit)
