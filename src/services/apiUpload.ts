import axios from 'axios'
import { getApiBaseUrl } from '@/config/apiBaseUrl'

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

/** Upload multipart fiable (fetch, sans Content-Type axios incorrect). */
export async function postMultipart<T>(path: string, form: FormData): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const headers: HeadersInit = {}
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers, body: form })
  const text = await res.text()
  if (!res.ok) {
    const msg = parseErrorBody(text)
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
  const suffix = replace ? '?replace=true' : ''
  return postMultipart<T>(`/admin/spaces/${id}/upload-gallery/${suffix}`, form)
}

/** Fallback axios pour erreurs réseau explicites. */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response
}
