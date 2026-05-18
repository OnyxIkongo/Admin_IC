function normalizeApiBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '')
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, '')}`
  }
  return url
}

/** URL de base de l’API Django (avec le suffixe /api). */
export function getApiBaseUrl(): string {
  const fromEnv =
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) return normalizeApiBaseUrl(fromEnv)
  if (import.meta.env.DEV) return '/api'
  return '/api'
}

export function isApiConfiguredForProduction(): boolean {
  if (import.meta.env.DEV) return true
  return Boolean(
    import.meta.env.VITE_API_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim(),
  )
}
