import { useCountUp } from '../hooks/useCountUp'

/**
 * Renders a metric value, animating the numeric portion when the value
 * follows a `<number><optional suffix>` shape (e.g. "8.32 ms", "100%", "95").
 * Non-numeric values (e.g. protocol names) render as-is.
 */
function AnimatedValue({ value }: { value: string }) {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/)

  if (!match) {
    return <>{value}</>
  }

  const [, numberPart, suffix] = match
  const decimals = numberPart.includes('.') ? numberPart.split('.')[1].length : 0
  const target = Number(numberPart)
  const animated = useCountUp(target)

  return (
    <>
      {animated.toFixed(decimals)}
      {suffix}
    </>
  )
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="metric-card hint-anchor reveal" data-hint={detail}>
      <span>{label}</span>
      <strong>
        <AnimatedValue value={value} />
      </strong>
      <p>{detail}</p>
    </article>
  )
}
