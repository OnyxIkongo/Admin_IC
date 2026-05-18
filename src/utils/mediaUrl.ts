import { getApiBaseUrl } from '@/config/apiBaseUrl'

/** Origine du backend (sans le suffixe /api). */
export function getApiOrigin(): string {
  const base = getApiBaseUrl()
  if (!base || base === '/api') {
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }
  return base.replace(/\/api\/?$/i, '')
}

/** URL absolue pour afficher un fichier média servi par l’API Django. */
export function resolveMediaUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  const origin = getApiOrigin()
  if (!origin) return raw
  return raw.startsWith('/') ? `${origin}${raw}` : `${origin}/${raw}`
}
