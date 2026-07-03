import { Link } from 'react-router-dom'
import { AUTH_TOKEN_KEY } from '@/services/auth'
import ChangePasswordForm from './_components/ChangePasswordForm'

const ChangePassword = () => {
  const handleSuccess = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    window.location.replace('/login?passwordChanged=1')
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[414px]">
        <h1 className="mb-8 text-center text-4xl font-semibold text-[#081934] uppercase">
          Change password
        </h1>

        <ChangePasswordForm onSuccess={handleSuccess} />

        <p className="mt-5 text-center text-sm text-[#081934]">
          <Link
            className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
            to="/"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ChangePassword
