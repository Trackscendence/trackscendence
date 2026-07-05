import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/router/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProfileLayout from '@/layouts/ProfileLayout'
import ToastViewport from '@/components/ToastViewport'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import ChangePassword from '@/pages/ChangePassword'
import SignupSuccess from '@/pages/SignupSuccess'
import Leaderboard from '@/pages/Leaderboard'
import Profile from '@/pages/Profile'
import Game from '@/pages/Game'
import Lobby from '@/pages/Lobby'
import WaitingRoom from '@/pages/WaitingRoom'
import Session from '@/pages/Session'
import User from '@/pages/User'
import PrivacyPolicy from '@/pages/Privacy'
import TermsOfService from '@/pages/TermsOfService'
import RoleRoute from '@/router/RoleRoute'
import { USER_ROLES } from '@/utils/authorization'
import AdminAccess from '@/pages/AdminAccess'
import SettingsPage from './pages/SettingsPage'
// Guarded with `import.meta.env.DEV` DIRECTLY (not the aliased DEV_MODE): Vite
// replaces this literal inline before it scans for dynamic imports, so in a
// production build the false branch and its import() are eliminated — no dev
// chunk is emitted and the entire dev-tools tree is absent from prod bundles.
const DevControls = import.meta.env.DEV
  ? lazy(() => import('@/dev/DevControls'))
  : null

const App = () => {
  const notifications = useNotificationStore((state) => state.notifications)
  const dismissNotification = useNotificationStore((state) => state.dismiss)

  useEffect(() => {
    useAuthStore.getState().init()
  }, [])

  useEffect(() => {
    const handler = (e) =>
      useAuthStore.getState().handleSessionExpired(e.detail?.token)
    window.addEventListener('trackscendence:session-expired', handler)
    return () =>
      window.removeEventListener('trackscendence:session-expired', handler)
  }, [])

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup/success" element={<SignupSuccess />} />
        </Route>

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<WaitingRoom />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route element={<ProfileLayout />}>
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/users/me"
              element={<Navigate to="/profile" replace />}
            />
            <Route path="/users/:username" element={<User />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/session" element={<Session />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/game" element={<Game />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
              <Route path="/admin" element={<AdminAccess />} />
            </Route>
            <Route
              path="/two-factor"
              element={<Navigate to="/settings" replace />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      {DevControls ? (
        <Suspense fallback={null}>
          <DevControls />
        </Suspense>
      ) : null}
    </ErrorBoundary>
  )
}

export default App
