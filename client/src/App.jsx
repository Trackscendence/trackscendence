import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/router/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import ChangePassword from '@/pages/ChangePassword'
import Game from '@/pages/Game'
import Session from '@/pages/Session'
import PrivacyPolicy from '@/pages/Privacy'
import TermsOfService from '@/pages/TermsOfService'
import SettingsPage from './pages/SettingsPage'

const App = () => {
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
        </Route>

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route element={<ProtectedRoute />}>
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
    </ErrorBoundary>
  )
}

export default App
