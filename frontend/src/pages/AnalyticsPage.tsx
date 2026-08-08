import { AttackScatter } from '../components/charts/AttackScatter'
import { RadarComparison } from '../components/charts/RadarComparison'
import { TrendChart } from '../components/charts/TrendChart'
import { RankingTable } from '../components/RankingTable'
import { useAqShieldData } from '../context/AqShieldDataContext'
import { downloadCSV } from '../lib/csv'

export function AnalyticsPage() {
  const { runs, activeExperiment } = useAqShieldData()
  const summaries = activeExperiment?.summaries ?? []

  const exportRunsCsv = () => {
    downloadCSV(
      'aqshield-runs',
      runs.map((run) => ({
        run_id: run.run_id,
        protocol: run.protocol,
        status: run.status,
        qber: run.qber,
        latency_ms: run.latency_ms,
        throughput: run.throughput,
        fidelity: run.fidelity,
        detection_rate: run.detection_rate,
        secure_message_rate: run.secure_message_rate,
        attack_type: run.attack_type ?? '',
        attack_intensity: run.attack_intensity,
        noise_level: run.noise_level,
        photon_loss: run.photon_loss,
        created_at: run.created_at ?? '',
      })),
    )
  }

  return (
    <section className="workspace-grid analytics-grid">
      <section className="panel full-span">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Research Analytics</p>
            <h3>Metric trend over recent runs</h3>
            <p className="panel-copy">
              QBER, fidelity, and secure message rate across the most recent persisted runs. Drag
              the brush below the chart to zoom into a range.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={exportRunsCsv}>
            Export Runs CSV
          </button>
        </div>
        <TrendChart runs={runs} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Protocol Comparison</p>
            <h3>Radar profile</h3>
            <p className="panel-copy">
              Normalized comparison across success, secure rate, fidelity, throughput, and
              detection — from the most recently opened benchmark campaign.
            </p>
          </div>
        </div>
        <RadarComparison summaries={summaries} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Attack Impact</p>
            <h3>Intensity vs QBER</h3>
            <p className="panel-copy">
              Every attack-affected run plotted by intensity and resulting QBER, colored by
              protocol.
            </p>
          </div>
        </div>
        <AttackScatter runs={runs} />
      </section>

      <section className="panel full-span">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Protocol Ranking</p>
            <h3>Leaderboard for the active campaign</h3>
          </div>
        </div>
        <RankingTable summaries={summaries} />
      </section>
    </section>
  )
}
