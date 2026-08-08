import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { PersistedRunResponse } from '../../types'

export function TrendChart({ runs }: { runs: PersistedRunResponse[] }) {
  const data = [...runs]
    .reverse()
    .map((run, index) => ({
      index: index + 1,
      label: run.created_at ? new Date(run.created_at).toLocaleTimeString() : `Run ${index + 1}`,
      qber: run.qber,
      latency: run.latency_ms,
      fidelity: run.fidelity,
      throughput: run.throughput,
      secureRate: run.secure_message_rate,
    }))

  if (data.length === 0) {
    return <div className="empty-state">No runs yet — trend chart will populate as missions execute.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="qberGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff8f6b" stopOpacity={0.55} />
            <stop offset="95%" stopColor="#ff8f6b" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fidelityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7fe1e0" stopOpacity={0.55} />
            <stop offset="95%" stopColor="#7fe1e0" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="secureGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9be27f" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#9be27f" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,178,191,0.12)" />
        <XAxis dataKey="index" stroke="#7fb2bf" fontSize={12} tickLine={false} />
        <YAxis stroke="#7fb2bf" fontSize={12} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: '#0a1620',
            border: '1px solid rgba(126,178,191,0.24)',
            borderRadius: 12,
            color: '#edf7fa',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9db7c2' }} />
        <Area type="monotone" dataKey="qber" name="QBER" stroke="#ff8f6b" fill="url(#qberGradient)" strokeWidth={2} />
        <Area
          type="monotone"
          dataKey="fidelity"
          name="Fidelity"
          stroke="#7fe1e0"
          fill="url(#fidelityGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="secureRate"
          name="Secure Rate"
          stroke="#9be27f"
          fill="url(#secureGradient)"
          strokeWidth={2}
        />
        <Brush dataKey="index" height={22} stroke="#7fb2bf" fill="rgba(9,24,33,0.6)" travellerWidth={8} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
