import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import useSocketStore from '@/stores/useSocketStore'
import { checkApiHealth } from '@/services/system'
import {
  getBootRetryDelay,
  isBootConnectionError,
} from '@/utils/bootConnectivity'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProtectedRoute from '@/router/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProfileLayout from '@/layouts/ProfileLayout'
import ToastViewport from '@/components/ToastViewport'
import Login from '@/pages/Login'
import OAuth42Callback from '@/pages/OAuth42Callback'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import ChangePassword from '@/pages/ChangePassword'
import SignupSuccess from '@/pages/SignupSuccess'
import Leaderboard from '@/pages/Leaderboard'
import Profile from '@/pages/Profile'
import Game from '@/pages/Game'
import Outcome from '@/pages/Outcome'
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
  const token = useAuthStore((state) => state.token)
  const [bootStatus, setBootStatus] = useState('checking')
  const [bootError, setBootError] = useState(null)
  const isBootReady = bootStatus === 'ready'

  useEffect(() => {
    let isCancelled = false
    let retryTimer = null

    const probe = async (attempt = 0) => {
      try {
        await checkApiHealth()
        if (!isCancelled) {
          setBootStatus('ready')
          setBootError(null)
        }
      } catch (error) {
        if (isCancelled) return

        if (!isBootConnectionError(error)) {
          setBootStatus('error')
          setBootError(error)
          return
        }

        retryTimer = setTimeout(
          () => probe(attempt + 1),
          getBootRetryDelay(attempt),
        )
      }
    }

    probe()

    return () => {
      isCancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    if (!isBootReady) return
    useAuthStore.getState().init()
  }, [isBootReady])

  // The app session owns the socket: connect once per login, disconnect when
  // the token clears (logout or expiry). Pages must only add and remove their
  // own listeners — a page-level disconnect during the waiting room -> game
  // navigation made the server abandon the game it had just started (#188).
  useEffect(() => {
    if (!isBootReady || !token) return undefined
    useSocketStore.getState().connect(token)
    return () => useSocketStore.getState().disconnect()
  }, [isBootReady, token])

  useEffect(() => {
    const handler = (e) =>
      useAuthStore.getState().handleSessionExpired(e.detail?.token)
    window.addEventListener('trackscendence:session-expired', handler)
    return () =>
      window.removeEventListener('trackscendence:session-expired', handler)
  }, [])

  if (bootStatus === 'checking') {
    return (
      <LoadingSpinner
        className="bg-surface-warm text-[#2A1A08]"
        heading="Starting up"
        message="Waking the table..."
        showProgress
      />
    )
  }

  if (bootStatus === 'error') {
    return (
      <div
        role="alert"
        className="bg-surface-warm flex min-h-screen flex-col items-center justify-center px-6 text-center text-[#2A1A08]"
      >
        <h1 className="text-3xl font-black uppercase">Server error</h1>
        <p className="mt-3 max-w-md text-sm font-semibold text-[#2A1A08]/70">
          {bootError?.message || 'The server is not ready.'}
        </p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup/success" element={<SignupSuccess />} />
          <Route path="/oauth/42/callback" element={<OAuth42Callback />} />
        </Route>

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<WaitingRoom />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/results" element={<Outcome />} />
          <Route element={<ProfileLayout />}>
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/users/me"
              element={<Navigate to="/profile" replace />}
            />
            <Route path="/users/:username" element={<User />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<AppLayout />}>
            <Route path="/session" element={<Session />} />
            <Route path="/game" element={<Game />} />
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
