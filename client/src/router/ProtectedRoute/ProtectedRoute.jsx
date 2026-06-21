import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import LoadingSpinner from '@/components/LoadingSpinner'

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner message="Loading session" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
