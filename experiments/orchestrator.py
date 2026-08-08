from dataclasses import dataclass


DEFAULT_PROTOCOLS = ["aqshield", "bb84", "ping-pong", "deng-long"]


@dataclass(slots=True)
class ExperimentPlan:
    protocols: list[str]
    iterations: int
    message: str
    noise_min: float
    noise_max: float
    photon_loss_min: float
    photon_loss_max: float
    attack_intensity_min: float
    attack_intensity_max: float
    attack_type: str | None
    latency_ms: float


@dataclass(slots=True)
class SweepPoint:
    noise_level: float
    photon_loss: float
    attack_intensity: float


def build_experiment_plan(
    protocols: list[str],
    iterations: int,
    message: str,
    noise_min: float,
    noise_max: float,
    photon_loss_min: float,
    photon_loss_max: float,
    attack_intensity_min: float,
    attack_intensity_max: float,
    attack_type: str | None,
    latency_ms: float,
) -> ExperimentPlan:
    ordered_protocols = list(dict.fromkeys(protocols or DEFAULT_PROTOCOLS))
    return ExperimentPlan(
        protocols=ordered_protocols,
        iterations=iterations,
        message=message,
        noise_min=noise_min,
        noise_max=noise_max,
        photon_loss_min=photon_loss_min,
        photon_loss_max=photon_loss_max,
        attack_intensity_min=attack_intensity_min,
        attack_intensity_max=attack_intensity_max,
        attack_type=attack_type,
        latency_ms=latency_ms,
    )


def generate_sweep_points(plan: ExperimentPlan) -> list[SweepPoint]:
    return [
        SweepPoint(
            noise_level=_interpolate(plan.noise_min, plan.noise_max, plan.iterations, index),
            photon_loss=_interpolate(
                plan.photon_loss_min, plan.photon_loss_max, plan.iterations, index
            ),
            attack_intensity=_interpolate(
                plan.attack_intensity_min,
                plan.attack_intensity_max,
                plan.iterations,
                index,
            ),
        )
        for index in range(plan.iterations)
    ]


def _interpolate(minimum: float, maximum: float, total_steps: int, step_index: int) -> float:
    if total_steps <= 1:
        return round(minimum, 4)
    ratio = step_index / (total_steps - 1)
    return round(minimum + ((maximum - minimum) * ratio), 4)
