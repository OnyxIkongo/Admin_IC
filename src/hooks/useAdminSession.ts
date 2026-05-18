import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminSession } from '@/types/domain'
import { authService } from '@/services/authService'

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(() => authService.getSession())

  useEffect(() => {
    const onStorage = () => setSession(authService.getSession())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const s = await authService.login(email, password)
    setSession(s)
    return s
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setSession(null)
  }, [])

  return useMemo(
    () => ({ session, isAuthenticated: !!session, login, logout }),
    [session, login, logout],
  )
}

