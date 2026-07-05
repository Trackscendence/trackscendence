import Avatar from '@/components/Avatar'
import profileFormatters from '../../_utils/profileFormatters'

const ProfileAvatar = ({ profile }) => {
  const displayName = profileFormatters.getDisplayName(profile)

  return (
    <Avatar
      alt={`${displayName} avatar`}
      className="text-[42px]"
      initials={profileFormatters.getInitials(profile)}
      size={132}
    />
  )
}

export default ProfileAvatar
