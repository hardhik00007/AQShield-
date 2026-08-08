import { useMemo, useState } from 'react'

import { useAqShieldData } from '../context/AqShieldDataContext'
import { protocolProfiles } from '../lib/protocolProfiles'

type GlossaryEntry = {
  term: string
  category: 'Metric' | 'Protocol' | 'Attack' | 'Methodology'
  definition: string
}

const METRIC_ENTRIES: GlossaryEntry[] = [
  {
    term: 'QBER (Quantum Bit Error Rate)',
    category: 'Metric',
    definition:
      'The fraction of transmitted bits that arrive in error. Rises with channel noise, photon loss, and adversarial interference; used as the primary disturbance signal for attack detection.',
  },
  {
    term: 'Fidelity',
    category: 'Metric',
    definition:
      'How closely the recovered message matches the intended message after error correction and recovery, expressed as a 0–1 score.',
  },
  {
    term: 'Latency (ms)',
    category: 'Metric',
    definition:
      'End-to-end delay for a transmission, including base channel delay plus control overhead from decoy-state checks and authentication rounds.',
  },
  {
    term: 'Throughput',
    category: 'Metric',
    definition:
      'Effective delivery rate of the protocol under current channel conditions, before QBER and photon loss are applied.',
  },
  {
    term: 'Secure Message Rate',
    category: 'Metric',
    definition:
      'The overall probability that a message is delivered securely end-to-end, combining throughput, QBER, and photon loss into a single research-facing figure.',
  },
  {
    term: 'Detection Rate',
    category: 'Metric',
    definition:
      'The estimated probability that the protocol correctly flags the presence of an adversary during a given transmission.',
  },
  {
    term: 'Decoy Rate',
    category: 'Metric',
    definition:
      'The proportion of transmitted states that are decoy states used to bound information leakage to an eavesdropper, rather than carrying real message content.',
  },
  {
    term: 'Basis Strategy',
    category: 'Metric',
    definition:
      'The measurement-basis policy a protocol uses when encoding and decoding qubits — affects resilience to interception attempts.',
  },
  {
    term: 'Authentication Mode',
    category: 'Metric',
    definition:
      'The verification posture applied to a session, which can be escalated by the adaptive engine when disturbance or attack signatures are detected.',
  },
]

const METHODOLOGY_ENTRIES: GlossaryEntry[] = [
  {
    term: 'Experiment / Benchmark Campaign',
    category: 'Methodology',
    definition:
      'A sweep of one or more protocols across a configured range of noise, photon loss, and attack intensity, executed for a fixed number of iterations per protocol.',
  },
  {
    term: 'Adaptive Engine',
    category: 'Methodology',
    definition:
      'The decision layer that evaluates channel observations each run and can adjust decoy rate, authentication posture, or routing in response to detected disturbance.',
  },
  {
    term: 'Mission Playback',
    category: 'Methodology',
    definition:
      'A stage-by-stage replay of the transmission lifecycle, from key generation through final delivery, used to visualize how a run actually unfolded.',
  },
]

export function KnowledgeBasePage() {
  const { attackCatalog } = useAqShieldData()
  const [query, setQuery] = useState('')

  const protocolEntries: GlossaryEntry[] = useMemo(
    () =>
      Object.entries(protocolProfiles).map(([id, profile]) => ({
        term: id,
        category: 'Protocol' as const,
        definition: `${profile.summary} Strength: ${profile.strengths} Weakness: ${profile.weaknesses}`,
      })),
    [],
  )

  const attackEntries: GlossaryEntry[] = useMemo(
    () =>
      attackCatalog.map((attack) => ({
        term: attack.label,
        category: 'Attack' as const,
        definition: `${attack.description} Typical symptoms: ${attack.symptoms.join(', ')}.`,
      })),
    [attackCatalog],
  )

  const allEntries = [...METRIC_ENTRIES, ...protocolEntries, ...attackEntries, ...METHODOLOGY_ENTRIES]

  const filtered = allEntries.filter((entry) => {
    const haystack = `${entry.term} ${entry.definition} ${entry.category}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <section className="workspace-grid">
      <section className="panel full-span">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Knowledge Base</p>
            <h3>Protocol, metric, and attack glossary</h3>
            <p className="panel-copy">
              Definitions for every term used across the dashboard, benchmark, and attack center —
              filter to find what you need.
            </p>
          </div>
        </div>
        <input
          className="glossary-search"
          placeholder="Search glossary (e.g. QBER, replay, fidelity, aqshield)..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="glossary-grid">
          {filtered.map((entry) => (
            <div className="glossary-card reveal" key={`${entry.category}-${entry.term}`}>
              <div className="glossary-card-head">
                <strong>{entry.term}</strong>
                <span className={`threat-chip glossary-tag-${entry.category.toLowerCase()}`}>
                  {entry.category}
                </span>
              </div>
              <p>{entry.definition}</p>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="empty-state">No glossary entries match "{query}".</div>
          ) : null}
        </div>
      </section>
    </section>
  )
}
