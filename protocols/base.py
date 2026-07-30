from dataclasses import dataclass


@dataclass(slots=True)
class ProtocolContext:
    protocol_id: str
    message: str
    noise_level: float
    photon_loss: float
    latency_ms: float
    attack_type: str | None = None
    attack_intensity: float = 0.0


@dataclass(slots=True)
class ProtocolResult:
    transmitted_message: str
    recovered_message: str
    basis_strategy: str
    decoy_rate: float
    protocol_family: str
    authentication_mode: str
    error_resilience: float
    detection_sensitivity: float
    throughput_factor: float
    control_rounds: int


class ProtocolAdapter:
    """Base contract for protocol implementations."""

    protocol_id: str = "base"
    protocol_name: str = "Base Protocol"

    def execute(self, context: ProtocolContext) -> ProtocolResult:
        raise NotImplementedError
