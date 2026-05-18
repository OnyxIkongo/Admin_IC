/** URL de base de l’API Django (avec le suffixe /api). */
export function getApiBaseUrl(): string {
  const fromEnv =
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/api'
  return '/api'
}

export function isApiConfiguredForProduction(): boolean {
  if (import.meta.env.DEV) return true
  return Boolean(
    import.meta.env.VITE_API_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim(),
  )
}
