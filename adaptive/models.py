from dataclasses import dataclass


@dataclass(slots=True)
class AdaptationDecision:
    action: str
    reason: str
    recommended_decoy_rate: float
