const REROUTE_ATTACKS = new Set(['man-in-the-middle', 'fake-node', 'denial-of-communication'])
const FLASH_STAGES = new Set(['Attack detection', 'Adaptive engine response'])

function statusClassFor(threatLabel: string): string {
  if (threatLabel === 'Elevated') {
    return 'status-elevated'
  }
  if (threatLabel === 'Guarded') {
    return 'status-guarded'
  }
  return 'status-secure'
}

export function MissionNetwork({
  noiseLevel,
  threatLabel,
  attackType,
  activeStageTitle,
}: {
  noiseLevel: number
  threatLabel: string
  attackType: string
  activeStageTitle?: string
}) {
  const statusClass = statusClassFor(threatLabel)
  const isDisturbed = threatLabel !== 'Stable'
  const isRerouting = isDisturbed && REROUTE_ATTACKS.has(attackType)
  const isFlashing = Boolean(activeStageTitle && FLASH_STAGES.has(activeStageTitle))

  return (
    <div className={`network-panel ${isDisturbed ? 'network-disturbed' : ''}`}>
      <div className="node satellite status-secure">Satellite</div>
      <div className="link pulse" />
      <div className="node ground status-secure">Ground Station</div>
      <div className={`link pulse delayed ${isDisturbed ? 'has-decoy' : ''}`} />
      <div className={`node relay ${statusClass} ${isFlashing ? 'flash' : ''}`}>Relay Node</div>
      <div className="link pulse" />
      <div className={`node receiver ${statusClass}`}>Receiver</div>

      {isRerouting ? (
        <div className="reroute-overlay">
          <div className="node relay-alt status-guarded">Relay Node B (backup)</div>
          <div className="reroute-line" />
          <span className="reroute-label">Adaptive rerouting engaged</span>
        </div>
      ) : null}

      <div className="network-badges">
        <span>Noise {noiseLevel.toFixed(2)}</span>
        <span>Threat {threatLabel}</span>
        <span>Attack {attackType}</span>
        {activeStageTitle ? <span>Stage: {activeStageTitle}</span> : null}
      </div>

      {isDisturbed ? (
        <div className="disturbance-cloud">
          <span />
          <span />
          <span />
        </div>
      ) : null}
    </div>
  )
}
