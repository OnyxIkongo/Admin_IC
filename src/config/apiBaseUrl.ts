const RENDER_API_FALLBACK = 'https://ingenious-city-api.onrender.com/api'

function normalizeApiBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '')
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, '')}`
  }
  return url
}

/** Garantit le suffixe /api (routes Django). Corrige VITE_API_BASE_URL sans /api sur Render. */
function ensureApiSuffix(url: string): string {
  if (!url || url === '/api') return url || '/api'
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/+$/, '')
    if (!path.endsWith('/api')) {
      u.pathname = path ? `${path}/api` : '/api'
    }
    return `${u.origin}${u.pathname}`.replace(/\/+$/, '')
  } catch {
    const cleaned = url.replace(/\/+$/, '')
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
  }
}

function isLocalApiUrl(url: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
}

/** URL de base de l’API Django (avec le suffixe /api). */
export function getApiBaseUrl(): string {
  const fromEnv =
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim()

  if (!fromEnv) {
    if (import.meta.env.DEV) return '/api'
    return RENDER_API_FALLBACK
  }

  let normalized = ensureApiSuffix(normalizeApiBaseUrl(fromEnv))
  if (import.meta.env.PROD && isLocalApiUrl(normalized)) {
    normalized = RENDER_API_FALLBACK
  }
  return normalized
}

export function isApiConfiguredForProduction(): boolean {
  if (import.meta.env.DEV) return true
  return Boolean(
    import.meta.env.VITE_API_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim(),
  )
}
