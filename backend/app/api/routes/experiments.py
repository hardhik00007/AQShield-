from fastapi import APIRouter, HTTPException

from backend.app.schemas.experiments import (
    ExperimentListItem,
    ExperimentReportResponse,
    ExperimentRequest,
    ExperimentResponse,
)
from backend.app.services.experiment_service import (
    create_experiment,
    get_experiment,
    get_experiment_report,
    list_experiments,
)


router = APIRouter()


@router.post("", response_model=ExperimentResponse)
def schedule_experiment(payload: ExperimentRequest) -> ExperimentResponse:
    return create_experiment(payload)


@router.get("", response_model=list[ExperimentListItem])
def read_experiments(limit: int = 25) -> list[ExperimentListItem]:
    return list_experiments(limit=limit)


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def read_experiment(experiment_id: str) -> ExperimentResponse:
    try:
        return get_experiment(experiment_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{experiment_id}/report", response_model=ExperimentReportResponse)
def read_experiment_report(experiment_id: str) -> ExperimentReportResponse:
    try:
        return get_experiment_report(experiment_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
