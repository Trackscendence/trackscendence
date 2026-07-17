import { useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import useAdminStore from '@/stores/useAdminStore'
import DashboardHeader from './_components/DashboardHeader'
import DashboardStats from './_components/DashboardStats'
import WeeklyActivity from './_components/WeeklyActivity'

// Dashboard section of the Administration console (#501). Container only:
// reads the admin store, loads stats on mount, and hands real numbers to the
// presenters. Numbers refresh on the header button, not a socket feed.
const AdminDashboard = () => {
  const stats = useAdminStore((state) => state.stats)
  const isLoadingStats = useAdminStore((state) => state.isLoadingStats)
  const statsError = useAdminStore((state) => state.statsError)

  useEffect(() => {
    const loadStats = async () => {
      try {
        await useAdminStore.getState().loadStats()
      } catch {
        // The store owns stats error state.
      }
    }
    loadStats()
  }, [])

  const handleRefresh = () => {
    useAdminStore.getState().loadStats()
  }

  return (
    <section aria-labelledby="admin-dashboard-heading" className="space-y-6">
      <DashboardHeader
        onRefresh={handleRefresh}
        isRefreshing={isLoadingStats}
      />
      {statsError ? (
        <p
          role="alert"
          className="bg-status-banned/10 text-status-banned rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          {statsError}
        </p>
      ) : null}
      {isLoadingStats && !stats ? (
        <LoadingSpinner message="Loading stats" />
      ) : null}
      {stats ? (
        <>
          <DashboardStats stats={stats} />
          <WeeklyActivity
            gamesSeries={stats.gamesThisWeek ?? []}
            playersSeries={stats.newPlayersThisWeek ?? []}
          />
        </>
      ) : null}
    </section>
  )
}

export default AdminDashboard
