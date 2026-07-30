from uuid import uuid4

from adaptive.engine import decide_adaptation
from attacks.engine import build_attack_event
from authentication.engine import verify_session
from database.repository import run_repository
from metrics.calculator import calculate_metrics
from protocols.base import ProtocolContext
from protocols.registry import get_protocol
from simulation.channel import observe_channel
from simulation.engine import simulate_transmission

from backend.app.schemas.runs import PersistedRunResponse, RunRequest, RunResponse


def execute_run(
    payload: RunRequest,
    *,
    experiment_id: str | None = None,
    persist: bool = True,
) -> RunResponse:
    attack = build_attack_event(
        enabled=payload.attack.enabled,
        attack_type=payload.attack.attack_type,
        intensity=payload.attack.intensity,
    )
    context = ProtocolContext(
        protocol_id=payload.protocol,
        message=payload.message,
        noise_level=payload.channel.noise_level,
        photon_loss=payload.channel.photon_loss,
        latency_ms=payload.channel.latency_ms,
        attack_type=attack.attack_type,
        attack_intensity=attack.intensity,
    )

    protocol = get_protocol(payload.protocol)
    protocol_result = protocol.execute(context)
    observation = observe_channel(context, protocol_result)
    decision = decide_adaptation(observation)
    verified, _level = verify_session(decision)
    transmission = simulate_transmission(protocol_result, context, observation)
    metrics = calculate_metrics(transmission)

    response = RunResponse(
        run_id=f"run-{uuid4().hex[:8]}",
        protocol=payload.protocol,
        status="completed" if verified else "blocked",
        transmitted_message=transmission.protocol_result.transmitted_message,
        recovered_message=transmission.protocol_result.recovered_message,
        qber=metrics.qber,
        latency_ms=metrics.latency_ms,
        throughput=metrics.throughput,
        fidelity=metrics.fidelity,
        detection_rate=metrics.detection_rate,
        secure_message_rate=metrics.secure_message_rate,
        basis_strategy=transmission.protocol_result.basis_strategy,
        decoy_rate=transmission.protocol_result.decoy_rate,
        authentication_mode=transmission.protocol_result.authentication_mode,
        adaptation_action=decision.action,
    )
    persisted_run = {
        **response.model_dump(),
        "experiment_id": experiment_id,
        "attack_type": attack.attack_type,
        "attack_intensity": attack.intensity,
        "noise_level": context.noise_level,
        "photon_loss": context.photon_loss,
    }
    if persist:
        run_repository.add_run(persisted_run)
    return response


def run_simulation(payload: RunRequest) -> RunResponse:
    return execute_run(payload)


def list_recent_runs(
    limit: int = 25,
    *,
    experiment_id: str | None = None,
) -> list[PersistedRunResponse]:
    rows = run_repository.list_runs(limit=limit, experiment_id=experiment_id)
    return [PersistedRunResponse(**row) for row in rows]
