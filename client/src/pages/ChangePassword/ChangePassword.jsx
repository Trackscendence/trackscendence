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
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#1f2d28]">
      <header className="relative z-20 flex items-start">
        <BackButton className="h-10 w-full max-w-[160px] shrink-0 sm:h-[27px] sm:w-[138px]" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-5 sm:py-10">
        <div className="w-full max-w-[414px]">
          <h1 className="mb-8 text-center text-3xl font-semibold text-[#081934] uppercase sm:text-4xl">
            Change password
          </h1>

          <ChangePasswordForm onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  )
}

export default ChangePassword
