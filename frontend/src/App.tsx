import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'

import './App.css'
import { MissionSuccessToast } from './components/MissionSuccessToast'
import { AqShieldDataProvider, useAqShieldData } from './context/AqShieldDataContext'

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const AttackCenterPage = lazy(() =>
  import('./pages/AttackCenterPage').then((m) => ({ default: m.AttackCenterPage })),
)
const BenchmarkPage = lazy(() => import('./pages/BenchmarkPage').then((m) => ({ default: m.BenchmarkPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const KnowledgeBasePage = lazy(() =>
  import('./pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })),
)
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SimulationPage = lazy(() =>
  import('./pages/SimulationPage').then((m) => ({ default: m.SimulationPage })),
)

const navItems: Array<{ to: string; label: string; hint: string }> = [
  {
    to: '/',
    label: 'Dashboard',
    hint: 'Mission overview, system health, live network posture, and recent activity.',
  },
  {
    to: '/simulation',
    label: 'Simulation Center',
    hint: 'Run one secure transmission and inspect the message lifecycle step by step.',
  },
  {
    to: '/benchmark',
    label: 'Benchmark Laboratory',
    hint: 'Compare AQShield with baseline protocols across repeatable sweep campaigns.',
  },
  {
    to: '/attack',
    label: 'Attack Center',
    hint: 'Inspect hostile scenarios, their impact, and how adaptive response is triggered.',
  },
  {
    to: '/analytics',
    label: 'Research Analytics',
    hint: 'Charts, trends, and protocol rankings drawn from persisted mission history.',
  },
  {
    to: '/reports',
    label: 'Mission Reports',
    hint: 'Review benchmark summaries, export mission briefs, and collect research evidence.',
  },
  {
    to: '/knowledge-base',
    label: 'Knowledge Base',
    hint: 'Glossary of protocols, metrics, and attack types used across the platform.',
  },
]

function AppShell() {
  const { loading, errorMessage } = useAqShieldData()

  return (
    <div className="app-shell">
      <MissionSuccessToast />
      <aside className="rail no-print">
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
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `rail-link hint-anchor ${isActive ? 'active' : ''}`}
              data-hint={item.hint}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rail-footer">
          <span className="status-dot" />
          Mission console online
        </div>
      </aside>

      <main className="main-panel">
        {errorMessage ? <div className="banner error no-print">{errorMessage}</div> : null}
        {loading ? <div className="banner no-print">Loading AQShield command console...</div> : null}

        <Suspense fallback={<div className="route-skeleton" />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="/attack" element={<AttackCenterPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function App() {
  return (
    <AqShieldDataProvider>
      <AppShell />
    </AqShieldDataProvider>
  )
}

export default App
