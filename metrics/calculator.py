from metrics.models import SimulationMetrics
from simulation.engine import TransmissionResult


def calculate_metrics(result: TransmissionResult) -> SimulationMetrics:
    qber = result.observation.qber_estimate
    throughput = (
        result.protocol_result.throughput_factor
        * (1.0 - min(result.observation.photon_loss, 0.95))
        * (1.0 - qber * 0.45)
    )
    fidelity = max(0.0, result.delivery_confidence * (1.0 - (qber * 0.35)))
    detection_rate = min(
        (result.observation.attack_probability * result.protocol_result.detection_sensitivity)
        + (result.protocol_result.decoy_rate * 0.55),
        1.0,
    )

    return SimulationMetrics(
        qber=round(qber, 4),
        latency_ms=round(result.observation.latency_ms, 2),
        throughput=round(throughput, 4),
        fidelity=round(fidelity, 4),
        detection_rate=round(detection_rate, 4),
        secure_message_rate=round(result.observation.secure_message_rate, 4),
    )
