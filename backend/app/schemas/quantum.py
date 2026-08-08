from pydantic import BaseModel, Field


class QuantumPreviewRequest(BaseModel):
    num_qubits: int = Field(default=24, ge=4, le=48)
    eavesdrop: bool = False
    seed: int | None = None


class QubitTraceEntry(BaseModel):
    index: int
    alice_bit: int
    alice_basis: str
    eve_basis: str | None = None
    eve_bit: int | None = None
    bob_basis: str
    bob_bit: int
    bases_match: bool
    kept: bool
    error: bool


class QuantumPreviewResponse(BaseModel):
    num_qubits: int
    eavesdrop: bool
    trace: list[QubitTraceEntry]
    sifted_key_length: int
    matching_basis_rate: float
    qber: float
    adaptation_action: str
    adaptation_reason: str
    recommended_decoy_rate: float
