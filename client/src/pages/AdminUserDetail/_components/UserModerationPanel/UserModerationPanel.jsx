import Button from '@/components/Button'
import { formatDateTime } from '../../_utils/detailFormatters'

// Which verbs the account's current state offers — the same ladder as the
// table's row menu, as visible buttons.
const actionsForUser = (user) => {
  const actions = [
    user.role === 'ADMIN'
      ? { type: 'role', label: 'Make player', variant: 'outline' }
      : { type: 'role', label: 'Make admin', variant: 'outline' },
  ]
  if (user.status === 'ACTIVE') {
    actions.push({ type: 'suspend', label: 'Suspend', variant: 'orange' })
    actions.push({ type: 'ban', label: 'Ban', variant: 'danger' })
  }
  if (user.status === 'SUSPENDED') {
    actions.push({ type: 'reinstate', label: 'Reinstate', variant: 'primary' })
    actions.push({ type: 'ban', label: 'Ban', variant: 'danger' })
  }
  if (user.status === 'BANNED') {
    actions.push({ type: 'reinstate', label: 'Reinstate', variant: 'primary' })
  }
  actions.push({ type: 'delete', label: 'Delete account', variant: 'danger' })
  return actions
}

// Moderation state and controls (#504). Presenter: state facts and the verb
// buttons; every press is reported upward, where the shared dialogs confirm.
// The admin's own record shows the facts but no verbs.
const UserModerationPanel = ({ user, isSelf, isPending, onAction }) => (
  <div className="bg-admin-surface space-y-4 rounded-2xl p-4 shadow-sm sm:p-5">
    <h2 className="text-admin-muted text-xs font-bold tracking-[0.08em] uppercase">
      Moderation
    </h2>
    <dl className="space-y-1 text-sm">
      {user.statusReason ? (
        <div className="flex flex-wrap gap-1">
          <dt className="text-admin-muted font-medium">Reason:</dt>
          <dd className="text-admin-ink font-semibold">{user.statusReason}</dd>
        </div>
      ) : null}
      {user.suspendedUntil ? (
        <div className="flex flex-wrap gap-1">
          <dt className="text-admin-muted font-medium">Suspended until:</dt>
          <dd className="text-admin-ink font-semibold">
            {formatDateTime(user.suspendedUntil)}
          </dd>
        </div>
      ) : null}
      {user.statusUpdatedAt ? (
        <div className="flex flex-wrap gap-1">
          <dt className="text-admin-muted font-medium">Status changed:</dt>
          <dd className="text-admin-ink font-semibold">
            {formatDateTime(user.statusUpdatedAt)}
          </dd>
        </div>
      ) : null}
      {!user.statusReason && !user.suspendedUntil && !user.statusUpdatedAt ? (
        <p className="text-admin-muted font-medium">
          No moderation history on this account.
        </p>
      ) : null}
    </dl>
    {isSelf ? (
      <p className="text-admin-muted text-sm font-medium">
        This is your own account — moderation actions are disabled.
      </p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {actionsForUser(user).map((action) => (
          <Button
            key={`${action.type}-${action.label}`}
            fullWidth={false}
            variant={action.variant}
            disabled={isPending}
            onClick={() => onAction(action.type)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </div>
)

export default UserModerationPanel
