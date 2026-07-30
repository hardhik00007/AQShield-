from pydantic import BaseModel, Field


class AttackConfig(BaseModel):
    enabled: bool = False
    attack_type: str | None = None
    intensity: float = Field(0.0, ge=0.0, le=1.0)


class ChannelConfig(BaseModel):
    noise_level: float = Field(0.0, ge=0.0, le=1.0)
    photon_loss: float = Field(0.0, ge=0.0, le=1.0)
    latency_ms: float = Field(5.0, ge=0.0)


class RunRequest(BaseModel):
    protocol: str = Field(..., description="Selected protocol identifier.")
    message: str = Field(..., min_length=1, description="Plaintext test message.")
    channel: ChannelConfig
    attack: AttackConfig = AttackConfig()


class RunResponse(BaseModel):
    run_id: str
    protocol: str
    status: str
    transmitted_message: str
    recovered_message: str
    qber: float
    latency_ms: float
    throughput: float
    fidelity: float
    detection_rate: float
    secure_message_rate: float
    basis_strategy: str
    decoy_rate: float
    authentication_mode: str
    adaptation_action: str


class PersistedRunResponse(RunResponse):
    experiment_id: str | None = None
    attack_type: str | None = None
    attack_intensity: float
    noise_level: float
    photon_loss: float
    created_at: str | None = None
