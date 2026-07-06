import getInitials from '@/utils/getInitials'
import useNotificationStore from '@/stores/useNotificationStore'
import useProfileStore from '@/stores/useProfileStore'
import SettingsCard from '../SettingsCard'
import AccountForm from './_components/AccountForm'
import AvatarUploader from './_components/AvatarUploader'

const AccountSettings = ({ user }) => {
  // One in-flight flag for every account write. The form's Save and the avatar
  // controls all read it, so while any write runs the others are disabled and
  // the store guards against a second write starting. No concurrent writes.
  const isSubmitting = useProfileStore((state) => state.isSubmitting)

  const notify = (message, type) =>
    useNotificationStore.getState().push(message, type)

  // The store actions return the server result on success or null on failure,
  // leaving the message in actionError. Surface either as a toast, matching the
  // rest of the profile flow.
  const runProfileAction = async (action, successMessage) => {
    const result = await action()

    if (result) {
      notify(successMessage, 'success')
      return
    }

    notify(
      useProfileStore.getState().actionError || 'Something went wrong',
      'error',
    )
  }

  const handleSave = (payload) =>
    runProfileAction(
      () => useProfileStore.getState().updateCurrentProfile(payload),
      'Profile updated',
    )

  const handleUpload = (file) =>
    runProfileAction(
      () => useProfileStore.getState().uploadAvatar(file),
      'Avatar updated',
    )

  const handleRemove = () =>
    runProfileAction(
      () => useProfileStore.getState().removeAvatar(),
      'Avatar removed',
    )

  return (
    <>
      <SettingsCard title="Profile photo">
        <AvatarUploader
          avatarUrl={user.avatarUrl}
          initials={getInitials(user.displayName || user.username)}
          isBusy={isSubmitting}
          onInvalidFile={(message) => notify(message, 'error')}
          onRemove={handleRemove}
          onUpload={handleUpload}
        />
      </SettingsCard>

      <SettingsCard title="Personal info">
        <AccountForm
          email={user.email}
          initialBio={user.bio}
          initialDisplayName={user.displayName}
          isSubmitting={isSubmitting}
          username={user.username}
          onSave={handleSave}
        />
      </SettingsCard>
    </>
  )
}

export default AccountSettings
