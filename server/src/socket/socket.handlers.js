const logger = require('#utils/logger')
const lobbyStore = require('#modules/game/lobby.store')
const gameStore = require('#modules/game/game.store')
const matchmaking = require('#modules/game/matchmaking.service')

/**
 * Emits the public game state to every player, injecting each player's own
 * private hand. Reads only the engine's public interface (getPlayerIds/getHand)
 * so the engine's information-hiding stays intact.
 */
const broadcastGameState = (io, gameId, engine) => {
  const publicState = engine.getState()

  engine.getPlayerIds().forEach((playerId) => {
    io.to(`user:${playerId}`).emit('game_state_update', {
      ...publicState,
      myHand: engine.getHand(playerId),
      gameId,
    })
  })
}

/**
 * Moves a started match's players out of the lobby and into their game room,
 * then pushes the initial state. Players are addressed by their `user:${id}`
 * rooms, so no live socket references are needed here.
 */
const startMatch = (io, { gameId, players, engine }) => {
  players.forEach(({ userId }) => {
    io.in(`user:${userId}`).socketsLeave('lobby')
    io.in(`user:${userId}`).socketsJoin(`game:${gameId}`)
    io.to(`user:${userId}`).emit('game_start', { gameId, players })
  })
  broadcastGameState(io, gameId, engine)
}

const registerHandlers = (io, socket) => {
  socket.join('channel:#general')
  socket.join(`user:${socket.user.id}`)

  logger.info('user connected')

  socket.on('join_lobby', async () => {
    logger.info(`User ${socket.user.username} joined the lobby`)
    socket.join('lobby')
    lobbyStore.addPlayer(socket.user)
    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })

    // Drain the queue: keep starting matches while enough players are waiting.
    // This also re-checks the threshold after each match, so players are never
    // left stranded at the threshold waiting for the next join.
    try {
      let match = await matchmaking.tryStartMatch()
      while (match) {
        startMatch(io, match)
        match = await matchmaking.tryStartMatch()
      }
    } catch (error) {
      // tryStartMatch rolled the players back into the queue; surface the
      // failure and let the next join retry.
      logger.error('Failed to start match', error)
      io.to('lobby').emit('lobby_error', { message: 'Unable to start game' })
    }

    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })
  })

  socket.on('disconnect', async () => {
    logger.info('user disconnected')
    lobbyStore.removePlayer(socket.user.id)
    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })

    // If the player dropped mid-game, abandon the game and free its engine so
    // it does not leak, and let the remaining players know.
    const abandonedGame = await matchmaking.handlePlayerDisconnect(
      socket.user.id,
    )
    if (abandonedGame) {
      io.to(`game:${abandonedGame.id}`).emit('game_over', {
        gameId: abandonedGame.id,
        reason: 'player_left',
        abandonedBy: socket.user.id,
      })
    }
  })

  socket.on('message', (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return
    }

    const room = typeof data.room === 'string' ? data.room : ''
    if (!room || !socket.rooms.has(room)) {
      return
    }

    const payload = { ...data, user: socket.user }
    io.to(room).emit('message', payload)
  })

  const checkGameEnd = async (gameId, engine) => {
    if (engine.winner) {
      const state = await gameStore.getGame(gameId)
      if (state) {
        state.status = 'COMPLETED'
        state.winner = engine.winner
        state.endedAt = new Date()
        await gameStore.saveGame(gameId, state)
      }
      gameStore.deleteEngine(gameId)
    }
  }

  socket.on('game:play_card', async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    const { gameId, cardIndex, declaredColor } = data

    const engine = gameStore.getEngine(gameId)
    if (!engine) return socket.emit('game_error', { message: 'Game not found' })

    try {
      engine.playCard(socket.user.id, cardIndex, declaredColor)
      broadcastGameState(io, gameId, engine)
      await checkGameEnd(gameId, engine)
    } catch (err) {
      socket.emit('game_error', { message: err.message })
    }
  })

  socket.on('game:draw_card', async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    const { gameId } = data

    const engine = gameStore.getEngine(gameId)
    if (!engine) return socket.emit('game_error', { message: 'Game not found' })

    try {
      const result = engine.drawCard(socket.user.id)
      socket.emit('game_drawn_card', {
        gameId,
        card: result.card,
        playable: result.playable,
      })
      broadcastGameState(io, gameId, engine)
      await checkGameEnd(gameId, engine)
    } catch (err) {
      socket.emit('game_error', { message: err.message })
    }
  })

  socket.on('game:pass_turn', async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    const { gameId } = data

    const engine = gameStore.getEngine(gameId)
    if (!engine) return socket.emit('game_error', { message: 'Game not found' })

    try {
      engine.pass(socket.user.id)
      broadcastGameState(io, gameId, engine)
      await checkGameEnd(gameId, engine)
    } catch (err) {
      socket.emit('game_error', { message: err.message })
    }
  })
}

module.exports = registerHandlers
