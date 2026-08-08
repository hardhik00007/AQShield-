import { useEffect, useRef, useState } from 'react'

/**
 * Animates a numeric value from its previous value to `target` over
 * `durationMs`. Returns the interpolated value on every animation frame.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [displayValue, setDisplayValue] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const delta = target - from
    if (Math.abs(delta) < 0.0001) {
      setDisplayValue(target)
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      // ease-out cubic
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(from + delta * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return displayValue
}
