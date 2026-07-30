import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

import './App.css'
import {
  createExperiment,
  createRun,
  fetchExperiment,
  fetchExperimentReport,
  fetchExperiments,
  fetchMetricsSnapshot,
  fetchProtocols,
  fetchRecentRuns,
} from './api'
import type {
  ExperimentListItem,
  ExperimentReportResponse,
  ExperimentRequest,
  ExperimentResponse,
  MetricsSnapshot,
  PersistedRunResponse,
  Protocol,
  RunRequest,
} from './types'

type ViewKey =
  | 'dashboard'
  | 'simulation'
  | 'benchmark'
  | 'attack'
  | 'reports'

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

const navItems: Array<{ key: ViewKey; label: string; hint: string }> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    hint: 'Mission overview, system health, live network posture, and recent activity.',
  },
  {
    key: 'simulation',
    label: 'Simulation Center',
    hint: 'Run one secure transmission and inspect the message lifecycle step by step.',
  },
  {
    key: 'benchmark',
    label: 'Benchmark Laboratory',
    hint: 'Compare AQShield with baseline protocols across repeatable sweep campaigns.',
  },
  {
    key: 'attack',
    label: 'Attack Center',
    hint: 'Inspect hostile scenarios, their impact, and how adaptive response is triggered.',
  },
  {
    key: 'reports',
    label: 'Mission Reports',
    hint: 'Review benchmark summaries, export mission briefs, and collect research evidence.',
  },
]

const protocolProfiles: Record<
  string,
  {
    icon: string
    summary: string
    strengths: string
    weaknesses: string
    useCases: string
    resistance: string
    adaptive: string
  }
> = {
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

const attackProfiles = [
  {
    name: 'Intercept-Resend',
    level: 'High risk',
    description:
      'An adversary captures and re-transmits states, raising disturbance and detection opportunities.',
  },
  {
    name: 'Noise Injection',
    level: 'Moderate risk',
    description:
      'Artificial disturbance is added into the channel to degrade fidelity and inflate QBER.',
  },
  {
    name: 'Packet Disruption',
    level: 'Operational risk',
    description:
      'Delivery quality is degraded through link interruptions, loss spikes, and channel instability.',
  },
]

const playbackSteps = [
  'Generating qubits',
  'Encoding secure message',
  'Transmitting across channel',
  'Detecting noise and attack disturbance',
  'Adaptive engine response',
  'Authentication and recovery',
  'Secure delivery assessment',
]

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard')
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null)
  const [runs, setRuns] = useState<PersistedRunResponse[]>([])
  const [experiments, setExperiments] = useState<ExperimentListItem[]>([])
  const [activeExperiment, setActiveExperiment] = useState<ExperimentResponse | null>(null)
  const [activeReport, setActiveReport] = useState<ExperimentReportResponse | null>(null)
  const [runForm, setRunForm] = useState<RunRequest>(defaultRunForm)
  const [experimentForm, setExperimentForm] =
    useState<ExperimentRequest>(defaultExperimentForm)
  const [loading, setLoading] = useState(true)
  const [runPending, setRunPending] = useState(false)
  const [experimentPending, setExperimentPending] = useState(false)
  const [reportPending, setReportPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [benchmarkPulse, setBenchmarkPulse] = useState(0)

  const latestRun = runs[0] ?? null

  const runSuccessRate = useMemo(() => {
    if (runs.length === 0) {
      return 0
    }
    return runs.filter((run) => run.status === 'completed').length / runs.length
  }, [runs])

  const threatLabel = useMemo(() => {
    const qber = metrics?.average_qber ?? 0
    if (qber > 0.08) {
      return 'Elevated'
    }
    if (qber > 0.03) {
      return 'Guarded'
    }
    return 'Stable'
  }, [metrics])

  useEffect(() => {
    const playbackTimer = window.setInterval(() => {
      setPlaybackIndex((current) => (current + 1) % playbackSteps.length)
    }, 1400)
    const benchmarkTimer = window.setInterval(() => {
      setBenchmarkPulse((current) => (current + 1) % 10)
    }, 700)

    return () => {
      window.clearInterval(playbackTimer)
      window.clearInterval(benchmarkTimer)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const [protocolResponse, metricsSnapshot, recentRuns, recentExperiments] =
          await Promise.all([
            fetchProtocols(),
            fetchMetricsSnapshot(),
            fetchRecentRuns(),
            fetchExperiments(),
          ])

        const latestExperiment = recentExperiments.length
          ? await fetchExperiment(recentExperiments[0].experiment_id)
          : null
        const latestReport = latestExperiment
          ? await fetchExperimentReport(latestExperiment.experiment_id)
          : null

        if (!mounted) {
          return
        }

        startTransition(() => {
          setProtocols(protocolResponse.protocols)
          setMetrics(metricsSnapshot)
          setRuns(recentRuns)
          setExperiments(recentExperiments)
          setActiveExperiment((current) => current ?? latestExperiment)
          setActiveReport((current) => current ?? latestReport)
          setLoading(false)
        })
      } catch (error) {
        if (!mounted) {
          return
        }
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load dashboard.')
        setLoading(false)
      }
    }

    void loadDashboard()
    const intervalId = window.setInterval(() => void loadDashboard(), 8000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const refreshCollections = async () => {
    const [metricsSnapshot, recentRuns, recentExperiments] = await Promise.all([
      fetchMetricsSnapshot(),
      fetchRecentRuns(),
      fetchExperiments(),
    ])

    startTransition(() => {
      setMetrics(metricsSnapshot)
      setRuns(recentRuns)
      setExperiments(recentExperiments)
    })
  }

  const handleRunSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRunPending(true)
    setErrorMessage(null)

    try {
      await createRun(runForm)
      await refreshCollections()
      setActiveView('simulation')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Simulation request failed.')
    } finally {
      setRunPending(false)
    }
  }

  const handleExperimentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setExperimentPending(true)
    setErrorMessage(null)

    try {
      const response = await createExperiment(experimentForm)
      const report = await fetchExperimentReport(response.experiment_id)
      setActiveExperiment(response)
      setActiveReport(report)
      await refreshCollections()
      setActiveView('benchmark')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Experiment request failed.')
    } finally {
      setExperimentPending(false)
    }
  }

  const handleExperimentSelect = async (experimentId: string) => {
    setReportPending(true)
    setErrorMessage(null)

    try {
      const [experiment, report] = await Promise.all([
        fetchExperiment(experimentId),
        fetchExperimentReport(experimentId),
      ])
      setActiveExperiment(experiment)
      setActiveReport(report)
      setActiveView('reports')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load experiment details.',
      )
    } finally {
      setReportPending(false)
    }
  }

  const handleExportReport = async () => {
    if (!activeExperiment) {
      return
    }

    setReportPending(true)
    setErrorMessage(null)

    try {
      const report =
        activeReport?.experiment_id === activeExperiment.experiment_id
          ? activeReport
          : await fetchExperimentReport(activeExperiment.experiment_id)

      setActiveReport(report)

      const blob = new Blob([report.markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.name.replace(/\s+/g, '-').toLowerCase()}-brief.md`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setReportPending(false)
    }
  }

  const toggleProtocol = (protocolId: string) => {
    setExperimentForm((current) => {
      const exists = current.protocols.includes(protocolId)
      const nextProtocols = exists
        ? current.protocols.filter((item) => item !== protocolId)
        : [...current.protocols, protocolId]

      return {
        ...current,
        protocols: nextProtocols,
      }
    })
  }

  const renderDashboard = () => (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Mission Overview</p>
          <h2>Quantum-secure communication mission control for adaptive defence research.</h2>
          <p>
            AQShield monitors secure direct communication, adapts to disturbance, and helps
            compare quantum protocol resilience under tactical channel stress.
          </p>
        </div>

        <div className="threat-card">
          <span>Current Threat Posture</span>
          <strong>{threatLabel}</strong>
          <p>
            Derived from the live backend average QBER and recent secure transmission
            history currently stored on July 30, 2026.
          </p>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Registered Protocols" value={String(protocols.length)} detail="Adaptive + baseline communication families." />
        <MetricCard label="Total Runs" value={String(metrics?.total_runs ?? 0)} detail="Persisted simulation history stored in SQLite." />
        <MetricCard label="Avg Latency" value={`${metrics?.average_latency_ms?.toFixed(2) ?? '0.00'} ms`} detail="Operational delay across recent system activity." />
        <MetricCard label="Run Success" value={`${Math.round(runSuccessRate * 100)}%`} detail={`Active protocol focus: ${metrics?.active_protocol ?? 'aqshield'}.`} />
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live Secure Link</p>
              <h3>Network visualization</h3>
              <p className="panel-copy">
                Mission awareness comes first. This view shows the secure link before any
                configuration controls.
              </p>
            </div>
          </div>
          <MissionNetwork
            noiseLevel={latestRun?.noise_level ?? runForm.channel.noise_level}
            threatLabel={threatLabel}
            attackType={latestRun?.attack_type ?? runForm.attack.attack_type ?? 'intercept-resend'}
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Protocol Identity</p>
              <h3>Operational profiles</h3>
              <p className="panel-copy">
                Each protocol should feel distinct, not just a different name in a dropdown.
              </p>
            </div>
          </div>
          <div className="protocol-profile-grid">
            {protocols.map((protocol) => {
              const profile = protocolProfiles[protocol.id]
              return (
                <div className="protocol-card" key={protocol.id}>
                  <div className="protocol-card-head">
                    <div className="protocol-icon">{profile?.icon ?? protocol.id.slice(0, 2)}</div>
                    <div>
                      <strong>{protocol.name}</strong>
                      <p>{profile?.summary ?? protocol.category}</p>
                    </div>
                  </div>
                  <div className="protocol-spec">
                    <span>Strength</span>
                    <p>{profile?.strengths}</p>
                  </div>
                  <div className="protocol-spec">
                    <span>Weakness</span>
                    <p>{profile?.weaknesses}</p>
                  </div>
                  <div className="protocol-meta">
                    <span>Resistance: {profile?.resistance}</span>
                    <span>Adaptive: {profile?.adaptive}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </section>

      <section className="content-grid lower-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Mission Playback</p>
              <h3>Latest run replay</h3>
              <p className="panel-copy">
                Users should understand the protocol flow without needing to read separate documentation.
              </p>
            </div>
          </div>
          <MissionPlayback currentStep={playbackIndex} latestRun={latestRun} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Research Significance</p>
              <h3>What this platform is about</h3>
            </div>
          </div>
          <ul className="bullet-list">
            <li>AQShield studies adaptive Quantum Secure Direct Communication instead of static secure transmission behavior.</li>
            <li>The platform measures how message delivery changes under noise, photon loss, and attack injection.</li>
            <li>The benchmark and reporting flow is designed for review meetings, literature comparison, and evidence collection.</li>
          </ul>
        </section>
      </section>
    </>
  )

  const renderSimulation = () => (
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

          <FieldBlock className="full-span" title="Message" help="The direct message that will be encoded and transmitted.">
            <input
              value={runForm.message}
              onChange={(event) =>
                setRunForm((current) => ({ ...current, message: event.target.value }))
              }
            />
          </FieldBlock>

          <RangeField label="Noise" help="Higher noise increases disturbance and usually raises QBER." value={runForm.channel.noise_level} step={0.01} onChange={(value) => setRunForm((current) => ({ ...current, channel: { ...current.channel, noise_level: value } }))} />
          <RangeField label="Photon Loss" help="Higher loss degrades delivery confidence and effective throughput." value={runForm.channel.photon_loss} step={0.01} onChange={(value) => setRunForm((current) => ({ ...current, channel: { ...current.channel, photon_loss: value } }))} />
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
              <option value="intercept-resend">Intercept-Resend</option>
              <option value="noise-injection">Noise Injection</option>
              <option value="packet-disruption">Packet Disruption</option>
            </select>
          </FieldBlock>
          <RangeField label="Attack Intensity" help="Strength of the hostile influence on this transmission." value={runForm.attack.intensity} step={0.01} onChange={(value) => setRunForm((current) => ({ ...current, attack: { ...current.attack, intensity: value, enabled: value > 0 } }))} />

          <button className="primary-button hint-anchor full-span" data-hint="Run one secure transmission and persist the result." type="submit" disabled={runPending}>
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
        <MissionNetwork noiseLevel={runForm.channel.noise_level} threatLabel={threatLabel} attackType={runForm.attack.attack_type ?? 'intercept-resend'} />
        <MissionPlayback currentStep={playbackIndex} latestRun={latestRun} />
      </section>
    </section>
  )

  const renderBenchmark = () => (
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
          <FieldBlock className="full-span" title="Campaign Name" help="Use a clear benchmark label for later retrieval and reporting.">
            <input
              value={experimentForm.name}
              onChange={(event) =>
                setExperimentForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FieldBlock>
          <FieldBlock className="full-span" title="Message" help="All selected protocols will be evaluated using this message payload.">
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
                setExperimentForm((current) => ({
                  ...current,
                  attack_type: event.target.value,
                }))
              }
            >
              <option value="intercept-resend">Intercept-Resend</option>
              <option value="noise-injection">Noise Injection</option>
              <option value="packet-disruption">Packet Disruption</option>
            </select>
          </FieldBlock>
          <RangePair label="Noise Sweep" help="Move from cleaner to harsher channel disturbance." minValue={experimentForm.noise_min} maxValue={experimentForm.noise_max} onMinChange={(value) => setExperimentForm((current) => ({ ...current, noise_min: value }))} onMaxChange={(value) => setExperimentForm((current) => ({ ...current, noise_max: value }))} />
          <RangePair label="Photon Loss Sweep" help="Compare delivery degradation across multiple loss levels." minValue={experimentForm.photon_loss_min} maxValue={experimentForm.photon_loss_max} onMinChange={(value) => setExperimentForm((current) => ({ ...current, photon_loss_min: value }))} onMaxChange={(value) => setExperimentForm((current) => ({ ...current, photon_loss_max: value }))} />
          <RangePair label="Attack Sweep" help="Benchmark from low to stronger adversarial pressure." minValue={experimentForm.attack_intensity_min} maxValue={experimentForm.attack_intensity_max} onMinChange={(value) => setExperimentForm((current) => ({ ...current, attack_intensity_min: value }))} onMaxChange={(value) => setExperimentForm((current) => ({ ...current, attack_intensity_max: value }))} />
          <button className="primary-button full-span" type="submit" disabled={experimentPending || experimentForm.protocols.length === 0}>
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
        <BenchmarkProgress protocols={experimentForm.protocols} pulse={benchmarkPulse} running={experimentPending} />
        <div className="summary-board">
          {(activeExperiment?.summaries ?? []).map((summary) => (
            <div className="summary-card" key={summary.protocol}>
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
      </section>
    </section>
  )

  const renderAttack = () => (
    <section className="workspace-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Attack Center</p>
            <h3>Hostile channel scenarios</h3>
            <p className="panel-copy">
              Dedicated environment for understanding how attacks disturb communication and how AQShield responds.
            </p>
          </div>
        </div>
        <div className="attack-grid">
          {attackProfiles.map((attack) => (
            <div className="attack-card" key={attack.name}>
              <div className="attack-card-head">
                <strong>{attack.name}</strong>
                <span>{attack.level}</span>
              </div>
              <p>{attack.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Adaptive Engine</p>
            <h3>Response logic</h3>
          </div>
        </div>
        <div className="decision-stack">
          <DecisionStep active={threatLabel !== 'Stable'} title="High disturbance detected" body="Channel risk crosses the normal operating band." />
          <DecisionStep active={Boolean(latestRun?.attack_type)} title="Attack classification updated" body={`Current hostile profile: ${latestRun?.attack_type ?? runForm.attack.attack_type}.`} />
          <DecisionStep active={Boolean(latestRun)} title="Authentication posture increased" body="Communication trust checks are intensified before recovery." />
          <DecisionStep active={Boolean(latestRun)} title="Recovered message successfully" body={`Latest adaptive response: ${latestRun?.adaptation_action ?? 'awaiting mission run'}.`} />
        </div>
      </section>
    </section>
  )

  const renderReports = () => (
    <section className="workspace-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Mission Reports</p>
            <h3>Saved campaigns and brief export</h3>
          </div>
        </div>
        <div className="experiment-list">
          {experiments.length === 0 ? (
            <div className="empty-state">
              No benchmark campaigns have been executed yet. Run your first protocol comparison to begin collecting research evidence.
            </div>
          ) : (
            experiments.map((experiment) => (
              <button
                key={experiment.experiment_id}
                type="button"
                className={`experiment-card hint-anchor ${activeExperiment?.experiment_id === experiment.experiment_id ? 'selected' : ''}`}
                data-hint="Open this campaign, inspect its summary, and prepare a mission brief."
                onClick={() => void handleExperimentSelect(experiment.experiment_id)}
              >
                <strong>{experiment.name}</strong>
                <span>{experiment.total_runs} runs</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Mission Brief</p>
            <h3>Research-ready summary</h3>
          </div>
          <button type="button" className="secondary-button" onClick={() => void handleExportReport()} disabled={!activeExperiment || reportPending}>
            {reportPending ? 'Preparing...' : 'Export Brief'}
          </button>
        </div>
        {activeReport ? (
          <div className="report-card">
            <div className="report-header">
              <div>
                <p className="eyebrow">Headline</p>
                <h4>{activeReport.headline}</h4>
              </div>
            </div>
            <p className="report-copy">{activeReport.overview}</p>
            <div className="report-columns">
              <div>
                <span className="report-label">Key Findings</span>
                <ul className="bullet-list compact">
                  {activeReport.findings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="report-label">Recommendations</span>
                <ul className="bullet-list compact">
                  {activeReport.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            No mission brief is selected yet. Open a benchmark campaign to inspect its report.
          </div>
        )}
      </section>
    </section>
  )

  return (
    <div className="app-shell">
      <aside className="rail">
        <div>
          <p className="eyebrow">Defence Quantum Lab</p>
          <h1>AQShield</h1>
          <p className="rail-copy">
            A quantum communication mission-control platform for monitoring, simulating,
            benchmarking, and defending adaptive secure links.
          </p>
        </div>

        <nav className="rail-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`rail-link hint-anchor ${activeView === item.key ? 'active' : ''}`}
              data-hint={item.hint}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="rail-footer">
          <span className="status-dot" />
          Mission console online
        </div>
      </aside>

      <main className="main-panel">
        {errorMessage ? <div className="banner error">{errorMessage}</div> : null}
        {loading ? <div className="banner">Loading AQShield command console...</div> : null}

        {activeView === 'dashboard' ? renderDashboard() : null}
        {activeView === 'simulation' ? renderSimulation() : null}
        {activeView === 'benchmark' ? renderBenchmark() : null}
        {activeView === 'attack' ? renderAttack() : null}
        {activeView === 'reports' ? renderReports() : null}
      </main>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="metric-card hint-anchor" data-hint={detail}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function FieldBlock({
  title,
  help,
  className,
  children,
}: {
  title: string
  help: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`field-block ${className ?? ''}`.trim()}>
      <div className="field-top">
        <span>{title}</span>
        <span className="help-chip">{help}</span>
      </div>
      {children}
    </label>
  )
}

function RangeField({
  label,
  help,
  value,
  step,
  onChange,
}: {
  label: string
  help: string
  value: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <FieldBlock title={label} help={help}>
      <div className="range-stack">
        <input
          type="range"
          min="0"
          max="1"
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>{value.toFixed(2)}</span>
      </div>
    </FieldBlock>
  )
}

function RangePair({
  label,
  help,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string
  help: string
  minValue: number
  maxValue: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
}) {
  return (
    <div className="full-span field-block">
      <div className="field-top">
        <span>{label}</span>
        <span className="help-chip">{help}</span>
      </div>
      <div className="range-pair">
        <RangeField label="Min" help={`Lower bound for ${label.toLowerCase()}.`} value={minValue} step={0.01} onChange={onMinChange} />
        <RangeField label="Max" help={`Upper bound for ${label.toLowerCase()}.`} value={maxValue} step={0.01} onChange={onMaxChange} />
      </div>
    </div>
  )
}

function BarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span>{label}</span>
        <span>{value.toFixed(3)}</span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${Math.max(6, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  )
}

function MissionNetwork({
  noiseLevel,
  threatLabel,
  attackType,
}: {
  noiseLevel: number
  threatLabel: string
  attackType: string
}) {
  return (
    <div className="network-panel">
      <div className="node satellite">Satellite</div>
      <div className="link pulse" />
      <div className="node ground">Ground Station</div>
      <div className="link pulse delayed" />
      <div className={`node relay ${threatLabel !== 'Stable' ? 'alert' : ''}`}>Relay Node</div>
      <div className="link pulse" />
      <div className="node receiver">Receiver</div>
      <div className="network-badges">
        <span>Noise {noiseLevel.toFixed(2)}</span>
        <span>Threat {threatLabel}</span>
        <span>Attack {attackType}</span>
      </div>
      <div className="disturbance-cloud">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

function MissionPlayback({
  currentStep,
  latestRun,
}: {
  currentStep: number
  latestRun: PersistedRunResponse | null
}) {
  return (
    <div className="playback-panel">
      <div className="playback-clock">00:0{currentStep}</div>
      <div className="playback-track">
        {playbackSteps.map((step, index) => (
          <div key={step} className={`playback-step ${index <= currentStep ? 'active' : ''}`}>
            <span className="playback-dot" />
            <div>
              <strong>{step}</strong>
              <p>
                {index === currentStep && latestRun
                  ? `Latest action: ${latestRun.adaptation_action}`
                  : 'Mission stage armed.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BenchmarkProgress({
  protocols,
  pulse,
  running,
}: {
  protocols: string[]
  pulse: number
  running: boolean
}) {
  return (
    <div className="progress-panel">
      {protocols.length === 0 ? (
        <div className="empty-state">
          No protocols selected. Add at least one protocol to initialize a comparison campaign.
        </div>
      ) : (
        protocols.map((protocol, index) => {
          const fill = running ? ((pulse + index * 2) % 10) / 10 : 1
          return (
            <div className="progress-row" key={protocol}>
              <strong>{protocol}</strong>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.max(fill * 100, running ? 18 : 100)}%` }} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function DecisionStep({
  active,
  title,
  body,
}: {
  active: boolean
  title: string
  body: string
}) {
  return (
    <div className={`decision-step ${active ? 'active' : ''}`}>
      <span className="decision-marker" />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  )
}

export default App
