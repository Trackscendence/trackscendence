import { Navigate, Outlet, useLocation } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import useAuthStore from '@/stores/useAuthStore'
import { hasRequiredRole } from '@/utils/authorization'

const RoleRoute = ({ allowedRoles, redirectTo = '/' }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner message="Checking permissions" />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasRequiredRole(user, allowedRoles)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default RoleRoute
