import { Link, useNavigate } from 'react-router-dom'
import ResetPasswordForm from './_components/ResetPasswordForm'

const ResetPassword = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[414px]">
        <h1 className="mb-8 text-center text-5xl font-semibold text-[#081934] uppercase">
          Reset password
        </h1>

        <ResetPasswordForm
          onSuccess={() =>
            navigate('/login', {
              replace: true,
              state: {
                message:
                  'Password has been reset. Sign in with your new password.',
              },
            })
          }
        />

        <p className="mt-5 text-center text-sm text-[#081934]">
          Remembered your password?{' '}
          <Link
            className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
            to="/login"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
