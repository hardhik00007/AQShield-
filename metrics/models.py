from dataclasses import dataclass


@dataclass(slots=True)
class SimulationMetrics:
    qber: float
    latency_ms: float
    throughput: float
    fidelity: float
    detection_rate: float
    secure_message_rate: float
