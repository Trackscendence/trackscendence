import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { Layout } from './layouts/Layout'
import LoginPage from './pages/LoginPage'
import SessionPage from './pages/SessionPage'
import SignupPage from './pages/SignupPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SessionPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
