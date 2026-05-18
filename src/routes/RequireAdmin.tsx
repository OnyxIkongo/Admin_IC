import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'

export function RequireAdmin() {
  const location = useLocation()
  const session = authService.getSession()
  if (!session?.access) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
