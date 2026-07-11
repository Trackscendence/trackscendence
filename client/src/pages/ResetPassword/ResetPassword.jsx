import { useNavigate } from 'react-router-dom'
import Url from '@/components/Url'
import ResetPasswordForm from './_components/ResetPasswordForm'

const ResetPassword = () => {
  const navigate = useNavigate()

  return (
    <>
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
        Remembered your password? <Url to="/login">Log in</Url>
      </p>
    </>
  )
}

export default ResetPassword
