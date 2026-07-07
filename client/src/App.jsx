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
import RoleRoute from '@/router/RoleRoute'
import { USER_ROLES } from '@/utils/authorization'

const AdminAccess = lazy(() => import('@/pages/AdminAccess'))
const ChangePassword = lazy(() => import('@/pages/ChangePassword'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const Game = lazy(() => import('@/pages/Game'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Lobby = lazy(() => import('@/pages/Lobby'))
const Login = lazy(() => import('@/pages/Login'))
const OAuth42Callback = lazy(() => import('@/pages/OAuth42Callback'))
const Outcome = lazy(() => import('@/pages/Outcome'))
const PrivacyPolicy = lazy(() => import('@/pages/Privacy'))
const Profile = lazy(() => import('@/pages/Profile'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Session = lazy(() => import('@/pages/Session'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const Signup = lazy(() => import('@/pages/Signup'))
const SignupSuccess = lazy(() => import('@/pages/SignupSuccess'))
const TermsOfService = lazy(() => import('@/pages/TermsOfService'))
const User = lazy(() => import('@/pages/User'))
const WaitingRoom = lazy(() => import('@/pages/WaitingRoom'))

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
      <Suspense fallback={<LoadingSpinner message="Loading page" />}>
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
      </Suspense>
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
