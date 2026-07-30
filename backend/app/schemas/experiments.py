from pydantic import BaseModel, Field, model_validator


class ExperimentRequest(BaseModel):
    name: str = Field(..., description="Experiment campaign name.")
    protocols: list[str] = Field(
        default_factory=lambda: ["aqshield", "bb84", "ping-pong", "deng-long"],
        description="Protocols to benchmark in the experiment.",
    )
    iterations: int = Field(5, ge=1, le=1000, description="Runs per protocol.")
    message: str = Field("DEFENCE-COMMS", min_length=1)
    noise_min: float = Field(0.0, ge=0.0, le=1.0)
    noise_max: float = Field(0.2, ge=0.0, le=1.0)
    photon_loss_min: float = Field(0.0, ge=0.0, le=1.0)
    photon_loss_max: float = Field(0.15, ge=0.0, le=1.0)
    attack_intensity_min: float = Field(0.0, ge=0.0, le=1.0)
    attack_intensity_max: float = Field(0.2, ge=0.0, le=1.0)
    attack_type: str | None = Field("intercept-resend")
    latency_ms: float = Field(5.0, ge=0.0)

    @model_validator(mode="after")
    def validate_ranges(self) -> "ExperimentRequest":
        if not self.protocols:
            raise ValueError("At least one protocol must be selected.")
        if self.noise_max < self.noise_min:
            raise ValueError("noise_max must be greater than or equal to noise_min.")
        if self.photon_loss_max < self.photon_loss_min:
            raise ValueError(
                "photon_loss_max must be greater than or equal to photon_loss_min."
            )
        if self.attack_intensity_max < self.attack_intensity_min:
            raise ValueError(
                "attack_intensity_max must be greater than or equal to attack_intensity_min."
            )
        return self


class ExperimentProtocolSummary(BaseModel):
    protocol: str
    total_runs: int
    success_rate: float
    average_qber: float
    average_latency_ms: float
    average_throughput: float
    average_fidelity: float
    average_detection_rate: float
    average_secure_message_rate: float


class ExperimentListItem(BaseModel):
    experiment_id: str
    name: str
    status: str
    protocols: list[str]
    iterations: int
    total_runs: int
    created_at: str | None = None


class ExperimentResponse(BaseModel):
    experiment_id: str
    name: str
    status: str
    protocols: list[str]
    iterations: int
    message: str
    noise_min: float
    noise_max: float
    photon_loss_min: float
    photon_loss_max: float
    attack_intensity_min: float
    attack_intensity_max: float
    attack_type: str | None = None
    latency_ms: float
    total_runs: int
    created_at: str | None = None
    summaries: list[ExperimentProtocolSummary]


class ExperimentReportResponse(BaseModel):
    experiment_id: str
    name: str
    generated_at: str
    headline: str
    overview: str
    findings: list[str]
    recommendations: list[str]
    markdown: str
