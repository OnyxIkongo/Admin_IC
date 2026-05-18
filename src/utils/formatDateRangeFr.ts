import { dayjs } from '@/utils/dayjsFr'

export function formatDateRangeFr(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return '—'
  if (!endsAt) return dayjs(startsAt).format('DD MMM YYYY')

  const start = dayjs(startsAt)
  const end = dayjs(endsAt)
  if (!start.isValid() || !end.isValid()) return '—'

  if (start.isSame(end, 'day')) {
    return start.format('DD MMM YYYY')
  }

  if (start.isSame(end, 'year')) {
    return `${start.format('DD MMM')} – ${end.format('DD MMM YYYY')}`
  }

  return `${start.format('DD MMM YYYY')} – ${end.format('DD MMM YYYY')}`
}

