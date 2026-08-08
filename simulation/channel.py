from dataclasses import dataclass

from attacks.catalog import get_signature
from protocols.base import ProtocolContext, ProtocolResult


@dataclass(slots=True)
class ChannelState:
    noise_level: float
    photon_loss: float
    latency_ms: float


@dataclass(slots=True)
class ChannelObservation:
    qber_estimate: float
    photon_loss: float
    latency_ms: float
    attack_probability: float
    effective_noise: float
    secure_message_rate: float


def observe_channel(context: ProtocolContext, protocol_result: ProtocolResult) -> ChannelObservation:
    signature = get_signature(context.attack_type)

    # Attack-type-aware photon loss: some attacks (packet disruption, denial,
    # photon-splitting) primarily manifest as dropped/skimmed photons rather
    # than bit errors, so the effective photon loss seen downstream reflects
    # that attack's signature rather than only the configured channel loss.
    effective_photon_loss = min(
        max(context.photon_loss + context.attack_intensity * signature.photon_loss_weight * 0.3, 0.0),
        1.0,
    )

    base_qber = (
        context.noise_level * 0.52
        + effective_photon_loss * 0.18
        + context.attack_intensity * signature.qber_weight
    )
    resilience_gain = protocol_result.error_resilience * 0.12
    decoy_gain = protocol_result.decoy_rate * 0.08
    qber_estimate = min(max(base_qber - resilience_gain - decoy_gain, 0.0), 1.0)
    attack_probability = min(
        context.attack_intensity * signature.detection_weight
        + context.noise_level * 0.1
        + (1.0 - protocol_result.detection_sensitivity) * 0.15,
        1.0,
    )
    effective_noise = min(
        max(context.noise_level - protocol_result.error_resilience * 0.08, 0.0),
        1.0,
    )
    secure_message_rate = min(
        max(
            protocol_result.throughput_factor
            * (1.0 - qber_estimate)
            * (1.0 - effective_photon_loss * 0.5),
            0.0,
        ),
        1.0,
    )
    # Attack-type-aware latency: MITM and denial-style attacks add real delay
    # (relaying, queuing, retries); pure eavesdropping attacks barely do.
    latency_ms = context.latency_ms * (
        1.0
        + (protocol_result.decoy_rate * 0.45)
        + (protocol_result.control_rounds * 0.04)
        + (context.attack_intensity * signature.latency_weight)
    )

    return ChannelObservation(
        qber_estimate=round(qber_estimate, 4),
        photon_loss=round(effective_photon_loss, 4),
        latency_ms=round(latency_ms, 2),
        attack_probability=round(attack_probability, 4),
        effective_noise=round(effective_noise, 4),
        secure_message_rate=round(secure_message_rate, 4),
    )
