import { useState, type FormEvent } from 'react'

import { createRun } from '../api'
import { FieldBlock, RangeField } from '../components/FormControls'
import { MissionNetwork } from '../components/MissionNetwork'
import { MissionPlayback } from '../components/MissionPlayback'
import { QuantumCircuitPreview } from '../components/QuantumCircuitPreview'
import { useAqShieldData } from '../context/AqShieldDataContext'
import type { RunRequest } from '../types'

const defaultRunForm: RunRequest = {
  protocol: 'aqshield',
  message: 'TACTICAL-READY',
  channel: {
    noise_level: 0.06,
    photon_loss: 0.03,
    latency_ms: 5,
  },
  attack: {
    enabled: true,
    attack_type: 'intercept-resend',
    intensity: 0.14,
  },
}

const ATTACK_TYPES = [
  ['intercept-resend', 'Intercept-Resend'],
  ['noise-injection', 'Noise Injection'],
  ['packet-disruption', 'Packet Disruption'],
  ['replay', 'Replay Attack'],
  ['man-in-the-middle', 'Man-in-the-Middle'],
  ['fake-node', 'Fake Node'],
  ['photon-splitting', 'Photon-Splitting'],
  ['denial-of-communication', 'Denial of Communication'],
]

export function SimulationPage() {
  const { protocols, threatLabel, latestRun, refreshCollections, setErrorMessage } =
    useAqShieldData()
  const [runForm, setRunForm] = useState<RunRequest>(defaultRunForm)
  const [runPending, setRunPending] = useState(false)

  const handleRunSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRunPending(true)
    setErrorMessage(null)

    try {
      await createRun(runForm)
      await refreshCollections()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Simulation request failed.')
    } finally {
      setRunPending(false)
    }
  }

  return (
    <section className="workspace-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Simulation Center</p>
            <h3>Single-run secure transmission</h3>
            <p className="panel-copy">
              Configure one mission scenario and observe how the transmission lifecycle behaves.
            </p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleRunSubmit}>
          <FieldBlock title="Protocol" help="Choose the quantum communication method for this scenario.">
            <select
              value={runForm.protocol}
              onChange={(event) =>
                setRunForm((current) => ({ ...current, protocol: event.target.value }))
              }
            >
              {protocols.map((protocol) => (
                <option key={protocol.id} value={protocol.id}>
                  {protocol.name}
                </option>
              ))}
            </select>
          </FieldBlock>

          <FieldBlock
            className="full-span"
            title="Message"
            help="The direct message that will be encoded and transmitted."
          >
            <input
              value={runForm.message}
              onChange={(event) =>
                setRunForm((current) => ({ ...current, message: event.target.value }))
              }
            />
          </FieldBlock>

          <RangeField
            label="Noise"
            help="Higher noise increases disturbance and usually raises QBER."
            value={runForm.channel.noise_level}
            step={0.01}
            onChange={(value) =>
              setRunForm((current) => ({
                ...current,
                channel: { ...current.channel, noise_level: value },
              }))
            }
          />
          <RangeField
            label="Photon Loss"
            help="Higher loss degrades delivery confidence and effective throughput."
            value={runForm.channel.photon_loss}
            step={0.01}
            onChange={(value) =>
              setRunForm((current) => ({
                ...current,
                channel: { ...current.channel, photon_loss: value },
              }))
            }
          />
          <FieldBlock title="Latency (ms)" help="Base channel delay before control overhead is applied.">
            <input
              type="number"
              min="0"
              step="0.1"
              value={runForm.channel.latency_ms}
              onChange={(event) =>
                setRunForm((current) => ({
                  ...current,
                  channel: { ...current.channel, latency_ms: Number(event.target.value) },
                }))
              }
            />
          </FieldBlock>
          <FieldBlock title="Attack Type" help="Hostile behavior to inject into this mission scenario.">
            <select
              value={runForm.attack.attack_type ?? 'intercept-resend'}
              onChange={(event) =>
                setRunForm((current) => ({
                  ...current,
                  attack: { ...current.attack, attack_type: event.target.value },
                }))
              }
            >
              {ATTACK_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FieldBlock>
          <RangeField
            label="Attack Intensity"
            help="Strength of the hostile influence on this transmission."
            value={runForm.attack.intensity}
            step={0.01}
            onChange={(value) =>
              setRunForm((current) => ({
                ...current,
                attack: { ...current.attack, intensity: value, enabled: value > 0 },
              }))
            }
          />

          <button
            className="primary-button hint-anchor full-span"
            data-hint="Run one secure transmission and persist the result."
            type="submit"
            disabled={runPending}
          >
            {runPending ? 'Executing Mission...' : 'Launch Secure Transmission'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Live Execution</p>
            <h3>Transmission workspace</h3>
          </div>
        </div>
        <MissionNetwork
          noiseLevel={runForm.channel.noise_level}
          threatLabel={threatLabel}
          attackType={runForm.attack.attack_type ?? 'intercept-resend'}
        />
        <MissionPlayback latestRun={latestRun} />
      </section>

      <div className="full-span">
        <QuantumCircuitPreview />
      </div>
    </section>
  )
}
