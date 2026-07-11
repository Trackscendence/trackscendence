import BackButton from '@/components/BackButton'
import AuthPageShell from '@/components/AuthPageShell'
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
    <div className="flex min-h-screen flex-col bg-white text-[#1f2d28]">
      <header className="relative z-20 flex items-start">
        <BackButton className="h-[27px] w-[138px] shrink-0" />
      </header>

      <AuthPageShell title="Change password" titleSize="md">
        <ChangePasswordForm onSuccess={handleSuccess} />
      </AuthPageShell>
    </div>
  )
}

export default ChangePassword
