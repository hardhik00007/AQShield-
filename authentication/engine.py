from adaptive.models import AdaptationDecision


def verify_session(decision: AdaptationDecision) -> tuple[bool, str]:
    if decision.action == "retry_with_high_decoy_and_auth_escalation":
        return True, "elevated-verification"
    return True, "standard-verification"
