import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAccountDataStore from '@/stores/useAccountDataStore'
import useNotificationStore from '@/stores/useNotificationStore'
import SettingsCard from '../SettingsCard'

const DeleteAccountSettings = ({ user }) => {
  const navigate = useNavigate()
  const isDeleting = useAccountDataStore((state) => state.isDeleting)
  const [confirmation, setConfirmation] = useState('')
  const canDelete = confirmation.trim() === user.username && !isDeleting

  const handleSubmit = async (event) => {
    event.preventDefault()

    const result = await useAccountDataStore
      .getState()
      .deleteAccount(confirmation)

    if (!result) {
      useNotificationStore
        .getState()
        .push(
          useAccountDataStore.getState().error || 'Account deletion failed',
          'error',
        )
      return
    }

    useNotificationStore.getState().push('Account deleted', 'success')
    navigate('/login', { replace: true })
  }

  return (
    <SettingsCard title="Delete account">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm leading-6 text-[#5f4c3d]">
          This removes your profile details, revokes API keys, clears security
          settings, and keeps past match records under an anonymized player.
        </p>

        <label className="block text-sm font-semibold text-[#1c1410]">
          Type {user.username} to confirm
          <input
            className="mt-2 w-full rounded-xl border border-[#d6c2ae] bg-white px-3 py-2 text-sm font-medium text-[#1c1410] transition outline-none focus:border-[#c35b2e] focus:ring-2 focus:ring-[#c35b2e]/20"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#b93820] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9f2f1b] focus-visible:ring-2 focus-visible:ring-[#b93820] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={!canDelete}
        >
          {isDeleting ? 'Deleting account...' : 'Delete account'}
        </button>
      </form>
    </SettingsCard>
  )
}

export default DeleteAccountSettings
