import { useSearchParams } from 'react-router-dom'
import GameTable from './_components/GameTable'
import getMockGameState from './_utils/mockState'

const SUPPORTED_PLAYER_COUNTS = new Set(['2', '3', '4'])

const getPlayerCount = (value) => {
  if (SUPPORTED_PLAYER_COUNTS.has(value)) return Number(value)
  return 4
}

const Game = () => {
  const [searchParams] = useSearchParams()
  const game = getMockGameState(getPlayerCount(searchParams.get('players')))
  const currentPlayer =
    game.players.find((player) => player.seat === 'bottom') ?? game.players[0]
  const opponents = game.players.filter(
    (player) => player.id !== currentPlayer.id,
  )

  return (
    <GameTable
      currentColor={game.currentColor}
      currentPlayer={currentPlayer}
      currentTurnPlayerId={game.currentTurnPlayerId}
      deckSize={game.deckSize}
      direction={game.direction}
      opponents={opponents}
      topCard={game.topCard}
    />
  )
}

export default Game
