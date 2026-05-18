import type { AdminSession } from '@/types/domain'
import axios, { AxiosError } from 'axios'
import { getApiBaseUrl, isApiConfiguredForProduction } from '@/config/apiBaseUrl'

const STORAGE_KEY = 'ingenious_city_admin_session'
const baseURL = getApiBaseUrl()

const tokenClient = axios.create({ baseURL, timeout: 20_000 })

type ApiErrorShape =
  | { detail?: unknown; [k: string]: unknown }
  | unknown

function parseApiErrorMessage(err: unknown): string | null {
  if (!(err instanceof AxiosError)) return null
  const data = err.response?.data as ApiErrorShape
  if (!data || typeof data !== 'object') return null

  // DRF: {"detail":"..."}
  const detail = (data as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.trim()) return detail

  // DRF ValidationError: {"field":["msg"]} or {"non_field_errors":["msg"]}
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) return value
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === 'string' && v.trim())
      if (typeof first === 'string') return first
    }
  }
  return null
}

function loginErrorMessage(err: unknown): string {
  if (!(err instanceof AxiosError)) {
    return 'Impossible de se connecter'
  }

  if (!isApiConfiguredForProduction()) {
    return (
      'API non configurée pour la production. Dans Render → Environment, ajoutez VITE_API_BASE_URL ' +
      '(ex. https://votre-backend.onrender.com/api), puis redéployez le site admin.'
    )
  }

  if (!err.response) {
    return (
      'Impossible de joindre le serveur API (réseau ou CORS). Vérifiez que le backend Django est en ligne, ' +
      `que VITE_API_BASE_URL pointe vers son URL /api, et que CORS_ALLOWED_ORIGINS inclut ${typeof window !== 'undefined' ? window.location.origin : 'votre domaine admin'}.`
    )
  }

  const contentType = String(err.response.headers['content-type'] ?? '')
  if (err.response.status === 404 && contentType.includes('text/html')) {
    return (
      'URL API incorrecte : la requête atteint le site admin au lieu du backend. Corrigez VITE_API_BASE_URL sur Render.'
    )
  }

  const msg = parseApiErrorMessage(err)
  if (msg) return msg

  if (err.response.status === 401) {
    return 'Courriel ou mot de passe incorrect.'
  }

  return `Erreur de connexion (HTTP ${err.response.status}).`
}

export const authService = {
  getSession(): AdminSession | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<AdminSession> & { token?: string }
      // Compat: anciennes sessions stockaient parfois `token` au lieu de `access`.
      if (!parsed.access && parsed.token) {
        parsed.access = parsed.token
      }
      return parsed as AdminSession
    } catch {
      return null
    }
  },

  async login(usernameOrEmail: string, password: string): Promise<AdminSession> {
    if (!usernameOrEmail.trim() || !password.trim()) {
      throw new Error('Identifiants invalides')
    }
    let data: { access: string; refresh: string }
    try {
      ;({ data } = await tokenClient.post<{ access: string; refresh: string }>('/auth/login/', {
        email: usernameOrEmail.trim(),
        password,
      }))
    } catch (e) {
      throw new Error(loginErrorMessage(e))
    }
    const session: AdminSession = {
      access: data.access,
      refresh: data.refresh,
      adminName: usernameOrEmail.trim(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return session
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY)
  },

  /** Renouvelle l’accès JWT (appelé par l’intercepteur HTTP sur 401). */
  async tryRefreshAccess(): Promise<boolean> {
    const session = this.getSession()
    if (!session?.refresh) return false
    try {
      const { data } = await tokenClient.post<{ access: string }>('/auth/refresh/', {
        refresh: session.refresh,
      })
      if (!data?.access) return false
      const next: AdminSession = { ...session, access: data.access }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return true
    } catch {
      return false
    }
  },
}
