import useAuthStore from '@/stores/useAuthStore'
import BasicChat from './_components/BasicChat'

// The socket is connected at the app level (App.jsx) for the whole session,
// so this page no longer opens or closes its own connection.
const Session = () => {
  const { user } = useAuthStore()

  return (
    <div>
      <div className="rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Signed in</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
            <p className="text-sm font-medium text-[#617267]">Display name</p>
            <p className="mt-1 text-base font-semibold">
              {user.displayName || user.username}
            </p>
          </div>
          <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
            <p className="text-sm font-medium text-[#617267]">Email</p>
            <p className="mt-1 text-base font-semibold">{user.email}</p>
          </div>
          <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
            <p className="text-sm font-medium text-[#617267]">Username</p>
            <p className="mt-1 text-base font-semibold">{user.username}</p>
          </div>
          <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
            <p className="text-sm font-medium text-[#617267]">Role</p>
            <p className="mt-1 text-base font-semibold">{user.role}</p>
          </div>
          <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
            <p className="text-sm font-medium text-[#617267]">
              Two-factor authentication
            </p>
            <p className="mt-1 text-base font-semibold">
              {user.twoFactorEnabled
                ? 'Enabled'
                : user.twoFactorSetupPending
                  ? 'Setup pending'
                  : 'Disabled'}
            </p>
          </div>
        </div>
      </div>
      <BasicChat />
    </div>
  )
}

export default Session
