from adaptive.models import AdaptationDecision
from simulation.channel import ChannelObservation


def decide_adaptation(observation: ChannelObservation) -> AdaptationDecision:
    if observation.qber_estimate > 0.15 or observation.attack_probability > 0.3:
        return AdaptationDecision(
            action="retry_with_high_decoy_and_auth_escalation",
            reason="High QBER indicates elevated channel risk.",
            recommended_decoy_rate=0.3,
        )
    if (
        observation.qber_estimate > 0.08
        or observation.photon_loss > 0.2
        or observation.effective_noise > 0.1
    ):
        return AdaptationDecision(
            action="increase_decoy_rate",
            reason="Moderate channel instability detected.",
            recommended_decoy_rate=0.2,
        )
    if observation.secure_message_rate < 0.68:
        return AdaptationDecision(
            action="rebalance_channel_profile",
            reason="Secure message rate is lower than the preferred operating band.",
            recommended_decoy_rate=0.15,
        )
    return AdaptationDecision(
        action="maintain_profile",
        reason="Channel conditions are stable.",
        recommended_decoy_rate=0.1,
    )
