import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AdminBadge from '@/components/AdminBadge'
import Avatar from '@/components/Avatar'
import StatusBadge from '@/components/StatusBadge'
import { formatDateTime } from '../../_utils/detailFormatters'

// Identity block of the admin user detail (#504): back to the table, then
// avatar, name, badges, and the account facts the list column has no room
// for. Presenter — the user arrives as a prop.
const UserDetailHeader = ({ user }) => (
  <div className="space-y-4">
    <Link
      to="/admin/players"
      className="text-admin-ink/75 hover:text-admin-ink inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      All players
    </Link>
    <div className="flex flex-wrap items-center gap-4">
      <Avatar
        alt={user.displayName || user.username}
        initials={(user.displayName || user.username).slice(0, 2).toUpperCase()}
        size={64}
        src={user.avatarUrl || undefined}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="text-2xl font-black tracking-tight break-words sm:text-3xl">
            {user.displayName || user.username}
          </h1>
          <AdminBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>
        <p className="text-admin-muted mt-1 text-sm font-medium break-all">
          @{user.username} · {user.email}
        </p>
        <p className="text-admin-muted text-xs font-medium">
          Joined {formatDateTime(user.createdAt)}
        </p>
      </div>
    </div>
  </div>
)

export default UserDetailHeader
