export function BenchmarkProgress({
  protocols,
  pulse,
  running,
}: {
  protocols: string[]
  pulse: number
  running: boolean
}) {
  return (
    <div className="progress-panel">
      {protocols.length === 0 ? (
        <div className="empty-state">
          No protocols selected. Add at least one protocol to initialize a comparison campaign.
        </div>
      ) : (
        protocols.map((protocol, index) => {
          const fill = running ? ((pulse + index * 2) % 10) / 10 : 1
          return (
            <div className="progress-row" key={protocol}>
              <strong>{protocol}</strong>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.max(fill * 100, running ? 18 : 100)}%` }}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function DecisionStep({
  active,
  title,
  body,
}: {
  active: boolean
  title: string
  body: string
}) {
  return (
    <div className={`decision-step ${active ? 'active' : ''}`}>
      <span className="decision-marker" />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  )
}
