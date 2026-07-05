import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import OutcomeView from './_components/OutcomeView'
import getOutcomeCopy from './_utils/getOutcomeCopy'
import leaderboardWindow from './_utils/leaderboardWindow'
import mockLeaderboard from './_utils/mockLeaderboard'

// Post-game results screen (issue #155). The result is read from the `outcome`
// query param for now — the game table is still mock-driven, so this slots in
// ahead of the real `game_over` socket event. Reads the ranked list from the
// game store and shows a snapshot windowed around the player.
const Outcome = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const leaderboard = useGameStore((state) => state.leaderboard)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        await useGameStore.getState().loadLeaderboard()
      } catch {
        // The store swallows fetch errors; the view falls back to its own
        // empty/mock state, so there is nothing to handle here.
      }
    }

    loadLeaderboard()
  }, [])

  if (!user) return null

  const copy = getOutcomeCopy(searchParams.get('outcome'))
  const source =
    leaderboard.length > 0
      ? leaderboard
      : import.meta.env.DEV
        ? mockLeaderboard(user)
        : []
  const rows = leaderboardWindow({
    leaderboard: source,
    currentUserId: user.id,
    delta: copy.delta,
  })

  const handlePlayAgain = () => {
    useGameStore.getState().clearGame()
    navigate('/')
  }

  // The lobby (#185) is where a finished game hands back to; /session stays
  // the signed-in dashboard.
  const handleHome = () => navigate('/lobby')

  return (
    <OutcomeView
      title={copy.title}
      subtitle={copy.subtitle}
      celebrate={copy.celebrate}
      rows={rows}
      currentUserId={user.id}
      onPlayAgain={handlePlayAgain}
      onHome={handleHome}
    />
  )
}

export default Outcome
