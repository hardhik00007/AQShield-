import type {
  ExperimentListItem,
  ExperimentReportResponse,
  ExperimentRequest,
  ExperimentResponse,
  MetricsSnapshot,
  PersistedRunResponse,
  Protocol,
  RunRequest,
  RunResponse,
} from './types'

const API_BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function fetchProtocols(): Promise<{ protocols: Protocol[] }> {
  return request<{ protocols: Protocol[] }>('/protocols')
}

export function fetchMetricsSnapshot(): Promise<MetricsSnapshot> {
  return request<MetricsSnapshot>('/metrics/snapshot')
}

export function fetchRecentRuns(limit = 8): Promise<PersistedRunResponse[]> {
  return request<PersistedRunResponse[]>(`/runs?limit=${limit}`)
}

export function createRun(payload: RunRequest): Promise<RunResponse> {
  return request<RunResponse>('/runs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchExperiments(limit = 6): Promise<ExperimentListItem[]> {
  return request<ExperimentListItem[]>(`/experiments?limit=${limit}`)
}

export function createExperiment(payload: ExperimentRequest): Promise<ExperimentResponse> {
  return request<ExperimentResponse>('/experiments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchExperiment(experimentId: string): Promise<ExperimentResponse> {
  return request<ExperimentResponse>(`/experiments/${experimentId}`)
}

export function fetchExperimentReport(
  experimentId: string,
): Promise<ExperimentReportResponse> {
  return request<ExperimentReportResponse>(`/experiments/${experimentId}/report`)
}
