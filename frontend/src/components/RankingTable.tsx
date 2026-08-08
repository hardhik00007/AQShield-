import type { ExperimentProtocolSummary } from '../types'

const MEDALS = ['🥇', '🥈', '🥉']

export function RankingTable({ summaries }: { summaries: ExperimentProtocolSummary[] }) {
  const ranked = [...summaries].sort(
    (a, b) => b.average_secure_message_rate - a.average_secure_message_rate,
  )

  if (ranked.length === 0) {
    return (
      <div className="empty-state">
        No benchmark summaries yet. Run a benchmark campaign to populate the ranking table.
      </div>
    )
  }

  return (
    <table className="ranking-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Protocol</th>
          <th>Success</th>
          <th>Secure Rate</th>
          <th>Fidelity</th>
          <th>Throughput</th>
          <th>Detection</th>
        </tr>
      </thead>
      <tbody>
        {ranked.map((summary, index) => (
          <tr key={summary.protocol} className={index === 0 ? 'top-rank' : ''}>
            <td>{MEDALS[index] ?? `#${index + 1}`}</td>
            <td className="rank-protocol">{summary.protocol}</td>
            <td>{Math.round(summary.success_rate * 100)}%</td>
            <td>{summary.average_secure_message_rate.toFixed(3)}</td>
            <td>{summary.average_fidelity.toFixed(3)}</td>
            <td>{summary.average_throughput.toFixed(3)}</td>
            <td>{summary.average_detection_rate.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
