import BackButton from '@/components/BackButton'
import { AUTH_TOKEN_KEY } from '@/services/auth'
import ChangePasswordForm from './_components/ChangePasswordForm'

const ChangePassword = () => {
  const handleSuccess = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    window.location.replace('/login?passwordChanged=1')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1f2d28]">
      <header className="relative z-20 flex items-start">
        <BackButton className="h-[27px] w-[138px] shrink-0" />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[414px]">
          <h1 className="mb-8 text-center text-4xl font-semibold text-[#081934] uppercase">
            Change password
          </h1>

          <ChangePasswordForm onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  )
}

export default ChangePassword
