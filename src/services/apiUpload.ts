import axios from 'axios'
import { getApiBaseUrl, isApiConfiguredForProduction } from '@/config/apiBaseUrl'
import { authService } from '@/services/authService'

const SESSION_KEY = 'ingenious_city_admin_session'

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as { access?: string; token?: string }
    return s.access || s.token || null
  } catch {
    return null
  }
}

function parseErrorBody(text: string): string {
  try {
    const data = JSON.parse(text) as Record<string, unknown>
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && typeof data.detail[0] === 'string') return data.detail[0]
    if (Array.isArray(data.image) && typeof data.image[0] === 'string') {
      return data.image[0]
    }
    if (Array.isArray(data.images) && typeof data.images[0] === 'string') {
      return data.images[0]
    }
    const first = Object.values(data).find((v) => typeof v === 'string' || (Array.isArray(v) && typeof v[0] === 'string'))
    if (typeof first === 'string') return first
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  } catch {
    /* ignore */
  }
  return text || 'Upload refusé par le serveur.'
}

function buildUploadUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '')
  if (!import.meta.env.DEV && !isApiConfiguredForProduction()) {
    throw new Error(
      'API non configurée : définissez VITE_API_BASE_URL (ex. https://ingenious-city-api.onrender.com/api) sur Render puis redéployez.',
    )
  }
  if (!base || base === '/api') {
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }
  try {
    // Valide l’URL (évite ERR_NAME_NOT_RESOLVED si la variable d’env est mal formée).
    return new URL(path.startsWith('/') ? path : `/${path}`, `${base}/`).toString()
  } catch {
    throw new Error(`URL API invalide (${base}). Vérifiez VITE_API_BASE_URL sur Render.`)
  }
}

async function fetchMultipartOnce(url: string, form: FormData, token: string | null): Promise<Response> {
  const headers: HeadersInit = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(url, { method: 'POST', headers, body: form })
}

/** Upload multipart fiable (fetch, sans Content-Type axios incorrect). */
export async function postMultipart<T>(path: string, form: FormData): Promise<T> {
  const url = buildUploadUrl(path)
  let token = getAccessToken()
  let res = await fetchMultipartOnce(url, form, token)

  if (res.status === 401 && token) {
    const refreshed = await authService.tryRefreshAccess()
    if (refreshed) {
      token = getAccessToken()
      res = await fetchMultipartOnce(url, form, token)
    }
  }

  const text = await res.text()
  if (!res.ok) {
    const msg = parseErrorBody(text)
    if (res.status === 401) {
      authService.logout()
      throw new Error(
        msg || 'Session expirée. Reconnectez-vous (compte staff requis pour /api/admin/*).',
      )
    }
    if (res.status === 500) {
      throw new Error(
        msg.includes('Upload') || msg.includes('media')
          ? msg
          : `${msg} — Vérifiez que l'API est déployée avec SERVE_LOCAL_MEDIA=true et le dossier media/ accessible.`,
      )
    }
    throw new Error(msg)
  }
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Réponse serveur invalide après upload.')
  }
}

export function appendJsonField(form: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return
  if (typeof value === 'object') {
    form.append(key, JSON.stringify(value))
    return
  }
  form.append(key, String(value))
}

/** Création activité (événement / formation) avec image en une seule requête. */
export async function postActivityMultipart<T>(payload: Record<string, unknown>, file?: File): Promise<T> {
  const form = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'extra') appendJsonField(form, key, value)
    else if (value !== null && value !== undefined) appendJsonField(form, key, value)
  }
  if (file) form.append('image', file, file.name)
  return postMultipart<T>('/admin/activities/', form)
}

export async function uploadActivityImage<T>(id: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('image', file, file.name)
  return postMultipart<T>(`/admin/activities/${id}/upload-image/`, form)
}

export async function uploadSpaceImage<T>(id: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('image', file, file.name)
  return postMultipart<T>(`/admin/spaces/${id}/upload-image/`, form)
}

/** Galerie page Détails : champ multipart `images` (max 3 côté API). */
export async function uploadSpaceGallery<T>(
  id: string,
  files: File[],
  replace = false,
): Promise<T> {
  const form = new FormData()
  for (const file of files) {
    form.append('images', file, file.name)
  }
  const path = replace
    ? `/admin/spaces/${id}/upload-gallery/?replace=true`
    : `/admin/spaces/${id}/upload-gallery/`
  return postMultipart<T>(path, form)
}

/** Fallback axios pour erreurs réseau explicites. */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response
}
