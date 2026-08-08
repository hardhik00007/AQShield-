import { useState } from 'react'

import { fetchExperimentReport } from '../api'
import { useAqShieldData } from '../context/AqShieldDataContext'
import { downloadCSV } from '../lib/csv'

export function ReportsPage() {
  const { experiments, activeExperiment, activeReport, selectExperiment, setErrorMessage } =
    useAqShieldData()
  const [reportPending, setReportPending] = useState(false)

  const handleExperimentSelect = async (experimentId: string) => {
    setReportPending(true)
    setErrorMessage(null)
    try {
      await selectExperiment(experimentId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load experiment details.')
    } finally {
      setReportPending(false)
    }
  }

  const handleExportMarkdown = async () => {
    if (!activeExperiment) return
    setReportPending(true)
    setErrorMessage(null)
    try {
      const report =
        activeReport?.experiment_id === activeExperiment.experiment_id
          ? activeReport
          : await fetchExperimentReport(activeExperiment.experiment_id)
      if (!report) return

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

  const handleExportCsv = () => {
    if (!activeExperiment) return
    downloadCSV(
      `${activeExperiment.name.replace(/\s+/g, '-').toLowerCase()}-summary`,
      activeExperiment.summaries.map((summary) => ({
        protocol: summary.protocol,
        total_runs: summary.total_runs,
        success_rate: summary.success_rate,
        average_qber: summary.average_qber,
        average_latency_ms: summary.average_latency_ms,
        average_throughput: summary.average_throughput,
        average_fidelity: summary.average_fidelity,
        average_detection_rate: summary.average_detection_rate,
        average_secure_message_rate: summary.average_secure_message_rate,
      })),
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <section className="workspace-grid">
      <section className="panel no-print">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Mission Reports</p>
            <h3>Saved campaigns and brief export</h3>
          </div>
        </div>
        <div className="experiment-list">
          {experiments.length === 0 ? (
            <div className="empty-state">
              No benchmark campaigns have been executed yet. Run your first protocol comparison to
              begin collecting research evidence.
            </div>
          ) : (
            experiments.map((experiment) => (
              <button
                key={experiment.experiment_id}
                type="button"
                className={`experiment-card hint-anchor ${
                  activeExperiment?.experiment_id === experiment.experiment_id ? 'selected' : ''
                }`}
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

      <section className="panel report-print-area">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Mission Brief</p>
            <h3>Research-ready summary</h3>
          </div>
          <div className="export-row no-print">
            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleExportMarkdown()}
              disabled={!activeExperiment || reportPending}
            >
              {reportPending ? 'Preparing...' : 'Export Markdown'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExportCsv}
              disabled={!activeExperiment}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handlePrint}
              disabled={!activeExperiment}
            >
              Export PDF
            </button>
          </div>
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
}
