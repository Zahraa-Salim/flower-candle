import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }
  return <Outlet />
}
