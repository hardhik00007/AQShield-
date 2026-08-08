from dataclasses import dataclass

from protocols.base import ProtocolContext, ProtocolResult
from simulation.channel import ChannelObservation


@dataclass(slots=True)
class TransmissionResult:
    protocol_result: ProtocolResult
    observation: ChannelObservation
    delivery_success: bool
    delivery_confidence: float


def _degrade_message(message: str, qber_estimate: float) -> str:
    if not message:
        return message
    corruption_span = max(1, int(len(message) * min(qber_estimate, 0.8)))
    preserved = max(0, len(message) - corruption_span)
    return f"{message[:preserved]}{'?' * corruption_span}"


def simulate_transmission(
    protocol_result: ProtocolResult,
    context: ProtocolContext,
    observation: ChannelObservation,
) -> TransmissionResult:
    success_threshold = 0.12 + (protocol_result.error_resilience * 0.18)
    loss_threshold = 0.22 + (protocol_result.error_resilience * 0.28)
    delivery_success = (
        observation.qber_estimate <= success_threshold and context.photon_loss <= loss_threshold
    )
    delivery_confidence = max(
        0.0,
        min(
            1.0,
            protocol_result.error_resilience
            * (1.0 - observation.qber_estimate)
            * (1.0 - context.photon_loss),
        ),
    )
    recovered_message = (
        protocol_result.recovered_message
        if delivery_success
        else _degrade_message(protocol_result.recovered_message, observation.qber_estimate)
    )

    return TransmissionResult(
        protocol_result=ProtocolResult(
            transmitted_message=protocol_result.transmitted_message,
            recovered_message=recovered_message,
            basis_strategy=protocol_result.basis_strategy,
            decoy_rate=protocol_result.decoy_rate,
            protocol_family=protocol_result.protocol_family,
            authentication_mode=protocol_result.authentication_mode,
            error_resilience=protocol_result.error_resilience,
            detection_sensitivity=protocol_result.detection_sensitivity,
            throughput_factor=protocol_result.throughput_factor,
            control_rounds=protocol_result.control_rounds,
        ),
        observation=observation,
        delivery_success=delivery_success,
        delivery_confidence=round(delivery_confidence, 4),
    )
