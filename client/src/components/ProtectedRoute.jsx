import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'

const ProtectedRoute = () => {
	const { isAuthenticated, isLoading } = useAuth()
	const location = useLocation()

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#f4f7f2] text-sm font-medium text-[#27352f]">
				Loading session
			</div>
		)
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />
	}

	return <Outlet />
}

export default ProtectedRoute
