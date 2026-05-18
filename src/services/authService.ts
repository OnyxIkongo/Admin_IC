import type { AdminSession } from '@/types/domain'
import axios, { AxiosError } from 'axios'

const STORAGE_KEY = 'ingenious_city_admin_session'
const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  '/api'

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
      const msg = parseApiErrorMessage(e)
      throw new Error(msg || 'Impossible de se connecter')
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
