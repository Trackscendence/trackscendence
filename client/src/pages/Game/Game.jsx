import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import ChatPanelButton from './_components/ChatPanelButton'
import ExitGameButton from './_components/ExitGameButton'
import GameTable from './_components/GameTable'
import mapServerGameState from './_utils/mapServerGameState'
import { getMockGameFromSearchParams } from './_utils/mockState'

// Move sending is #200; until then the table is display-only.
const noop = () => undefined

const GameScreen = ({ children }) => (
  <main className="bg-surface-warm relative min-h-[100svh]">
    <ExitGameButton />
    <ChatPanelButton />
    {children}
  </main>
)

const Game = () => {
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const gameState = useGameStore((state) => state.gameState)
  const gamePlayers = useGameStore((state) => state.gamePlayers)

  // Mock table for design work, reachable only in dev builds through the
  // Rig's data-source switch (which adds ?source=mock). Vite erases this
  // branch from production bundles.
  if (import.meta.env.DEV && searchParams.get('source') === 'mock') {
    return (
      <GameScreen>
        <GameTable
          {...getMockGameFromSearchParams(searchParams)}
          onDrawPileClick={noop}
          onUnoClick={noop}
        />
      </GameScreen>
    )
  }

  // The first game_state_update lands right after game_start; hold on a
  // loader until it does. A stale state from a previous game (mismatched
  // gameId) also waits here. A mid-game refresh clears the state entirely
  // until the resync request lands (#201).
  const gameId = searchParams.get('gameId')
  const hasStateForThisGame =
    Boolean(user && gameState) && (!gameId || gameState.gameId === gameId)
  if (!hasStateForThisGame) {
    return (
      <GameScreen>
        <LoadingSpinner
          className="bg-surface-warm text-black"
          message="Waiting for the game"
        />
      </GameScreen>
    )
  }

  const table = mapServerGameState({
    state: gameState,
    matchPlayers: gamePlayers,
    ownUserId: user.id,
    ownUsername: user.username,
  })

  return (
    <GameScreen>
      <GameTable {...table} onDrawPileClick={noop} onUnoClick={noop} />
    </GameScreen>
  )
}

export default Game
