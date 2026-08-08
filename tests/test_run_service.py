from backend.app.schemas.runs import AttackConfig, ChannelConfig, RunRequest
from backend.app.services.run_service import list_recent_runs, run_simulation


def test_run_simulation_returns_structured_response() -> None:
    payload = RunRequest(
        protocol="aqshield",
        message="HELLO",
        channel=ChannelConfig(noise_level=0.05, photon_loss=0.02, latency_ms=5.0),
        attack=AttackConfig(enabled=True, attack_type="intercept-resend", intensity=0.1),
    )

    response = run_simulation(payload)

    assert response.protocol == "aqshield"
    assert response.transmitted_message == "HELLO"
    assert response.status == "completed"
    assert response.qber >= 0.0
    assert response.throughput >= 0.0
    assert response.authentication_mode


def test_recent_runs_returns_persisted_records() -> None:
    payload = RunRequest(
        protocol="bb84",
        message="TEST",
        channel=ChannelConfig(noise_level=0.02, photon_loss=0.01, latency_ms=4.0),
        attack=AttackConfig(enabled=False),
    )

    run_simulation(payload)
    recent_runs = list_recent_runs(limit=5)

    assert recent_runs
    assert recent_runs[0].run_id
