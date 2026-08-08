import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  fetchAttackCatalog,
  fetchExperiment,
  fetchExperimentReport,
  fetchExperiments,
  fetchMetricsSnapshot,
  fetchProtocols,
  fetchRecentRuns,
} from '../api'
import type {
  AttackProfile,
  ExperimentListItem,
  ExperimentReportResponse,
  ExperimentResponse,
  MetricsSnapshot,
  PersistedRunResponse,
  Protocol,
} from '../types'

type AqShieldDataValue = {
  protocols: Protocol[]
  metrics: MetricsSnapshot | null
  runs: PersistedRunResponse[]
  experiments: ExperimentListItem[]
  attackCatalog: AttackProfile[]
  activeExperiment: ExperimentResponse | null
  activeReport: ExperimentReportResponse | null
  loading: boolean
  errorMessage: string | null
  setErrorMessage: (message: string | null) => void
  latestRun: PersistedRunResponse | null
  runSuccessRate: number
  threatLabel: string
  refreshCollections: () => Promise<void>
  selectExperiment: (experimentId: string) => Promise<void>
  setActiveExperimentAndReport: (
    experiment: ExperimentResponse,
    report: ExperimentReportResponse,
  ) => void
}

const AqShieldDataContext = createContext<AqShieldDataValue | null>(null)

export function AqShieldDataProvider({ children }: { children: ReactNode }) {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null)
  const [runs, setRuns] = useState<PersistedRunResponse[]>([])
  const [experiments, setExperiments] = useState<ExperimentListItem[]>([])
  const [attackCatalog, setAttackCatalog] = useState<AttackProfile[]>([])
  const [activeExperiment, setActiveExperiment] = useState<ExperimentResponse | null>(null)
  const [activeReport, setActiveReport] = useState<ExperimentReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    let mounted = true

    const loadDashboard = async () => {
      try {
        const [protocolResponse, metricsSnapshot, recentRuns, recentExperiments, catalog] =
          await Promise.all([
            fetchProtocols(),
            fetchMetricsSnapshot(),
            fetchRecentRuns(),
            fetchExperiments(),
            fetchAttackCatalog(),
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
          setAttackCatalog(catalog.attacks)
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

  const selectExperiment = async (experimentId: string) => {
    const [experiment, report] = await Promise.all([
      fetchExperiment(experimentId),
      fetchExperimentReport(experimentId),
    ])
    setActiveExperiment(experiment)
    setActiveReport(report)
  }

  const setActiveExperimentAndReport = (
    experiment: ExperimentResponse,
    report: ExperimentReportResponse,
  ) => {
    setActiveExperiment(experiment)
    setActiveReport(report)
  }

  const value: AqShieldDataValue = {
    protocols,
    metrics,
    runs,
    experiments,
    attackCatalog,
    activeExperiment,
    activeReport,
    loading,
    errorMessage,
    setErrorMessage,
    latestRun,
    runSuccessRate,
    threatLabel,
    refreshCollections,
    selectExperiment,
    setActiveExperimentAndReport,
  }

  return <AqShieldDataContext.Provider value={value}>{children}</AqShieldDataContext.Provider>
}

export function useAqShieldData(): AqShieldDataValue {
  const context = useContext(AqShieldDataContext)
  if (!context) {
    throw new Error('useAqShieldData must be used within an AqShieldDataProvider')
  }
  return context
}
