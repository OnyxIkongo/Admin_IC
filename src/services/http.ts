import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { getApiBaseUrl } from '@/config/apiBaseUrl'
import { authService } from '@/services/authService'

const SESSION_KEY = 'ingenious_city_admin_session'
const baseURL = getApiBaseUrl()

function setAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  if (!token) return
  // Axios v1: headers peut être AxiosHeaders (préférer .set)
  if (config.headers && 'set' in config.headers && typeof config.headers.set === 'function') {
    config.headers.set('Authorization', `Bearer ${token}`)
    return
  }
  if (!config.headers) {
    config.headers = new AxiosHeaders()
  }
  ;(config.headers as unknown as AxiosHeaders).set('Authorization', `Bearer ${token}`)
}

function goToLogin() {
  if (window.location.hash.startsWith('#/login')) return
  if (window.location.pathname.startsWith('/login')) return
  window.location.assign('/#/login')
}

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
  // FormData : ne pas fixer Content-Type (sinon pas de boundary → fichier ignoré par Django).
  if (config.data instanceof FormData) {
    if (config.headers && 'set' in config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', false)
    } else if (config.headers) {
      delete (config.headers as Record<string, unknown>)['Content-Type']
    }
  }

  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return config
  try {
    const s = JSON.parse(raw) as { access?: string; token?: string }
    const token = s.access || s.token
    if (token) {
      setAuthHeader(config, token)
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
      goToLogin()
      return Promise.reject(error)
    }

    if (original._retry) {
      authService.logout()
      goToLogin()
      return Promise.reject(error)
    }

    const refreshed = await scheduleRefresh()
    if (!refreshed) {
      authService.logout()
      goToLogin()
      return Promise.reject(error)
    }

    original._retry = true
    const session = authService.getSession()
    if (session?.access) {
      setAuthHeader(original, session.access)
    }
    return http(original)
  },
)
