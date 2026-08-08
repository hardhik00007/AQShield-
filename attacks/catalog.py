"""Descriptive and numeric catalog of adversarial attack families.

Each entry defines both the human-facing metadata used by the Attack Center
UI and a numeric "signature" used by the simulation/channel layer to make
different attack types behave differently instead of only scaling a single
generic intensity term.
"""

from dataclasses import dataclass, field


@dataclass(slots=True)
class AttackSignature:
    """Weights controlling how this attack type influences channel behaviour.

    All weights are multiplied by `attack_intensity` (0..1) when composing
    the channel observation, so a weight of 1.0 means "as strong as the
    original generic intercept-resend baseline" and other values scale
    relative to that reference point.
    """

    qber_weight: float
    detection_weight: float
    latency_weight: float
    photon_loss_weight: float


@dataclass(slots=True)
class AttackProfile:
    attack_id: str
    label: str
    category: str
    threat_level: str
    description: str
    symptoms: list[str]
    adaptive_response: str
    recovery_strategy: str
    signature: AttackSignature = field(repr=False)


ATTACK_PROFILES: dict[str, AttackProfile] = {
    "intercept-resend": AttackProfile(
        attack_id="intercept-resend",
        label="Intercept-Resend",
        category="eavesdropping",
        threat_level="Elevated",
        description=(
            "Adversary measures each transmitted qubit and resends a substitute, "
            "introducing a measurable disturbance in the channel."
        ),
        symptoms=["Sharp QBER rise", "High detection probability"],
        adaptive_response="Escalates decoy rate and authentication verification.",
        recovery_strategy="Retransmit under an increased decoy-state sampling rate.",
        signature=AttackSignature(
            qber_weight=0.30, detection_weight=1.05, latency_weight=0.0, photon_loss_weight=0.0
        ),
    ),
    "noise-injection": AttackProfile(
        attack_id="noise-injection",
        label="Noise Injection",
        category="channel-degradation",
        threat_level="Moderate",
        description=(
            "Adversary floods the channel with environmental noise rather than "
            "directly measuring qubits, making the disturbance harder to attribute."
        ),
        symptoms=["Gradual QBER drift", "Lower distinguishability from natural noise"],
        adaptive_response="Increases error-correction overhead ahead of authentication escalation.",
        recovery_strategy="Rebalance the channel profile and widen the error-correction margin.",
        signature=AttackSignature(
            qber_weight=0.55, detection_weight=0.5, latency_weight=0.05, photon_loss_weight=0.1
        ),
    ),
    "packet-disruption": AttackProfile(
        attack_id="packet-disruption",
        label="Packet Disruption",
        category="denial",
        threat_level="Moderate",
        description="Adversary selectively drops or corrupts transmitted packets in transit.",
        symptoms=["Elevated photon loss", "Retransmission spikes"],
        adaptive_response="Throttles transmission rate and increases the retry budget.",
        recovery_strategy="Switch to redundant framing and retransmit lost segments.",
        signature=AttackSignature(
            qber_weight=0.15, detection_weight=0.35, latency_weight=0.05, photon_loss_weight=0.6
        ),
    ),
    "replay": AttackProfile(
        attack_id="replay",
        label="Replay Attack",
        category="authentication",
        threat_level="Elevated",
        description="Adversary captures and re-transmits previously observed protocol traffic.",
        symptoms=["Authentication mismatch", "Timestamp anomalies"],
        adaptive_response="Escalates authentication and rejects stale session tokens.",
        recovery_strategy="Force a session re-key and reject replayed frames.",
        signature=AttackSignature(
            qber_weight=0.10, detection_weight=0.85, latency_weight=0.02, photon_loss_weight=0.0
        ),
    ),
    "man-in-the-middle": AttackProfile(
        attack_id="man-in-the-middle",
        label="Man-in-the-Middle",
        category="interception",
        threat_level="Severe",
        description="Adversary sits between sender and receiver, relaying and altering the exchange.",
        symptoms=["Simultaneous QBER and latency spike", "Authentication mismatch"],
        adaptive_response="Triggers hard authentication escalation and channel isolation.",
        recovery_strategy="Abort the session and re-establish over a verified channel.",
        signature=AttackSignature(
            qber_weight=0.42, detection_weight=1.15, latency_weight=0.08, photon_loss_weight=0.05
        ),
    ),
    "fake-node": AttackProfile(
        attack_id="fake-node",
        label="Fake Node",
        category="topology",
        threat_level="Elevated",
        description="Adversary introduces an unauthorized relay node into the communication topology.",
        symptoms=["Unexpected routing hop", "Authentication signature mismatch"],
        adaptive_response="Flags the relay and reroutes around the unverified hop.",
        recovery_strategy="Re-route through verified relay nodes only.",
        signature=AttackSignature(
            qber_weight=0.20, detection_weight=0.95, latency_weight=0.10, photon_loss_weight=0.15
        ),
    ),
    "photon-splitting": AttackProfile(
        attack_id="photon-splitting",
        label="Photon-Splitting (approximation)",
        category="eavesdropping",
        threat_level="Moderate",
        description=(
            "Adversary approximates a beam-splitting attack, skimming partial photon "
            "information without fully measuring the state."
        ),
        symptoms=["Elevated photon loss with modest QBER change", "Lower signal fidelity"],
        adaptive_response="Increases decoy-state frequency to bound information leakage.",
        recovery_strategy="Apply stricter decoy-state analysis before continuing transmission.",
        signature=AttackSignature(
            qber_weight=0.12, detection_weight=0.6, latency_weight=0.0, photon_loss_weight=0.35
        ),
    ),
    "denial-of-communication": AttackProfile(
        attack_id="denial-of-communication",
        label="Denial of Communication",
        category="denial",
        threat_level="Severe",
        description="Adversary aims to block or exhaust the channel rather than eavesdrop on it.",
        symptoms=["Severe photon loss", "Latency spikes", "Delivery failures"],
        adaptive_response="Throttles and queues traffic, escalating to backup routing.",
        recovery_strategy="Fail over to an alternate relay path or hold transmission.",
        signature=AttackSignature(
            qber_weight=0.05, detection_weight=0.4, latency_weight=0.5, photon_loss_weight=0.7
        ),
    ),
}

DEFAULT_SIGNATURE = AttackSignature(
    qber_weight=0.28, detection_weight=1.1, latency_weight=0.0, photon_loss_weight=0.0
)


def get_signature(attack_type: str | None) -> AttackSignature:
    if not attack_type:
        return DEFAULT_SIGNATURE
    profile = ATTACK_PROFILES.get(attack_type)
    return profile.signature if profile else DEFAULT_SIGNATURE


def list_attack_profiles() -> list[dict]:
    return [
        {
            "id": profile.attack_id,
            "label": profile.label,
            "category": profile.category,
            "threat_level": profile.threat_level,
            "description": profile.description,
            "symptoms": profile.symptoms,
            "adaptive_response": profile.adaptive_response,
            "recovery_strategy": profile.recovery_strategy,
        }
        for profile in ATTACK_PROFILES.values()
    ]
