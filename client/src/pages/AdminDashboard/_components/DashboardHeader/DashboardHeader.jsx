import { RefreshCw } from 'lucide-react'

// Section heading plus the manual refresh — the dashboard's numbers load on
// mount and on this button only (no live socket feed in MVP, spec §3.5).
const DashboardHeader = ({ onRefresh, isRefreshing }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1
        id="admin-dashboard-heading"
        className="text-2xl font-black tracking-tight sm:text-3xl"
      >
        Dashboard
      </h1>
      <p className="text-admin-muted mt-1 text-sm font-medium">
        Platform overview
      </p>
    </div>
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="text-admin-ink/75 hover:bg-admin-ink/5 hover:text-admin-ink flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw
        aria-hidden="true"
        className={`h-4 w-4 ${isRefreshing ? 'motion-safe:animate-spin' : ''}`}
      />
      Refresh
    </button>
  </div>
)

export default DashboardHeader
