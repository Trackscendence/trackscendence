import Modal from '@/components/Modal'
import ProfileEditForm from '../ProfileEditForm'

const ProfileEditDialog = ({
  error,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  profile,
}) => {
  return (
    <Modal isOpen={isOpen} title="Edit profile" onClose={onClose}>
      <ProfileEditForm
        error={error}
        isSubmitting={isSubmitting}
        profile={profile}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}

export default ProfileEditDialog
