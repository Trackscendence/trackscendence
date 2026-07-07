import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import getPlayerIdentity from '@/utils/getPlayerIdentity'
import { DEV_GAME_ID } from '@/dev/DevControls/constants'
import GameScreen from './_components/GameScreen'
import GameTable from './_components/GameTable'
import LiveGameTable from './_components/LiveGameTable'
import GamePausedOverlay from './_components/GamePausedOverlay'
import mapServerGameState from './_utils/mapServerGameState'
import { getMockGameFromSearchParams } from './_utils/mockState'

// The mock table is display-only; its handlers go nowhere.
const noop = () => undefined

// Breathing room between the final broadcast and the results screen, so the
// winning move is seen landing instead of being cut off mid-animation.
const GAME_OVER_NAVIGATE_DELAY_MS = 1200

const Game = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const gameState = useGameStore((state) => state.gameState)
  const gamePlayers = useGameStore((state) => state.gamePlayers)
  const gameOutcome = useGameStore((state) => state.gameOutcome)
  const pausedGame = useGameStore((state) => state.pausedGame)

  const gameId = searchParams.get('gameId')

  // game_over ends the game here: hold the final table for a beat, then route
  // on the outcome. A forfeit sends the leaver to the lobby and the survivors
  // to their reopened room to wait; every other ending goes to the results
  // screen, which reads the outcome from the store.
  useEffect(() => {
    if (!gameOutcome) return undefined
    const destination =
      gameOutcome === 'left'
        ? '/lobby'
        : gameOutcome === 'rematch'
          ? '/'
          : '/results'
    const navigateTimer = setTimeout(
      () => navigate(destination),
      GAME_OVER_NAVIGATE_DELAY_MS,
    )
    return () => clearTimeout(navigateTimer)
  }, [gameOutcome, navigate])

  // Resync (#201): a page refresh or late mount holds a gameId in the URL
  // but no state for it — the socket missed the last broadcast. Ask the
  // server to replay it; the loader below holds until the snapshot lands.
  // Dev-rigged game ids never reach the server (they exist only client-side).
  useEffect(() => {
    if (!gameId || gameOutcome) return
    if (import.meta.env.DEV && gameId === DEV_GAME_ID) return
    const { gameState: currentState, requestGameState } =
      useGameStore.getState()
    if (currentState && currentState.gameId === gameId) return
    requestGameState(gameId)
  }, [gameId, gameOutcome])

  // Map the server snapshot onto GameTable props. Hoisted above the early
  // returns below because hooks must run unconditionally; it null-guards the
  // pre-snapshot states. A new gameState reference arrives every turn, so this
  // still recomputes once per game_state_update — its value is skipping the
  // recompute when Game re-renders for an unrelated slice (pausedGame,
  // gameOutcome), not memoizing across turns.
  const table = useMemo(() => {
    if (!user || !gameState) return null
    const isSimulatedGame =
      import.meta.env.DEV && gameState.gameId === DEV_GAME_ID
    return mapServerGameState({
      state: gameState,
      matchPlayers: gamePlayers,
      ownUserId: user.id,
      ownUsername: user.username,
      ownDisplayName: user.displayName,
      ownAvatarUrl: user.avatarUrl,
      isSpectator: isSimulatedGame,
    })
  }, [gameState, gamePlayers, user])

  // Mock table for design work, reachable only in dev builds through the
  // Rig's data-source switch (which adds ?source=mock). Vite erases this
  // branch from production bundles.
  if (import.meta.env.DEV && searchParams.get('source') === 'mock') {
    return (
      <GameScreen currentUserId={user?.id}>
        <GameTable
          {...getMockGameFromSearchParams(searchParams)}
          onCallUno={noop}
          onCatchUno={noop}
          onDrawPileClick={noop}
        />
      </GameScreen>
    )
  }

  // The first game_state_update lands right after game_start; hold on a
  // loader until it does. A stale state from a previous game (mismatched
  // gameId) also waits here, as does a mid-game refresh until the resync
  // snapshot requested above arrives.
  const hasStateForThisGame =
    Boolean(user && gameState) && (!gameId || gameState.gameId === gameId)
  if (!hasStateForThisGame) {
    return (
      <GameScreen currentUserId={user?.id}>
        <LoadingSpinner
          className="bg-surface-warm text-black"
          message="Waiting for the game"
        />
      </GameScreen>
    )
  }

  // The Rig's simulation plays every seat itself (including this user's), so
  // its table is a spectator surface: no flag it maps is interactive, and no
  // click may reach the socket — the server has no game under the dev id.
  // In production builds this is statically false and the dev import above
  // tree-shakes away with it.
  const isSimulatedGame =
    import.meta.env.DEV && gameState.gameId === DEV_GAME_ID

  if (isSimulatedGame) {
    return (
      <GameScreen currentUserId={user.id}>
        <GameTable
          {...table}
          onCallUno={noop}
          onCatchUno={noop}
          onDrawPileClick={noop}
        />
      </GameScreen>
    )
  }

  // While paused, name the players the table is waiting for so the overlay can
  // caption the countdown ("Waiting for Alice…").
  const pausedNames = pausedGame
    ? pausedGame.userIds.map(
        (userId) =>
          getPlayerIdentity(
            gamePlayers.find((player) => player.userId === userId),
          ).name,
      )
    : []

  return (
    <GameScreen currentUserId={user.id} gameId={gameState.gameId}>
      <LiveGameTable gameId={gameState.gameId} table={table} />
      {pausedGame ? (
        <GamePausedOverlay names={pausedNames} deadline={pausedGame.deadline} />
      ) : null}
    </GameScreen>
  )
}

export default Game
