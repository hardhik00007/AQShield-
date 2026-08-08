from dataclasses import asdict

from adaptive.engine import decide_adaptation
from backend.app.schemas.quantum import QuantumPreviewRequest, QuantumPreviewResponse
from quantum.bb84_circuit import simulate_bb84
from simulation.channel import ChannelObservation


def run_quantum_preview(payload: QuantumPreviewRequest) -> QuantumPreviewResponse:
    result = simulate_bb84(
        num_qubits=payload.num_qubits,
        eavesdrop=payload.eavesdrop,
        seed=payload.seed,
    )

    # Feed the real, circuit-measured QBER into the same adaptive decision
    # logic used by the formula-based engine (adaptive/engine.py), unchanged.
    # An eavesdropper here is a certainty (ground truth from the simulation),
    # not an estimate, so attack_probability reflects that directly.
    observation = ChannelObservation(
        qber_estimate=result.qber,
        photon_loss=0.0,
        latency_ms=0.0,
        attack_probability=1.0 if payload.eavesdrop else 0.0,
        effective_noise=0.0,
        secure_message_rate=max(0.0, 1.0 - result.qber),
    )
    decision = decide_adaptation(observation)

    return QuantumPreviewResponse(
        num_qubits=result.num_qubits,
        eavesdrop=result.eavesdrop,
        trace=[asdict(trace) for trace in result.trace],
        sifted_key_length=result.sifted_key_length,
        matching_basis_rate=round(result.matching_basis_rate, 4),
        qber=result.qber,
        adaptation_action=decision.action,
        adaptation_reason=decision.reason,
        recommended_decoy_rate=decision.recommended_decoy_rate,
    )
