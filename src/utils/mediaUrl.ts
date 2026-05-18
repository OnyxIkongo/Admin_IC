import { getApiBaseUrl } from '@/config/apiBaseUrl'

/** Origine du backend (sans /api) pour les URLs absolues. */
export function getApiOrigin(): string {
  const base = getApiBaseUrl()
  if (!base || base === '/api') {
    if (import.meta.env.DEV) return ''
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }
  return base.replace(/\/api\/?$/i, '')
}

/**
 * Résout /media/... ou URL absolue.
 * En dev : chemins relatifs /media/... passent par le proxy Vite → Django:8000.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const path = raw.startsWith('/') ? raw : `/${raw}`
  const origin = getApiOrigin()
  if (!origin) return path
  return `${origin}${path}`
}

/** Priorité : image_path (DB) → image_url → fichier image → extra. */
export function pickImageUrl(opts: {
  image?: string | null
  image_path?: string | null
  image_url?: string | null
  extra?: Record<string, unknown> | null
}): string {
  const extra = opts.extra ?? {}
  return (
    resolveMediaUrl(opts.image_path) ||
    resolveMediaUrl(typeof extra.image_path === 'string' ? extra.image_path : null) ||
    resolveMediaUrl(opts.image_url) ||
    resolveMediaUrl(typeof extra.image_url === 'string' ? extra.image_url : null) ||
    resolveMediaUrl(opts.image) ||
    ''
  )
}
