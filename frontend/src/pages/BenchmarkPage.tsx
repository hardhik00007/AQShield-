import { useEffect, useState, type FormEvent } from 'react'

import { createExperiment, fetchExperimentReport } from '../api'
import { BarRow, FieldBlock, RangePair } from '../components/FormControls'
import { BenchmarkProgress } from '../components/MissionExtras'
import { RankingTable } from '../components/RankingTable'
import { useAqShieldData } from '../context/AqShieldDataContext'
import type { ExperimentRequest } from '../types'

const defaultExperimentForm: ExperimentRequest = {
  name: 'Operational Benchmark',
  protocols: ['aqshield', 'bb84', 'ping-pong', 'deng-long'],
  iterations: 4,
  message: 'DEFENCE-LINK',
  noise_min: 0.01,
  noise_max: 0.12,
  photon_loss_min: 0,
  photon_loss_max: 0.08,
  attack_intensity_min: 0,
  attack_intensity_max: 0.2,
  attack_type: 'intercept-resend',
  latency_ms: 5,
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

export function BenchmarkPage() {
  const {
    protocols,
    activeExperiment,
    refreshCollections,
    setErrorMessage,
    setActiveExperimentAndReport,
  } = useAqShieldData()
  const [experimentForm, setExperimentForm] = useState<ExperimentRequest>(defaultExperimentForm)
  const [experimentPending, setExperimentPending] = useState(false)
  const [benchmarkPulse, setBenchmarkPulse] = useState(0)

  useEffect(() => {
    const benchmarkTimer = window.setInterval(() => {
      setBenchmarkPulse((current) => (current + 1) % 10)
    }, 700)
    return () => window.clearInterval(benchmarkTimer)
  }, [])

  const toggleProtocol = (protocolId: string) => {
    setExperimentForm((current) => {
      const exists = current.protocols.includes(protocolId)
      const nextProtocols = exists
        ? current.protocols.filter((item) => item !== protocolId)
        : [...current.protocols, protocolId]
      return { ...current, protocols: nextProtocols }
    })
  }

  const handleExperimentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setExperimentPending(true)
    setErrorMessage(null)

    try {
      const response = await createExperiment(experimentForm)
      const report = await fetchExperimentReport(response.experiment_id)
      setActiveExperimentAndReport(response, report)
      await refreshCollections()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Experiment request failed.')
    } finally {
      setExperimentPending(false)
    }
  }

  return (
    <section className="workspace-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Benchmark Laboratory</p>
            <h3>Run protocol comparison campaigns</h3>
            <p className="panel-copy">
              Sweep multiple protocols under the same conditions to collect research evidence.
            </p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleExperimentSubmit}>
          <FieldBlock
            className="full-span"
            title="Campaign Name"
            help="Use a clear benchmark label for later retrieval and reporting."
          >
            <input
              value={experimentForm.name}
              onChange={(event) =>
                setExperimentForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FieldBlock>
          <FieldBlock
            className="full-span"
            title="Message"
            help="All selected protocols will be evaluated using this message payload."
          >
            <input
              value={experimentForm.message}
              onChange={(event) =>
                setExperimentForm((current) => ({ ...current, message: event.target.value }))
              }
            />
          </FieldBlock>
          <div className="field-block full-span">
            <div className="field-top">
              <span>Protocols</span>
              <span className="help-chip">Select the communication families to compare.</span>
            </div>
            <div className="chip-row">
              {protocols.map((protocol) => {
                const active = experimentForm.protocols.includes(protocol.id)
                return (
                  <button
                    key={protocol.id}
                    type="button"
                    className={`chip hint-anchor ${active ? 'active' : ''}`}
                    data-hint={`Include ${protocol.name} in this benchmark campaign.`}
                    onClick={() => toggleProtocol(protocol.id)}
                  >
                    {protocol.id}
                  </button>
                )
              })}
            </div>
          </div>
          <FieldBlock title="Iterations" help="Number of sweep points to execute for every selected protocol.">
            <input
              type="number"
              min="1"
              max="25"
              value={experimentForm.iterations}
              onChange={(event) =>
                setExperimentForm((current) => ({
                  ...current,
                  iterations: Number(event.target.value),
                }))
              }
            />
          </FieldBlock>
          <FieldBlock title="Attack Type" help="Benchmark all selected protocols under the same hostile family.">
            <select
              value={experimentForm.attack_type ?? 'intercept-resend'}
              onChange={(event) =>
                setExperimentForm((current) => ({ ...current, attack_type: event.target.value }))
              }
            >
              {ATTACK_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FieldBlock>
          <RangePair
            label="Noise Sweep"
            help="Move from cleaner to harsher channel disturbance."
            minValue={experimentForm.noise_min}
            maxValue={experimentForm.noise_max}
            onMinChange={(value) => setExperimentForm((current) => ({ ...current, noise_min: value }))}
            onMaxChange={(value) => setExperimentForm((current) => ({ ...current, noise_max: value }))}
          />
          <RangePair
            label="Photon Loss Sweep"
            help="Compare delivery degradation across multiple loss levels."
            minValue={experimentForm.photon_loss_min}
            maxValue={experimentForm.photon_loss_max}
            onMinChange={(value) =>
              setExperimentForm((current) => ({ ...current, photon_loss_min: value }))
            }
            onMaxChange={(value) =>
              setExperimentForm((current) => ({ ...current, photon_loss_max: value }))
            }
          />
          <RangePair
            label="Attack Sweep"
            help="Benchmark from low to stronger adversarial pressure."
            minValue={experimentForm.attack_intensity_min}
            maxValue={experimentForm.attack_intensity_max}
            onMinChange={(value) =>
              setExperimentForm((current) => ({ ...current, attack_intensity_min: value }))
            }
            onMaxChange={(value) =>
              setExperimentForm((current) => ({ ...current, attack_intensity_max: value }))
            }
          />
          <button
            className="primary-button full-span"
            type="submit"
            disabled={experimentPending || experimentForm.protocols.length === 0}
          >
            {experimentPending ? 'Running Benchmark...' : 'Run Benchmark Campaign'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Benchmark Progress</p>
            <h3>Protocols executing</h3>
            <p className="panel-copy">
              The interface should feel computational and alive, not like a static wait state.
            </p>
          </div>
        </div>
        <BenchmarkProgress
          protocols={experimentForm.protocols}
          pulse={benchmarkPulse}
          running={experimentPending}
        />
        <div className="summary-board">
          {(activeExperiment?.summaries ?? []).map((summary) => (
            <div className="summary-card reveal" key={summary.protocol}>
              <div className="summary-head">
                <strong>{summary.protocol}</strong>
                <span>{Math.round(summary.success_rate * 100)}% success</span>
              </div>
              <BarRow label="Throughput" value={summary.average_throughput} />
              <BarRow label="Fidelity" value={summary.average_fidelity} />
              <BarRow label="Detection" value={summary.average_detection_rate} />
              <BarRow label="Secure Rate" value={summary.average_secure_message_rate} />
            </div>
          ))}
        </div>

        {activeExperiment && activeExperiment.summaries.length > 0 ? (
          <>
            <p className="eyebrow" style={{ marginTop: '1.4rem' }}>
              Protocol Ranking
            </p>
            <RankingTable summaries={activeExperiment.summaries} />
          </>
        ) : null}
      </section>
    </section>
  )
}
