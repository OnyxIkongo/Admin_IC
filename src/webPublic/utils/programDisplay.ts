const PROGRAM_CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tech',
  business: 'Business',
  design: 'Design',
  formation: 'Formation',
}

export function programCategoryLabel(category: string): string {
  const raw = (category ?? '').trim()
  if (!raw) return ''
  const byKey = PROGRAM_CATEGORY_LABELS[raw.toLowerCase()]
  return byKey ?? raw
}
