import { useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/AuthPageShell'
import TextLink from '@/components/TextLink'
import ResetPasswordForm from './_components/ResetPasswordForm'

const ResetPassword = () => {
  const navigate = useNavigate()

  return (
    <AuthPageShell title="Reset password">
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
        Remembered your password? <TextLink to="/login">Log in</TextLink>
      </p>
    </AuthPageShell>
  )
}

export default ResetPassword
