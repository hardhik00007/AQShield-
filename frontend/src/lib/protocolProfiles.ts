export type ProtocolProfile = {
  icon: string
  summary: string
  strengths: string
  weaknesses: string
  useCases: string
  resistance: string
  adaptive: string
}

export const protocolProfiles: Record<string, ProtocolProfile> = {
  aqshield: {
    icon: 'AQ',
    summary: 'Adaptive QSDC reference profile with channel-aware decisions.',
    strengths: 'Strong secure-rate profile, adaptive basis/decoy behavior, better resilience.',
    weaknesses: 'Higher orchestration complexity and slightly increased control overhead.',
    useCases: 'Defence research baselines, tactical channels, adaptive mission links.',
    resistance: 'Best overall hostile-channel posture in the current prototype.',
    adaptive: 'High',
  },
  bb84: {
    icon: 'B8',
    summary: 'QKD-inspired baseline used as a comparison reference.',
    strengths: 'Simple baseline, familiar academic reference, predictable behavior.',
    weaknesses: 'Lower direct-message resilience and less adaptive behavior.',
    useCases: 'Benchmark baseline and educational comparison.',
    resistance: 'Moderate',
    adaptive: 'Low',
  },
  'ping-pong': {
    icon: 'PP',
    summary: 'Entanglement-driven QSDC family for direct communication comparisons.',
    strengths: 'Strong throughput profile and direct communication framing.',
    weaknesses: 'More sensitive to some attack/noise combinations than AQShield.',
    useCases: 'QSDC benchmarking and entanglement-based comparisons.',
    resistance: 'Moderate to strong',
    adaptive: 'Medium',
  },
  'deng-long': {
    icon: 'DL',
    summary: 'Two-step QSDC comparison model with stronger verification posture.',
    strengths: 'Balanced verification, stronger detection behavior than simple baselines.',
    weaknesses: 'Less flexible than AQShield under shifting channel conditions.',
    useCases: 'Two-step secure communication benchmarking.',
    resistance: 'Strong',
    adaptive: 'Medium',
  },
}
