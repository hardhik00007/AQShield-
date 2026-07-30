from protocols.base import ProtocolAdapter, ProtocolContext, ProtocolResult


def _adaptive_decoy_rate(context: ProtocolContext) -> float:
    return min(0.35, 0.1 + (context.noise_level * 0.8) + (context.attack_intensity * 0.5))


class AQShieldProtocol(ProtocolAdapter):
    protocol_id = "aqshield"
    protocol_name = "AQShield Adaptive QSDC"

    def execute(self, context: ProtocolContext) -> ProtocolResult:
        high_risk = context.noise_level > 0.12 or context.attack_intensity > 0.2
        return ProtocolResult(
            transmitted_message=context.message,
            recovered_message=context.message,
            basis_strategy="adaptive-channel-aware",
            decoy_rate=round(_adaptive_decoy_rate(context), 3),
            protocol_family="adaptive-qsdc",
            authentication_mode="hybrid-quantum-classical",
            error_resilience=0.88 if high_risk else 0.78,
            detection_sensitivity=0.9,
            throughput_factor=0.82 if high_risk else 0.9,
            control_rounds=4 if high_risk else 3,
        )


class BB84Protocol(ProtocolAdapter):
    protocol_id = "bb84"
    protocol_name = "BB84 Baseline"

    def execute(self, context: ProtocolContext) -> ProtocolResult:
        return ProtocolResult(
            transmitted_message=context.message,
            recovered_message=context.message,
            basis_strategy="fixed-random",
            decoy_rate=0.0,
            protocol_family="qkd-inspired",
            authentication_mode="classical-post-key",
            error_resilience=0.42,
            detection_sensitivity=0.76,
            throughput_factor=0.72,
            control_rounds=2,
        )


class PingPongProtocol(ProtocolAdapter):
    protocol_id = "ping-pong"
    protocol_name = "Ping-Pong QSDC"

    def execute(self, context: ProtocolContext) -> ProtocolResult:
        decoy_rate = 0.08 if context.attack_intensity > 0.15 else 0.04
        return ProtocolResult(
            transmitted_message=context.message,
            recovered_message=context.message,
            basis_strategy="entangled-pair",
            decoy_rate=decoy_rate,
            protocol_family="qsdc",
            authentication_mode="entanglement-challenge",
            error_resilience=0.62,
            detection_sensitivity=0.68,
            throughput_factor=0.93,
            control_rounds=2,
        )


class DengLongProtocol(ProtocolAdapter):
    protocol_id = "deng-long"
    protocol_name = "Deng-Long QSDC"

    def execute(self, context: ProtocolContext) -> ProtocolResult:
        elevated_decoy = context.noise_level > 0.08 or context.attack_intensity > 0.1
        return ProtocolResult(
            transmitted_message=context.message,
            recovered_message=context.message,
            basis_strategy="two-step",
            decoy_rate=0.16 if elevated_decoy else 0.1,
            protocol_family="qsdc",
            authentication_mode="two-step-verification",
            error_resilience=0.74,
            detection_sensitivity=0.84,
            throughput_factor=0.81,
            control_rounds=3,
        )


PROTOCOLS: dict[str, ProtocolAdapter] = {
    "aqshield": AQShieldProtocol(),
    "bb84": BB84Protocol(),
    "ping-pong": PingPongProtocol(),
    "deng-long": DengLongProtocol(),
}


def get_protocol(protocol_id: str) -> ProtocolAdapter:
    return PROTOCOLS.get(protocol_id, PROTOCOLS["aqshield"])
