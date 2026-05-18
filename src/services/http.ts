import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { authService } from '@/services/authService'

const SESSION_KEY = 'ingenious_city_admin_session'
const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  '/api'

export const http = axios.create({
  baseURL,
  timeout: 25_000,
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshInFlight: Promise<boolean> | null = null

function scheduleRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = authService.tryRefreshAccess().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return config
  try {
    const s = JSON.parse(raw) as { access?: string; token?: string }
    const token = s.access || s.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    /* ignore */
  }
  return config
})

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    const status = error.response?.status
    if (!original || status !== 401) return Promise.reject(error)

    const url = `${original.baseURL ?? ''}${original.url ?? ''}`

    const isRefreshCall = url.includes('/auth/refresh')
    const isObtainCall = url.includes('/auth/login') && !isRefreshCall

    if (isObtainCall) return Promise.reject(error)

    if (isRefreshCall) {
      authService.logout()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    if (original._retry) {
      authService.logout()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    const refreshed = await scheduleRefresh()
    if (!refreshed) {
      authService.logout()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    original._retry = true
    const session = authService.getSession()
    if (session?.access) {
      original.headers.Authorization = `Bearer ${session.access}`
    }
    return http(original)
  },
)
