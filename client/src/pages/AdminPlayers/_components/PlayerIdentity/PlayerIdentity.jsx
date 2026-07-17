import AdminBadge from '@/components/AdminBadge'
import Avatar from '@/components/Avatar'
import ProfileLink from '@/components/ProfileLink'
import {
  getPlayerInitials,
  getPlayerName,
} from '../../_utils/playersFormatters'

// Row identity for the Players section (#502): avatar, name linking to the
// public profile, the operator badge for admin rows, and the handle. Used by
// both the desktop column and the stacked mobile card so the two renderings
// cannot drift.
const PlayerIdentity = ({ user }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Avatar
      alt={getPlayerName(user)}
      initials={getPlayerInitials(user)}
      size={36}
      src={user.avatarUrl || undefined}
    />
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <ProfileLink
          username={user.username}
          className="text-admin-ink truncate text-sm font-bold hover:underline"
        >
          {getPlayerName(user)}
        </ProfileLink>
        <AdminBadge role={user.role} />
      </div>
      <p className="text-admin-muted truncate text-xs font-medium">
        @{user.username}
      </p>
    </div>
  </div>
)

export default PlayerIdentity
