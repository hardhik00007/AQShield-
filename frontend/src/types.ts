export type Protocol = {
  id: string
  name: string
  category: string
}

export type MetricsSnapshot = {
  total_runs: number
  average_qber: number
  average_latency_ms: number
  active_protocol: string
}

export type ChannelConfig = {
  noise_level: number
  photon_loss: number
  latency_ms: number
}

export type AttackConfig = {
  enabled: boolean
  attack_type?: string | null
  intensity: number
}

export type RunRequest = {
  protocol: string
  message: string
  channel: ChannelConfig
  attack: AttackConfig
}

export type RunResponse = {
  run_id: string
  protocol: string
  status: string
  transmitted_message: string
  recovered_message: string
  qber: number
  latency_ms: number
  throughput: number
  fidelity: number
  detection_rate: number
  secure_message_rate: number
  basis_strategy: string
  decoy_rate: number
  authentication_mode: string
  adaptation_action: string
}

export type PersistedRunResponse = RunResponse & {
  experiment_id?: string | null
  attack_type?: string | null
  attack_intensity: number
  noise_level: number
  photon_loss: number
  created_at?: string | null
}

export type ExperimentRequest = {
  name: string
  protocols: string[]
  iterations: number
  message: string
  noise_min: number
  noise_max: number
  photon_loss_min: number
  photon_loss_max: number
  attack_intensity_min: number
  attack_intensity_max: number
  attack_type?: string | null
  latency_ms: number
}

export type ExperimentProtocolSummary = {
  protocol: string
  total_runs: number
  success_rate: number
  average_qber: number
  average_latency_ms: number
  average_throughput: number
  average_fidelity: number
  average_detection_rate: number
  average_secure_message_rate: number
}

export type ExperimentListItem = {
  experiment_id: string
  name: string
  status: string
  protocols: string[]
  iterations: number
  total_runs: number
  created_at?: string | null
}

export type ExperimentResponse = {
  experiment_id: string
  name: string
  status: string
  protocols: string[]
  iterations: number
  message: string
  noise_min: number
  noise_max: number
  photon_loss_min: number
  photon_loss_max: number
  attack_intensity_min: number
  attack_intensity_max: number
  attack_type?: string | null
  latency_ms: number
  total_runs: number
  created_at?: string | null
  summaries: ExperimentProtocolSummary[]
}

export type ExperimentReportResponse = {
  experiment_id: string
  name: string
  generated_at: string
  headline: string
  overview: string
  findings: string[]
  recommendations: string[]
  markdown: string
}

export type AttackProfile = {
  id: string
  label: string
  category: string
  threat_level: string
  description: string
  symptoms: string[]
  adaptive_response: string
  recovery_strategy: string
}

export type QubitTraceEntry = {
  index: number
  alice_bit: number
  alice_basis: string
  eve_basis: string | null
  eve_bit: number | null
  bob_basis: string
  bob_bit: number
  bases_match: boolean
  kept: boolean
  error: boolean
}

export type QuantumPreviewRequest = {
  num_qubits: number
  eavesdrop: boolean
  seed?: number | null
}

export type QuantumPreviewResponse = {
  num_qubits: number
  eavesdrop: boolean
  trace: QubitTraceEntry[]
  sifted_key_length: number
  matching_basis_rate: number
  qber: number
  adaptation_action: string
  adaptation_reason: string
  recommended_decoy_rate: number
}
