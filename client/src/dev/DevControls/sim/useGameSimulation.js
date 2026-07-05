import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import useGameStore from '@/stores/useGameStore'
import useDevStore from '../useDevStore'
import { DEV_GAME_ID } from '../constants'
import SimEngine from './simEngine'

// Drives the Rig's "Simulate game" mode: a local engine deals a game between
// the logged-in user and house bots, and bots (including the user's own seat)
// take one visible action per tick. Every tick lands in the store exactly
// like a live game_state_update, so the table page needs no changes to
// render it.

// Bots occupy negative user ids so they can never collide with a real
// (positive, database-assigned) user id.
const BOT_SEATS = [
  { userId: -1, username: 'uno' },
  { userId: -2, username: 'skip' },
  { userId: -3, username: 'bot' },
]

const SPEED_MS = { slow: 1600, normal: 900, fast: 350 }

// A wild needs a declared color: pick the one the hand holds most of, the
// same greedy call a human makes.
const pickDeclaredColor = (hand) => {
  const counts = {}
  hand.forEach((card) => {
    if (card.color === 'WILD') return
    counts[card.color] = (counts[card.color] ?? 0) + 1
  })
  const ranked = Object.entries(counts).sort(
    (left, right) => right[1] - left[1],
  )
  return ranked[0]?.[0] ?? 'RED'
}

// One action per tick so the table steps like a watched game instead of
// jumping: play the first playable card, otherwise draw. A draw only keeps
// the turn when the drawn card is playable, so the follow-up tick plays it.
const playNextAction = (engine) => {
  const { currentPlayer } = engine.getState()
  const hand = engine.getHand(currentPlayer)

  if (engine.hasDrawnThisTurn) {
    const drawnIndex = hand.length - 1
    const drawnCard = hand[drawnIndex]
    engine.playCard(
      currentPlayer,
      drawnIndex,
      drawnCard.color === 'WILD' ? pickDeclaredColor(hand) : null,
    )
    return
  }

  const playableIndex = hand.findIndex((card) => engine.canPlayCard(card))
  if (playableIndex === -1) {
    engine.drawCard(currentPlayer)
    return
  }
  const cardToPlay = hand[playableIndex]
  engine.playCard(
    currentPlayer,
    playableIndex,
    cardToPlay.color === 'WILD' ? pickDeclaredColor(hand) : null,
  )
}

const pushState = (engine, ownUserId) => {
  useGameStore.getState().setGameState({
    ...engine.getState(),
    myHand: engine.getHand(ownUserId),
    gameId: DEV_GAME_ID,
  })
}

const useGameSimulation = () => {
  const { pathname } = useLocation()
  const simulateGame = useDevStore((state) => state.simulateGame)
  const simSpeed = useDevStore((state) => state.simSpeed)
  const simPlayers = useDevStore((state) => state.simPlayers)
  const simRunId = useDevStore((state) => state.simRunId)
  const user = useAuthStore((state) => state.user)
  const engineRef = useRef(null)

  // Engine lifecycle: deal a fresh game when the sim switches on (or Restart
  // bumps simRunId, or the player count changes), withdraw it when the sim
  // switches off or the page is left. Speed stays out of these deps on
  // purpose — changing it must not re-deal.
  useEffect(() => {
    if (!simulateGame || !user || pathname !== '/game') return undefined
    const { gameState, setGamePlayers } = useGameStore.getState()
    // Never clobber a real game already on the table.
    if (gameState && gameState.gameId !== DEV_GAME_ID) return undefined

    const players = [
      { userId: user.id, username: user.username },
      ...BOT_SEATS.slice(0, Number(simPlayers) - 1),
    ]
    const engine = new SimEngine(players.map((player) => player.userId))
    engineRef.current = engine
    setGamePlayers(players)
    pushState(engine, user.id)

    return () => {
      engineRef.current = null
      // Withdraw only our own simulated game, so a real one is left alone.
      const current = useGameStore.getState().gameState
      if (current?.gameId === DEV_GAME_ID) useGameStore.getState().clearGame()
    }
  }, [simulateGame, simPlayers, simRunId, user, pathname])

  // Ticker: advance the running game one action at a time.
  useEffect(() => {
    if (!simulateGame || !user || pathname !== '/game') return undefined
    const timer = setInterval(() => {
      const engine = engineRef.current
      if (!engine || engine.winner) return
      try {
        playNextAction(engine)
      } catch {
        // Both piles exhausted (theoretically possible) — freeze this game
        // rather than log every tick; Restart deals a new one.
        engineRef.current = null
        return
      }
      pushState(engine, user.id)
    }, SPEED_MS[simSpeed] ?? SPEED_MS.normal)
    return () => clearInterval(timer)
  }, [simulateGame, simSpeed, simPlayers, simRunId, user, pathname])
}

export default useGameSimulation
