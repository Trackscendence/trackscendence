const SELECT_CLASS =
  'border-admin-ink/15 bg-admin-surface text-admin-ink min-h-11 w-full rounded-xl border px-3 text-sm font-semibold focus:ring-2 focus:ring-admin-accent/40 focus:outline-none sm:w-auto'

// The status/role filter row (#502). A presenter: current values arrive as
// props and every change is reported upward, where the page round-trips it
// through the store (the server does the filtering, not the client).
const PlayersFilters = ({
  statusFilter,
  roleFilter,
  onStatusChange,
  onRoleChange,
}) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
    <label className="text-admin-muted flex flex-col gap-1 text-xs font-bold tracking-[0.08em] uppercase sm:flex-row sm:items-center sm:gap-2">
      Status
      <select
        className={SELECT_CLASS}
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="">All</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="BANNED">Banned</option>
      </select>
    </label>
    <label className="text-admin-muted flex flex-col gap-1 text-xs font-bold tracking-[0.08em] uppercase sm:flex-row sm:items-center sm:gap-2">
      Role
      <select
        className={SELECT_CLASS}
        value={roleFilter}
        onChange={(event) => onRoleChange(event.target.value)}
      >
        <option value="">All</option>
        <option value="USER">Player</option>
        <option value="ADMIN">Admin</option>
      </select>
    </label>
  </div>
)

export default PlayersFilters
