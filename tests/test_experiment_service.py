from backend.app.schemas.experiments import ExperimentRequest
from backend.app.services.experiment_service import (
    create_experiment,
    get_experiment_report,
    list_experiments,
)


def test_create_experiment_returns_protocol_summaries() -> None:
    response = create_experiment(
        ExperimentRequest(
            name="benchmark-alpha",
            protocols=["aqshield", "bb84"],
            iterations=2,
            noise_min=0.01,
            noise_max=0.05,
            photon_loss_min=0.0,
            photon_loss_max=0.03,
            attack_intensity_min=0.0,
            attack_intensity_max=0.1,
        )
    )

    assert response.experiment_id
    assert response.total_runs == 4
    assert len(response.summaries) == 2


def test_list_experiments_returns_created_campaigns() -> None:
    experiments = list_experiments(limit=5)
    assert experiments


def test_experiment_report_contains_markdown_and_findings() -> None:
    created = create_experiment(
        ExperimentRequest(
            name="benchmark-report",
            protocols=["aqshield", "bb84"],
            iterations=2,
        )
    )

    report = get_experiment_report(created.experiment_id)

    assert report.headline
    assert report.findings
    assert "AQShield Experiment Brief" in report.markdown
