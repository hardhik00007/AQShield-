from datetime import datetime
from collections import defaultdict
from uuid import uuid4

from database.repository import experiment_repository
from experiments.orchestrator import build_experiment_plan, generate_sweep_points

from backend.app.schemas.experiments import (
    ExperimentListItem,
    ExperimentReportResponse,
    ExperimentProtocolSummary,
    ExperimentRequest,
    ExperimentResponse,
)
from backend.app.schemas.runs import AttackConfig, ChannelConfig, RunRequest, RunResponse
from backend.app.services.run_service import execute_run


def create_experiment(payload: ExperimentRequest) -> ExperimentResponse:
    plan = build_experiment_plan(
        protocols=payload.protocols,
        iterations=payload.iterations,
        message=payload.message,
        noise_min=payload.noise_min,
        noise_max=payload.noise_max,
        photon_loss_min=payload.photon_loss_min,
        photon_loss_max=payload.photon_loss_max,
        attack_intensity_min=payload.attack_intensity_min,
        attack_intensity_max=payload.attack_intensity_max,
        attack_type=payload.attack_type,
        latency_ms=payload.latency_ms,
    )
    experiment_id = f"exp-{uuid4().hex[:8]}"

    base_record = {
        "experiment_id": experiment_id,
        "name": payload.name,
        "status": "running",
        "protocols": ",".join(plan.protocols),
        "iterations": plan.iterations,
        "message": plan.message,
        "noise_min": plan.noise_min,
        "noise_max": plan.noise_max,
        "photon_loss_min": plan.photon_loss_min,
        "photon_loss_max": plan.photon_loss_max,
        "attack_intensity_min": plan.attack_intensity_min,
        "attack_intensity_max": plan.attack_intensity_max,
        "attack_type": plan.attack_type,
        "latency_ms": plan.latency_ms,
        "total_runs": 0,
    }
    experiment_repository.upsert_experiment(base_record)

    protocol_runs = _execute_experiment_runs(plan, experiment_id)
    summaries = _summarize_protocol_runs(protocol_runs)
    total_runs = sum(summary.total_runs for summary in summaries)

    completed_record = {
        **base_record,
        "status": "completed",
        "total_runs": total_runs,
        "created_at": experiment_repository.get_experiment(experiment_id)["created_at"],
    }
    experiment_repository.upsert_experiment(completed_record)
    experiment_repository.replace_experiment_summaries(
        experiment_id,
        [summary.model_dump() for summary in summaries],
    )
    return get_experiment(experiment_id)


def list_experiments(limit: int = 25) -> list[ExperimentListItem]:
    rows = experiment_repository.list_experiments(limit=limit)
    return [
        ExperimentListItem(
            experiment_id=row["experiment_id"],
            name=row["name"],
            status=row["status"],
            protocols=_parse_protocols(row["protocols"]),
            iterations=row["iterations"],
            total_runs=row["total_runs"],
            created_at=row.get("created_at"),
        )
        for row in rows
    ]


def get_experiment(experiment_id: str) -> ExperimentResponse:
    experiment = experiment_repository.get_experiment(experiment_id)
    if not experiment:
        raise ValueError(f"Experiment not found: {experiment_id}")

    summaries = [
        ExperimentProtocolSummary(
            protocol=row["protocol"],
            total_runs=row["total_runs"],
            success_rate=row["success_rate"],
            average_qber=row["average_qber"],
            average_latency_ms=row["average_latency_ms"],
            average_throughput=row["average_throughput"],
            average_fidelity=row["average_fidelity"],
            average_detection_rate=row["average_detection_rate"],
            average_secure_message_rate=row["average_secure_message_rate"],
        )
        for row in experiment_repository.list_experiment_summaries(experiment_id)
    ]

    return ExperimentResponse(
        experiment_id=experiment["experiment_id"],
        name=experiment["name"],
        status=experiment["status"],
        protocols=_parse_protocols(experiment["protocols"]),
        iterations=experiment["iterations"],
        message=experiment["message"],
        noise_min=experiment["noise_min"],
        noise_max=experiment["noise_max"],
        photon_loss_min=experiment["photon_loss_min"],
        photon_loss_max=experiment["photon_loss_max"],
        attack_intensity_min=experiment["attack_intensity_min"],
        attack_intensity_max=experiment["attack_intensity_max"],
        attack_type=experiment.get("attack_type"),
        latency_ms=experiment["latency_ms"],
        total_runs=experiment["total_runs"],
        created_at=experiment.get("created_at"),
        summaries=summaries,
    )


def get_experiment_report(experiment_id: str) -> ExperimentReportResponse:
    experiment = get_experiment(experiment_id)
    if not experiment.summaries:
        raise ValueError(f"No reportable summaries found for experiment: {experiment_id}")

    strongest_protocol = max(
        experiment.summaries,
        key=lambda item: (
            item.average_secure_message_rate,
            item.average_fidelity,
            -item.average_qber,
        ),
    )
    weakest_protocol = min(
        experiment.summaries,
        key=lambda item: (
            item.average_secure_message_rate,
            item.average_fidelity,
            -item.average_qber,
        ),
    )

    findings = [
        (
            f"{strongest_protocol.protocol} delivered the strongest secure-message profile "
            f"with secure rate {strongest_protocol.average_secure_message_rate:.3f} "
            f"and fidelity {strongest_protocol.average_fidelity:.3f}."
        ),
        (
            f"{weakest_protocol.protocol} showed the weakest benchmark posture with "
            f"QBER {weakest_protocol.average_qber:.3f} and throughput "
            f"{weakest_protocol.average_throughput:.3f}."
        ),
        (
            f"The experiment executed {experiment.total_runs} total runs across "
            f"{len(experiment.protocols)} protocol families under the configured channel sweep."
        ),
    ]

    recommendations = [
        "Use AQShield runs as the adaptive reference baseline in review presentations.",
        "Increase attack-intensity and photon-loss sweeps next to stress protocol differences further.",
        "Export this benchmark brief alongside charts when preparing review or viva material.",
    ]

    overview = (
        f"{experiment.name} compares {', '.join(experiment.protocols)} across noise, "
        f"photon-loss, and attack-intensity sweeps to estimate secure communication resilience."
    )
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    headline = (
        f"{strongest_protocol.protocol} leads this benchmark under the current adaptive sweep."
    )
    markdown = _build_report_markdown(
        experiment=experiment,
        headline=headline,
        overview=overview,
        findings=findings,
        recommendations=recommendations,
        generated_at=generated_at,
    )

    return ExperimentReportResponse(
        experiment_id=experiment.experiment_id,
        name=experiment.name,
        generated_at=generated_at,
        headline=headline,
        overview=overview,
        findings=findings,
        recommendations=recommendations,
        markdown=markdown,
    )


def _execute_experiment_runs(
    plan,
    experiment_id: str,
) -> dict[str, list[RunResponse]]:
    sweep_points = generate_sweep_points(plan)
    collected: dict[str, list[RunResponse]] = defaultdict(list)

    for protocol in plan.protocols:
        for point in sweep_points:
            payload = RunRequest(
                protocol=protocol,
                message=plan.message,
                channel=ChannelConfig(
                    noise_level=point.noise_level,
                    photon_loss=point.photon_loss,
                    latency_ms=plan.latency_ms,
                ),
                attack=AttackConfig(
                    enabled=point.attack_intensity > 0.0,
                    attack_type=plan.attack_type,
                    intensity=point.attack_intensity,
                ),
            )
            collected[protocol].append(
                execute_run(payload, experiment_id=experiment_id, persist=True)
            )
    return collected


def _summarize_protocol_runs(
    protocol_runs: dict[str, list[RunResponse]]
) -> list[ExperimentProtocolSummary]:
    summaries: list[ExperimentProtocolSummary] = []

    for protocol, runs in protocol_runs.items():
        total_runs = len(runs)
        success_count = sum(1 for run in runs if run.status == "completed")
        summaries.append(
            ExperimentProtocolSummary(
                protocol=protocol,
                total_runs=total_runs,
                success_rate=round(success_count / total_runs if total_runs else 0.0, 4),
                average_qber=round(_average([run.qber for run in runs]), 4),
                average_latency_ms=round(_average([run.latency_ms for run in runs]), 4),
                average_throughput=round(_average([run.throughput for run in runs]), 4),
                average_fidelity=round(_average([run.fidelity for run in runs]), 4),
                average_detection_rate=round(
                    _average([run.detection_rate for run in runs]), 4
                ),
                average_secure_message_rate=round(
                    _average([run.secure_message_rate for run in runs]), 4
                ),
            )
        )

    return sorted(summaries, key=lambda item: item.protocol)


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _parse_protocols(raw_protocols: str) -> list[str]:
    return [protocol for protocol in raw_protocols.split(",") if protocol]


def _build_report_markdown(
    *,
    experiment: ExperimentResponse,
    headline: str,
    overview: str,
    findings: list[str],
    recommendations: list[str],
    generated_at: str,
) -> str:
    lines = [
        f"# AQShield Experiment Brief: {experiment.name}",
        "",
        f"Generated: {generated_at}",
        f"Experiment ID: {experiment.experiment_id}",
        "",
        f"## Headline",
        headline,
        "",
        "## Overview",
        overview,
        "",
        "## Scope",
        f"- Protocols: {', '.join(experiment.protocols)}",
        f"- Iterations per protocol: {experiment.iterations}",
        f"- Message: {experiment.message}",
        f"- Noise sweep: {experiment.noise_min:.2f} to {experiment.noise_max:.2f}",
        f"- Photon-loss sweep: {experiment.photon_loss_min:.2f} to {experiment.photon_loss_max:.2f}",
        f"- Attack-intensity sweep: {experiment.attack_intensity_min:.2f} to {experiment.attack_intensity_max:.2f}",
        "",
        "## Findings",
    ]
    lines.extend([f"- {item}" for item in findings])
    lines.extend(["", "## Recommendations"])
    lines.extend([f"- {item}" for item in recommendations])
    lines.extend(["", "## Protocol Summary"])
    for summary in experiment.summaries:
        lines.extend(
            [
                f"### {summary.protocol}",
                f"- Success rate: {summary.success_rate:.3f}",
                f"- Average QBER: {summary.average_qber:.3f}",
                f"- Average throughput: {summary.average_throughput:.3f}",
                f"- Average fidelity: {summary.average_fidelity:.3f}",
                f"- Average detection rate: {summary.average_detection_rate:.3f}",
                f"- Average secure message rate: {summary.average_secure_message_rate:.3f}",
                "",
            ]
        )
    return "\n".join(lines).strip()
