import { useEffect } from 'react'
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
import Session from '@/pages/Session'
import User from '@/pages/User'
import PrivacyPolicy from '@/pages/Privacy'
import TermsOfService from '@/pages/TermsOfService'
import SettingsPage from './pages/SettingsPage'

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
          <Route path="/game" element={<Game />} />
          <Route element={<ProfileLayout />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/:username" element={<User />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/" element={<Session />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/game" element={<Game />} />
            <Route path="/settings" element={<SettingsPage />} />
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
    </ErrorBoundary>
  )
}

export default App
