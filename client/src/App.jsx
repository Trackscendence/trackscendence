import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import PublicLayout from '@/layouts/PublicLayout'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import ChangePassword from '@/pages/ChangePassword'
import Session from '@/pages/Session'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsOfService from '@/pages/TermsOfService'

const App = () => {
  useEffect(() => {
    useAuthStore.getState().init()
  }, [])

  useEffect(() => {
    const handler = () => useAuthStore.getState().handleSessionExpired()
    window.addEventListener('trackscendence:session-expired', handler)
    return () =>
      window.removeEventListener('trackscendence:session-expired', handler)
  }, [])

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicLayout />}>
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
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
