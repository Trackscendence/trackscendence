// Account-status pill for the Administration console. A presenter: it maps a
// `UserStatus` value (ACTIVE / SUSPENDED / BANNED, any case) to its status
// token on a tinted fill and renders nothing for unknown values, so callers
// can pass a row's status straight through. Callers: the Players table rows
// (#502) and the admin user detail view (#504).
const STATUS_STYLES = {
  ACTIVE: 'bg-status-active/10 text-status-active',
  SUSPENDED: 'bg-status-suspended/10 text-status-suspended',
  BANNED: 'bg-status-banned/10 text-status-banned',
}

const StatusBadge = ({ status, className = '' }) => {
  const key = String(status || '').toUpperCase()
  const style = STATUS_STYLES[key]
  if (!style) return null

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${style} ${className}`}
    >
      {key.toLowerCase()}
    </span>
  )
}

export default StatusBadge
