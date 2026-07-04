import { useSearchParams } from 'react-router-dom'
import ChatPanelButton from './_components/ChatPanelButton'
import ExitGameButton from './_components/ExitGameButton'
import GameTable from './_components/GameTable'
import { getMockGameState } from './_utils/mockState'

const SUPPORTED_PLAYER_COUNTS = new Set(['2', '3', '4'])
const SUPPORTED_DIRECTIONS = new Set(['clockwise', 'counter-clockwise'])
const SUPPORTED_SEATS = new Set(['bottom', 'top', 'left', 'right'])

const getPlayerCount = (value) => {
  if (SUPPORTED_PLAYER_COUNTS.has(value)) return Number(value)
  return 4
}

const getDirection = (value) => {
  if (SUPPORTED_DIRECTIONS.has(value)) return value
  return undefined
}

const getNonNegativeInteger = (value) => {
  if (value == null) return undefined
  const parsedValue = Number(value)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) return undefined
  return parsedValue
}

const getSeat = (value) => {
  if (SUPPORTED_SEATS.has(value)) return value
  return 'bottom'
}

const Game = () => {
  const [searchParams] = useSearchParams()
  const game = getMockGameState({
    direction: getDirection(searchParams.get('direction')),
    handSize: getNonNegativeInteger(searchParams.get('handSize')),
    pendingDraw: getNonNegativeInteger(searchParams.get('pendingDraw')),
    playerCount: getPlayerCount(searchParams.get('players')),
  })
  const currentSeat = getSeat(searchParams.get('current-player'))
  const currentPlayer =
    game.players.find((player) => player.seat === currentSeat) ??
    game.players[0]
  const opponents = game.players.filter(
    (player) => player.id !== currentPlayer.id,
  )
  const handleDrawPileClick = () => undefined
  const handleUnoClick = () => undefined

  return (
    <main className="relative min-h-[100svh] bg-surface-warm">
      <ExitGameButton />
      <ChatPanelButton />
      <GameTable
        currentPlayer={currentPlayer}
        currentTurnPlayerId={game.currentTurnPlayerId}
        deckSize={game.deckSize}
        direction={game.direction}
        onDrawPileClick={handleDrawPileClick}
        onUnoClick={handleUnoClick}
        opponents={opponents}
        pendingDraw={game.pendingDraw}
        topCard={game.topCard}
      />
    </main>
  )
}

export default Game
