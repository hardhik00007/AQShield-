import type { ReactNode } from 'react'

export function FieldBlock({
  title,
  help,
  className,
  children,
}: {
  title: string
  help: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`field-block ${className ?? ''}`.trim()}>
      <div className="field-top">
        <span>{title}</span>
        <span className="help-chip">{help}</span>
      </div>
      {children}
    </label>
  )
}

export function RangeField({
  label,
  help,
  value,
  step,
  onChange,
}: {
  label: string
  help: string
  value: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <FieldBlock title={label} help={help}>
      <div className="range-stack">
        <input
          type="range"
          min="0"
          max="1"
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>{value.toFixed(2)}</span>
      </div>
    </FieldBlock>
  )
}

export function RangePair({
  label,
  help,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string
  help: string
  minValue: number
  maxValue: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
}) {
  return (
    <div className="full-span field-block">
      <div className="field-top">
        <span>{label}</span>
        <span className="help-chip">{help}</span>
      </div>
      <div className="range-pair">
        <RangeField
          label="Min"
          help={`Lower bound for ${label.toLowerCase()}.`}
          value={minValue}
          step={0.01}
          onChange={onMinChange}
        />
        <RangeField
          label="Max"
          help={`Upper bound for ${label.toLowerCase()}.`}
          value={maxValue}
          step={0.01}
          onChange={onMaxChange}
        />
      </div>
    </div>
  )
}

export function BarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span>{label}</span>
        <span>{value.toFixed(3)}</span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${Math.max(6, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  )
}
