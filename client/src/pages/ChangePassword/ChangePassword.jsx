import BackButton from '@/components/BackButton'
import useAuthStore from '@/stores/useAuthStore'
import ChangePasswordForm from './_components/ChangePasswordForm'

const ChangePassword = () => {
  const handleSuccess = () => {
    // Changing the password bumps the server tokenVersion, invalidating the
    // current token — clear the session through the auth store rather than
    // reaching into token storage from a page.
    useAuthStore.getState().clearSession()
    window.location.replace('/login?passwordChanged=1')
  }

  return (
    <div className="bg-surface-warm flex min-h-screen flex-col text-[#081934]">
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
