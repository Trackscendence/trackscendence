import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Pagination from '@/components/Pagination'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import LeaderboardFilters from './_components/LeaderboardFilters'
import LeaderboardRankingTable from './_components/LeaderboardRankingTable'

const DEFAULT_FILTERS = {
  search: '',
  minGames: '',
  sort: 'wins',
  order: 'desc',
}

// The full leaderboard surface: filter bar, ranking table, pagination. It owns
// its filter state and loads through the game store, so a page embeds it as a
// single self-contained block. Promoted from the /leaderboard page so other
// surfaces can reuse it, the way /profile reuses the shared table (#447).
const LeaderboardSection = () => {
  const leaderboard = useGameStore((state) => state.leaderboard)
  const pagination = useGameStore((state) => state.leaderboardPagination)
  const isLoading = useGameStore((state) => state.isLeaderboardLoading)
  const error = useGameStore((state) => state.leaderboardError)
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      try {
        await useGameStore.getState().loadLeaderboard({ ...filters, page })
      } catch {
        // Store owns leaderboard error state.
      }
    }

    load()
  }, [filters, page])

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters)
    setPage(1)
  }

  return (
    <section className="space-y-4 bg-[#ffd099] p-4 sm:p-6">
      <LeaderboardFilters
        defaultValues={DEFAULT_FILTERS}
        isSubmitting={isLoading}
        onApply={applyFilters}
      />

      {error ? (
        <p className="bg-white px-4 py-4 text-sm font-semibold text-[#8a321f] sm:px-5">
          {error}
        </p>
      ) : isLoading ? (
        <div className="bg-white px-4 py-8 sm:px-5">
          <LoadingSpinner message="Loading leaderboard" />
        </div>
      ) : (
        <LeaderboardRankingTable
          rows={leaderboard}
          currentUserId={currentUserId}
        />
      )}

      <Pagination
        pagination={pagination}
        disabled={isLoading}
        onPageChange={setPage}
      />
    </section>
  )
}

export default LeaderboardSection
