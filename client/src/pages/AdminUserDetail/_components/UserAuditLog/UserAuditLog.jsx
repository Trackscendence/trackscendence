import { ACTION_LABELS, formatDateTime } from '../../_utils/detailFormatters'

// Recent admin actions on this account (#504) — what turns a button into
// accountability. Presenter: entries arrive as props, newest first.
const UserAuditLog = ({ entries }) => (
  <div className="bg-admin-surface rounded-2xl p-4 shadow-sm sm:p-5">
    <h2 className="text-admin-muted text-xs font-bold tracking-[0.08em] uppercase">
      Audit log
    </h2>
    {entries.length === 0 ? (
      <p className="text-admin-muted mt-3 text-sm font-medium">
        No admin actions recorded for this account.
      </p>
    ) : (
      <ul className="divide-admin-ink/5 mt-2 divide-y">
        {entries.map((entry) => (
          <li key={entry.id} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-admin-ink text-sm font-bold">
                {ACTION_LABELS[entry.action] || entry.action}
                <span className="text-admin-muted font-medium">
                  {' '}
                  by {entry.actor?.username || 'system'}
                </span>
              </p>
              <p className="text-admin-muted text-xs font-medium">
                {formatDateTime(entry.createdAt)}
              </p>
            </div>
            {entry.reason ? (
              <p className="text-admin-muted mt-0.5 text-sm">{entry.reason}</p>
            ) : null}
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default UserAuditLog
