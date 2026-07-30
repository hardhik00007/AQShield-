from attacks.models import AttackEvent


def build_attack_event(enabled: bool, attack_type: str | None, intensity: float) -> AttackEvent:
    if not enabled:
        return AttackEvent(enabled=False, attack_type=None, intensity=0.0)
    return AttackEvent(enabled=True, attack_type=attack_type or "unknown", intensity=intensity)
