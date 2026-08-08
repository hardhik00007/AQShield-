import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import type { PersistedRunResponse } from '../../types'

const COLORS = ['#7fe1e0', '#ff8f6b', '#9be27f', '#c79bff', '#ffd166']

export function AttackScatter({ runs }: { runs: PersistedRunResponse[] }) {
  const attackedRuns = runs.filter((run) => (run.attack_intensity ?? 0) > 0)

  if (attackedRuns.length === 0) {
    return (
      <div className="empty-state">
        No attack-affected runs yet — launch a mission with attack intensity above 0 to populate this chart.
      </div>
    )
  }

  const protocolIds = Array.from(new Set(attackedRuns.map((run) => run.protocol)))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,178,191,0.12)" />
        <XAxis
          type="number"
          dataKey="attack_intensity"
          name="Attack Intensity"
          stroke="#7fb2bf"
          fontSize={12}
          domain={[0, 1]}
        />
        <YAxis type="number" dataKey="qber" name="QBER" stroke="#7fb2bf" fontSize={12} />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            background: '#0a1620',
            border: '1px solid rgba(126,178,191,0.24)',
            borderRadius: 12,
            color: '#edf7fa',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9db7c2' }} />
        {protocolIds.map((protocolId, index) => (
          <Scatter
            key={protocolId}
            name={protocolId}
            data={attackedRuns.filter((run) => run.protocol === protocolId)}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
