export type DownloadCsvOptions = {
  title?: string
}

export function downloadCsv(filename: string, rows: Array<Record<string, string>>, options?: DownloadCsvOptions) {
  if (!rows.length) return

  // Excel (FR) is happiest with UTF-8 BOM + semicolon separator.
  const separator = ';'
  const bom = '\uFEFF'

  // Forces Excel to pick the right delimiter even when user locale differs.
  const sepHintLine = `sep=${separator}`

  // Keep a stable, readable column order: start with the first row's keys.
  const headers = Object.keys(rows[0])
  const known = new Set(headers)
  for (const r of rows.slice(1)) {
    for (const k of Object.keys(r)) {
      if (known.has(k)) continue
      known.add(k)
      headers.push(k)
    }
  }

  const normalize = (value: unknown) => String(value ?? '').replaceAll('\r\n', '\n').replaceAll('\r', '\n')

  // Quote only when needed (cleaner in Excel).
  const csvCell = (value: unknown) => {
    const v = normalize(value)
    const mustQuote = v.includes(separator) || v.includes('"') || v.includes('\n')
    if (!mustQuote) return v
    return `"${v.replaceAll('"', '""')}"`
  }

  const titleLine =
    options?.title && options.title.trim().length > 0
      ? [csvCell(options.title.trim()), ...headers.slice(1).map(() => '')].join(separator)
      : null

  const lines = [
    sepHintLine,
    ...(titleLine ? [titleLine] : []),
    headers.join(separator),
    ...rows.map((r) => headers.map((h) => csvCell(r[h] ?? '')).join(separator)),
  ]

  // CRLF helps Excel on Windows keep rows aligned.
  const content = bom + lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
