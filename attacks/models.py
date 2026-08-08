from dataclasses import dataclass


@dataclass(slots=True)
class AttackEvent:
    enabled: bool
    attack_type: str | None
    intensity: float
