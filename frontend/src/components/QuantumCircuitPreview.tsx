import { useState } from 'react'

import { runQuantumPreview } from '../api'
import type { QuantumPreviewResponse } from '../types'

export function QuantumCircuitPreview() {
  const [numQubits, setNumQubits] = useState(24)
  const [eavesdrop, setEavesdrop] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<QuantumPreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setPending(true)
    setError(null)
    try {
      const response = await runQuantumPreview({ num_qubits: numQubits, eavesdrop })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quantum preview failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="panel quantum-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Physics-Simulated (Qiskit)</p>
          <h3>BB84 qubit-level circuit preview</h3>
          <p className="panel-copy">
            Every other page on this platform derives QBER from a calibrated formula for speed.
            This panel is different: it builds and runs a real single-qubit circuit per photon —
            preparation, optional interception, and measurement — and the QBER below is{' '}
            <strong>measured from actual circuit outcomes</strong>, not asserted.
          </p>
        </div>
      </div>

      <div className="quantum-explainer">
        <p>
          <strong>How to read this:</strong> Alice encodes each bit into a qubit using a randomly
          chosen basis (<span className="basis-chip basis-z">Z</span> = rectilinear,{' '}
          <span className="basis-chip basis-x">X</span> = diagonal). Bob measures each qubit in
          his own randomly chosen basis. Only qubits where Alice's and Bob's basis happened to
          match are kept (this is BB84's real "sifting" step) — the rest are discarded and never
          count toward the key or the error rate. Among the kept qubits, any mismatch between
          Alice's original bit and Bob's measured bit is a real transmission error and drives the
          measured QBER below.
        </p>
        {eavesdrop ? (
          <p>
            With eavesdropping enabled, an interceptor measures each qubit in her own randomly
            guessed basis before resending a freshly prepared qubit onward to Bob. When her guess
            is wrong, she unavoidably disturbs the state — this is the actual physical reason
            intercept-resend raises QBER, not a scripted penalty.
          </p>
        ) : null}
      </div>

      <div className="form-grid">
        <div className="field-block">
          <div className="field-top">
            <span>Qubits to simulate</span>
            <span className="help-chip">More qubits give a more stable QBER estimate.</span>
          </div>
          <div className="range-stack">
            <input
              type="range"
              min="8"
              max="48"
              step="4"
              value={numQubits}
              onChange={(event) => setNumQubits(Number(event.target.value))}
            />
            <span>{numQubits}</span>
          </div>
        </div>
        <div className="field-block">
          <div className="field-top">
            <span>Eavesdropper</span>
            <span className="help-chip">Toggle a real intercept-resend attacker on the channel.</span>
          </div>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={eavesdrop}
              onChange={(event) => setEavesdrop(event.target.checked)}
            />
            <span>{eavesdrop ? 'Eavesdropper present' : 'Clean channel'}</span>
          </label>
        </div>
        <button
          type="button"
          className="primary-button full-span"
          onClick={() => void handleRun()}
          disabled={pending}
        >
          {pending ? 'Running circuits on Qiskit Aer...' : 'Run BB84 Circuit Preview'}
        </button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      {result ? (
        <>
          <div className="quantum-summary-grid">
            <div className="quantum-stat">
              <span>Measured QBER</span>
              <strong className={result.qber > 0.08 ? 'stat-elevated' : 'stat-secure'}>
                {(result.qber * 100).toFixed(1)}%
              </strong>
              <p>From real circuit outcomes on the sifted key.</p>
            </div>
            <div className="quantum-stat">
              <span>Sifted Key Length</span>
              <strong>{result.sifted_key_length}</strong>
              <p>of {result.num_qubits} transmitted qubits kept matching bases.</p>
            </div>
            <div className="quantum-stat">
              <span>Basis Match Rate</span>
              <strong>{(result.matching_basis_rate * 100).toFixed(0)}%</strong>
              <p>Expected ≈50% by chance — this confirms sifting is working correctly.</p>
            </div>
            <div className="quantum-stat">
              <span>Adaptive Engine Response</span>
              <strong className="stat-action">{result.adaptation_action.replace(/_/g, ' ')}</strong>
              <p>{result.adaptation_reason}</p>
            </div>
          </div>

          <div className="quantum-legend">
            <span className="legend-item">
              <span className="legend-swatch legend-kept" /> Kept (bases matched — contributes to
              key/QBER)
            </span>
            <span className="legend-item">
              <span className="legend-swatch legend-discarded" /> Discarded (bases mismatched)
            </span>
            <span className="legend-item">
              <span className="legend-swatch legend-error" /> Error (kept, but bit flipped)
            </span>
          </div>

          <div className="quantum-trace-scroll">
            <table className="quantum-trace-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Alice bit / basis</th>
                  {eavesdrop ? <th>Eve basis / bit</th> : null}
                  <th>Bob basis / bit</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((entry) => (
                  <tr
                    key={entry.index}
                    className={
                      entry.error ? 'row-error' : entry.kept ? 'row-kept' : 'row-discarded'
                    }
                  >
                    <td>{entry.index + 1}</td>
                    <td>
                      {entry.alice_bit}{' '}
                      <span className={`basis-chip basis-${entry.alice_basis.toLowerCase()}`}>
                        {entry.alice_basis}
                      </span>
                    </td>
                    {eavesdrop ? (
                      <td>
                        {entry.eve_bit ?? '—'}{' '}
                        {entry.eve_basis ? (
                          <span className={`basis-chip basis-${entry.eve_basis.toLowerCase()}`}>
                            {entry.eve_basis}
                          </span>
                        ) : null}
                      </td>
                    ) : null}
                    <td>
                      {entry.bob_bit}{' '}
                      <span className={`basis-chip basis-${entry.bob_basis.toLowerCase()}`}>
                        {entry.bob_basis}
                      </span>
                    </td>
                    <td>
                      {entry.error
                        ? 'Error'
                        : entry.kept
                          ? 'Kept'
                          : 'Discarded (basis mismatch)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="empty-state">
          Run the preview to see per-qubit circuit outcomes and the resulting adaptive decision.
        </div>
      )}
    </section>
  )
}
