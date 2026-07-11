import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import useSocketStore from '@/stores/useSocketStore'
import { initSessionTeardown } from '@/stores/sessionTeardown'
import { checkApiHealth } from '@/services/system'
import {
  getBootRetryDelay,
  hasExhaustedBootRetries,
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
const Messages = lazy(() => import('@/pages/Messages'))
const OAuth42Callback = lazy(() => import('@/pages/OAuth42Callback'))
const Outcome = lazy(() => import('@/pages/Outcome'))
const PrivacyPolicy = lazy(() => import('@/pages/Privacy'))
const Profile = lazy(() => import('@/pages/Profile'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Session = lazy(() => import('@/pages/Session'))
const Settings = lazy(() => import('@/pages/Settings'))
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
const DevHud = import.meta.env.DEV ? lazy(() => import('@/dev/DevHud')) : null

const App = () => {
  const navigate = useNavigate()
  const notifications = useNotificationStore((state) => state.notifications)
  const dismissNotification = useNotificationStore((state) => state.dismiss)
  const token = useAuthStore((state) => state.token)
  const [bootStatus, setBootStatus] = useState('checking')
  const [bootError, setBootError] = useState(null)
  const [bootAttempt, setBootAttempt] = useState(1)
  // Bumping this re-runs the probe effect from scratch — the "Retry" button on
  // the unreachable screen increments it.
  const [bootRetryNonce, setBootRetryNonce] = useState(0)
  const isBootReady = bootStatus === 'ready'

  useEffect(() => {
    let isCancelled = false
    let retryTimer = null

    const probe = async (attempt = 0) => {
      if (!isCancelled) setBootAttempt(attempt + 1)
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

        // Connection error: the API isn't answering yet. Retry with backoff
        // while it might still be starting, but stop once we've exhausted the
        // attempts and tell the user the server is unreachable — a spinner that
        // never resolves hid exactly this failure during local dev.
        if (hasExhaustedBootRetries(attempt)) {
          setBootStatus('unreachable')
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
  }, [bootRetryNonce])

  const retryBoot = () => {
    setBootStatus('checking')
    setBootError(null)
    setBootAttempt(1)
    setBootRetryNonce((nonce) => nonce + 1)
  }

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

  // Session teardown (#391): clears the user-scoped stores synchronously when
  // the token clears or changes, so the next user never sees the previous
  // user's data. The subscription fires inside the auth state transition, not
  // after a render cycle like the socket effect above.
  useEffect(() => initSessionTeardown(), [])

  // A reconnecting client that still has a game in progress is routed back into
  // it, unless it is already on the game page. This is what makes the 90s
  // reconnect window usable after a full tab close: the browser can land the
  // player anywhere, and they are still returned to their game.
  useEffect(() => {
    const handler = (e) => {
      const gameId = e.detail?.gameId
      if (!gameId || window.location.pathname === '/game') return
      navigate(`/game?gameId=${gameId}`)
    }
    window.addEventListener('trackscendence:active-game', handler)
    return () =>
      window.removeEventListener('trackscendence:active-game', handler)
  }, [navigate])

  if (bootStatus === 'checking') {
    // Stay quiet for the first tries (the API is legitimately starting), then
    // start showing the attempt count so a slow boot doesn't look like a hang.
    const message =
      bootAttempt > 3
        ? `Waking the table... (attempt ${bootAttempt})`
        : 'Waking the table...'
    return (
      <LoadingSpinner
        className="bg-surface-warm text-[#2A1A08]"
        heading="Starting up"
        message={message}
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

  if (bootStatus === 'unreachable') {
    return (
      <div
        role="alert"
        className="bg-surface-warm flex min-h-screen flex-col items-center justify-center px-6 text-center text-[#2A1A08]"
      >
        <h1 className="text-3xl font-black uppercase">
          Cannot reach the server
        </h1>
        <p className="mt-3 max-w-md text-sm font-semibold text-[#2A1A08]/70">
          The app could not connect after {bootAttempt} attempts. The API is
          likely still starting or has stopped.
        </p>
        {bootError?.message ? (
          <p className="mt-2 max-w-md font-mono text-xs text-[#2A1A08]/50">
            {bootError.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={retryBoot}
          className="text-surface-warm focus-visible:ring-offset-surface-warm mt-6 rounded-lg bg-[#2A1A08] px-6 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A1A08] focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <LoadingSpinner
            className="bg-surface-warm text-[#2A1A08]"
            message="Loading"
          />
        }
      >
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup/success" element={<SignupSuccess />} />
          </Route>

          {/* Standalone (no AuthLayout header): the callback is a full-screen
              transition into the app, not an auth form. */}
          <Route path="/oauth/42/callback" element={<OAuth42Callback />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<WaitingRoom />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/messages" element={<Messages />} />
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
              <Route path="/settings" element={<Settings />} />
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
      {DevHud ? (
        <Suspense fallback={null}>
          <DevHud />
        </Suspense>
      ) : null}
    </ErrorBoundary>
  )
}

export default App
