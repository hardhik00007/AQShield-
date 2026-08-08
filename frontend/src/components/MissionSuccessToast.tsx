import { useEffect, useRef, useState } from 'react'

import { useAqShieldData } from '../context/AqShieldDataContext'

export function MissionSuccessToast() {
  const { latestRun } = useAqShieldData()
  const [visible, setVisible] = useState(false)
  const seenRunId = useRef<string | null>(null)

  useEffect(() => {
    if (!latestRun) {
      return
    }
    if (seenRunId.current === null) {
      // Don't celebrate on initial page load, only on genuinely new runs.
      seenRunId.current = latestRun.run_id
      return
    }
    if (latestRun.run_id === seenRunId.current) {
      return
    }
    seenRunId.current = latestRun.run_id

    if (latestRun.status === 'completed') {
      setVisible(true)
      const timeout = window.setTimeout(() => setVisible(false), 2400)
      return () => window.clearTimeout(timeout)
    }
  }, [latestRun])

  if (!visible || !latestRun) {
    return null
  }

  return (
    <div className="mission-toast no-print" role="status">
      <span className="mission-toast-dot" />
      <div>
        <strong>Mission secured</strong>
        <p>
          {latestRun.protocol} completed with {Math.round(latestRun.secure_message_rate * 100)}%
          secure delivery.
        </p>
      </div>
    </div>
  )
}
