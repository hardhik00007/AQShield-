import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { ExperimentProtocolSummary } from '../../types'

const COLORS = ['#7fe1e0', '#ff8f6b', '#9be27f', '#c79bff']

export function RadarComparison({ summaries }: { summaries: ExperimentProtocolSummary[] }) {
  if (summaries.length === 0) {
    return (
      <div className="empty-state">
        No benchmark summaries yet — run a benchmark campaign to compare protocols here.
      </div>
    )
  }

  const metrics: Array<{ key: keyof ExperimentProtocolSummary; label: string }> = [
    { key: 'success_rate', label: 'Success' },
    { key: 'average_secure_message_rate', label: 'Secure Rate' },
    { key: 'average_fidelity', label: 'Fidelity' },
    { key: 'average_throughput', label: 'Throughput' },
    { key: 'average_detection_rate', label: 'Detection' },
  ]

  const data = metrics.map(({ key, label }) => {
    const row: Record<string, number | string> = { metric: label }
    summaries.forEach((summary) => {
      const value = summary[key]
      row[summary.protocol] = typeof value === 'number' ? value : 0
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="rgba(126,178,191,0.18)" />
        <PolarAngleAxis dataKey="metric" stroke="#9db7c2" fontSize={12} />
        <PolarRadiusAxis angle={30} domain={[0, 1]} stroke="rgba(126,178,191,0.2)" fontSize={10} />
        {summaries.map((summary, index) => (
          <Radar
            key={summary.protocol}
            name={summary.protocol}
            dataKey={summary.protocol}
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 12, color: '#9db7c2' }} />
        <Tooltip
          contentStyle={{
            background: '#0a1620',
            border: '1px solid rgba(126,178,191,0.24)',
            borderRadius: 12,
            color: '#edf7fa',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
