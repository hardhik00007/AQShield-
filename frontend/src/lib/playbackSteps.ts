export type PlaybackStage = {
  title: string
  detail: string
}

export const playbackSteps: PlaybackStage[] = [
  { title: 'Key generation', detail: 'Preparing basis choices and decoy-state parameters.' },
  { title: 'Encoding secure message', detail: 'Mapping the plaintext payload onto the protocol frame.' },
  { title: 'Transmitting across channel', detail: 'Sending the encoded frame across the simulated channel.' },
  { title: 'Noise injection', detail: 'Channel noise and photon loss are applied to the transmission.' },
  { title: 'Attack detection', detail: 'Evaluating disturbance signatures for hostile interference.' },
  { title: 'Adaptive engine response', detail: 'Deciding whether to adjust decoy rate or escalate posture.' },
  { title: 'Authentication', detail: 'Verifying session trust before allowing recovery to proceed.' },
  { title: 'Recovery', detail: 'Attempting to reconstruct the transmitted message from the channel.' },
  { title: 'Secure delivery', detail: 'Confirming whether the message was delivered within tolerance.' },
  { title: 'Final report', detail: 'Aggregating metrics and persisting the run for later analysis.' },
]
