export function toCSV(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return ''
  }
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key))
      return set
    }, new Set<string>()),
  )

  const escape = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const stringValue = String(value)
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','))
  }
  return lines.join('\n')
}

export function downloadCSV(filename: string, rows: Array<Record<string, unknown>>): void {
  const csv = toCSV(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
