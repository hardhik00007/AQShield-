from fastapi import APIRouter

from backend.app.schemas.quantum import QuantumPreviewRequest, QuantumPreviewResponse
from backend.app.services.quantum_service import run_quantum_preview

router = APIRouter()


@router.post("/bb84-preview", response_model=QuantumPreviewResponse)
def bb84_preview(payload: QuantumPreviewRequest) -> QuantumPreviewResponse:
    return run_quantum_preview(payload)
