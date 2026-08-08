import { MetricCard } from '../components/MetricCard'
import { MissionNetwork } from '../components/MissionNetwork'
import { MissionPlayback } from '../components/MissionPlayback'
import { useAqShieldData } from '../context/AqShieldDataContext'
import { protocolProfiles } from '../lib/protocolProfiles'

export function DashboardPage() {
  const { protocols, metrics, runSuccessRate, threatLabel, latestRun } = useAqShieldData()

  return (
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
          <p>Derived from the live backend average QBER and recent secure transmission history.</p>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard
          label="Registered Protocols"
          value={String(protocols.length)}
          detail="Adaptive + baseline communication families."
        />
        <MetricCard
          label="Total Runs"
          value={String(metrics?.total_runs ?? 0)}
          detail="Persisted simulation history stored in SQLite."
        />
        <MetricCard
          label="Avg Latency"
          value={`${metrics?.average_latency_ms?.toFixed(2) ?? '0.00'} ms`}
          detail="Operational delay across recent system activity."
        />
        <MetricCard
          label="Run Success"
          value={`${Math.round(runSuccessRate * 100)}%`}
          detail={`Active protocol focus: ${metrics?.active_protocol ?? 'aqshield'}.`}
        />
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
            noiseLevel={latestRun?.noise_level ?? 0.06}
            threatLabel={threatLabel}
            attackType={latestRun?.attack_type ?? 'intercept-resend'}
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
                <div className="protocol-card reveal" key={protocol.id}>
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
                Play, pause, scrub, or jump to any stage of the transmission lifecycle.
              </p>
            </div>
          </div>
          <MissionPlayback latestRun={latestRun} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Research Significance</p>
              <h3>What this platform is about</h3>
            </div>
          </div>
          <ul className="bullet-list">
            <li>
              AQShield studies adaptive Quantum Secure Direct Communication instead of static
              secure transmission behavior.
            </li>
            <li>
              The platform measures how message delivery changes under noise, photon loss, and
              attack injection.
            </li>
            <li>
              The benchmark and reporting flow is designed for review meetings, literature
              comparison, and evidence collection.
            </li>
          </ul>
        </section>
      </section>
    </>
  )
}
