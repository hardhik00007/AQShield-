import { useState } from 'react'

import { createRun } from '../api'
import { DecisionStep } from '../components/MissionExtras'
import { MissionNetwork } from '../components/MissionNetwork'
import { useAqShieldData } from '../context/AqShieldDataContext'
import type { RunResponse } from '../types'

type Comparison = {
  clean: RunResponse
  attacked: RunResponse
}

export function AttackCenterPage() {
  const { attackCatalog, threatLabel, latestRun, protocols, setErrorMessage } = useAqShieldData()
  const [selectedAttack, setSelectedAttack] = useState(attackCatalog[0]?.id ?? 'intercept-resend')
  const [intensity, setIntensity] = useState(0.35)
  const [protocol, setProtocol] = useState('aqshield')
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [comparing, setComparing] = useState(false)

  const runComparison = async () => {
    setComparing(true)
    setErrorMessage(null)
    try {
      const baseRequest = {
        protocol,
        message: 'ATTACK-CENTER-PROBE',
        channel: { noise_level: 0.06, photon_loss: 0.03, latency_ms: 5 },
      }
      const [clean, attacked] = await Promise.all([
        createRun({ ...baseRequest, attack: { enabled: false, attack_type: null, intensity: 0 } }),
        createRun({
          ...baseRequest,
          attack: { enabled: true, attack_type: selectedAttack, intensity },
        }),
      ])
      setComparison({ clean, attacked })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Comparison run failed.')
    } finally {
      setComparing(false)
    }
  }

  const activeProfile = attackCatalog.find((profile) => profile.id === selectedAttack)

  const delta = (key: keyof RunResponse) => {
    if (!comparison) return null
    const cleanValue = comparison.clean[key]
    const attackedValue = comparison.attacked[key]
    if (typeof cleanValue !== 'number' || typeof attackedValue !== 'number') return null
    return attackedValue - cleanValue
  }

  const formatDelta = (value: number | null, decimals = 3) => {
    if (value === null) return '—'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(decimals)}`
  }

  return (
    <section className="workspace-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Attack Center</p>
            <h3>Hostile channel scenarios</h3>
            <p className="panel-copy">
              Eight distinct attack families, each with its own behavioral signature rather than a
              single scaled intensity value.
            </p>
          </div>
        </div>
        <div className="attack-grid">
          {attackCatalog.map((attack) => (
            <button
              type="button"
              key={attack.id}
              className={`attack-card reveal ${selectedAttack === attack.id ? 'selected' : ''}`}
              onClick={() => setSelectedAttack(attack.id)}
            >
              <div className="attack-card-head">
                <strong>{attack.label}</strong>
                <span className={`threat-chip threat-${attack.threat_level.toLowerCase()}`}>
                  {attack.threat_level}
                </span>
              </div>
              <p>{attack.description}</p>
              <div className="attack-detail-row">
                <span className="report-label">Symptoms</span>
                <p>{attack.symptoms.join(', ')}</p>
              </div>
              <div className="attack-detail-row">
                <span className="report-label">Adaptive Response</span>
                <p>{attack.adaptive_response}</p>
              </div>
              <div className="attack-detail-row">
                <span className="report-label">Recovery Strategy</span>
                <p>{attack.recovery_strategy}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Before vs After</p>
            <h3>Live comparison laboratory</h3>
            <p className="panel-copy">
              Runs the same scenario twice — once clean, once under{' '}
              <strong>{activeProfile?.label ?? selectedAttack}</strong> — and diffs the real results.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="field-block">
            <div className="field-top">
              <span>Protocol</span>
              <span className="help-chip">Protocol used for both comparison runs.</span>
            </div>
            <select value={protocol} onChange={(event) => setProtocol(event.target.value)}>
              {protocols.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <div className="field-top">
              <span>Attack Intensity</span>
              <span className="help-chip">Strength applied to the attacked run only.</span>
            </div>
            <div className="range-stack">
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={intensity}
                onChange={(event) => setIntensity(Number(event.target.value))}
              />
              <span>{intensity.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="button"
            className="primary-button full-span"
            onClick={() => void runComparison()}
            disabled={comparing}
          >
            {comparing ? 'Running comparison...' : `Run Clean vs ${activeProfile?.label ?? 'Attack'}`}
          </button>
        </div>

        {comparison ? (
          <table className="ranking-table" style={{ marginTop: '1.2rem' }}>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Clean</th>
                <th>Attacked</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>QBER</td>
                <td>{comparison.clean.qber.toFixed(4)}</td>
                <td>{comparison.attacked.qber.toFixed(4)}</td>
                <td>{formatDelta(delta('qber'), 4)}</td>
              </tr>
              <tr>
                <td>Latency (ms)</td>
                <td>{comparison.clean.latency_ms.toFixed(2)}</td>
                <td>{comparison.attacked.latency_ms.toFixed(2)}</td>
                <td>{formatDelta(delta('latency_ms'), 2)}</td>
              </tr>
              <tr>
                <td>Fidelity</td>
                <td>{comparison.clean.fidelity.toFixed(3)}</td>
                <td>{comparison.attacked.fidelity.toFixed(3)}</td>
                <td>{formatDelta(delta('fidelity'))}</td>
              </tr>
              <tr>
                <td>Detection Rate</td>
                <td>{comparison.clean.detection_rate.toFixed(3)}</td>
                <td>{comparison.attacked.detection_rate.toFixed(3)}</td>
                <td>{formatDelta(delta('detection_rate'))}</td>
              </tr>
              <tr>
                <td>Secure Message Rate</td>
                <td>{comparison.clean.secure_message_rate.toFixed(3)}</td>
                <td>{comparison.attacked.secure_message_rate.toFixed(3)}</td>
                <td>{formatDelta(delta('secure_message_rate'))}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="empty-state">Run a comparison to see real before/after deltas here.</div>
        )}

        <MissionNetwork
          noiseLevel={0.06}
          threatLabel={comparison ? 'Elevated' : threatLabel}
          attackType={selectedAttack}
        />

        <div className="decision-stack">
          <DecisionStep
            active={threatLabel !== 'Stable'}
            title="High disturbance detected"
            body="Channel risk crosses the normal operating band."
          />
          <DecisionStep
            active={Boolean(activeProfile)}
            title="Attack classification updated"
            body={`Current hostile profile: ${activeProfile?.label ?? selectedAttack}.`}
          />
          <DecisionStep
            active={Boolean(latestRun)}
            title="Authentication posture increased"
            body="Communication trust checks are intensified before recovery."
          />
          <DecisionStep
            active={Boolean(latestRun)}
            title="Recovered message successfully"
            body={`Latest adaptive response: ${latestRun?.adaptation_action ?? 'awaiting mission run'}.`}
          />
        </div>
      </section>
    </section>
  )
}
