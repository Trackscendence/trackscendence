import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import Layout from '@/layouts/Layout'
import OutcomeView from './_components/OutcomeView'
import getOutcomeCopy from './_utils/getOutcomeCopy'
import leaderboardWindow from './_utils/leaderboardWindow'
import mockLeaderboard from './_utils/mockLeaderboard'

// Post-game results screen. The result comes from the store, written by the
// game_over socket event; the `outcome` query param survives only as a dev
// fallback (the Rig's "Skip to outcome" jump). Reads the ranked list from the
// game store and shows a snapshot windowed around the player.
const Outcome = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const leaderboard = useGameStore((state) => state.leaderboard)

  // Snapshot the result once instead of subscribing. The Lobby / Play Again
  // buttons call clearGame(), which nulls gameOutcome; a live subscription
  // would re-render this still-mounted page, hit the "no outcome" fallback
  // below, and redirect to '/' before the button's own navigate('/lobby')
  // lands — so the Lobby button ended up in the waiting room. game_over writes
  // the result before the Game page routes here, so reading it once is enough.
  const [outcome] = useState(
    () =>
      useGameStore.getState().gameOutcome ??
      (import.meta.env.DEV ? searchParams.get('outcome') : null),
  )

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

  // Landing here without a finished game (typed URL, stale tab) has nothing
  // to show — go back to the waiting room instead of faking a win.
  if (!outcome) return <Navigate to="/" replace />

  const copy = getOutcomeCopy(outcome)
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
  // the signed-in dashboard. Clearing here too keeps a finished game's state
  // from lingering under the next visit to /game.
  const handleHome = () => {
    useGameStore.getState().clearGame()
    navigate('/lobby')
  }

  return (
    <Layout showHeader={false} className="bg-surface-outcome">
      <OutcomeView
        title={copy.title}
        subtitle={copy.subtitle}
        celebrate={copy.celebrate}
        rows={rows}
        currentUserId={user.id}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    </Layout>
  )
}

export default Outcome
