import Avatar from '@/components/Avatar'
import profileFormatters from '../../_utils/profileFormatters'

// The initials font tracks the avatar diameter so small (mobile) renders stay
// proportionate to the desktop 132px default.
const ProfileAvatar = ({ profile, size = 132 }) => {
  const displayName = profileFormatters.getDisplayName(profile)

  return (
    <Avatar
      alt={`${displayName} avatar`}
      className={size < 100 ? 'text-2xl' : 'text-[42px]'}
      initials={profileFormatters.getInitials(profile)}
      size={size}
      src={profile.avatarUrl || undefined}
    />
  )
}

export default ProfileAvatar
