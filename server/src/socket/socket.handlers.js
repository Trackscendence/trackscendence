const logger = require('#utils/logger')
const lobbyStore = require('#modules/game/lobby.store')
const gameStore = require('#modules/game/game.store')
const matchmaking = require('#modules/game/matchmaking.service')
const gameService = require('#modules/game/game.service')
const roomService = require('#modules/room/room.service')

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

/**
 * Pushes the full room list to every connected client. With the MVP's single
 * room this is cheap; once many rooms exist, this is the seam to scope the
 * broadcast to lobby watchers instead.
 */
const broadcastRooms = async (io) => {
  io.emit('rooms_update', await roomService.listRooms())
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

  // Auto-seat: called by the waiting room on mount. Whoever arrives first
  // creates the room (and owns it), everyone after that fills a seat. When the
  // last seat fills, the match starts for exactly the room's players.
  socket.on('room:seat', async () => {
    try {
      const room = await roomService.seatUser(socket.user)
      logger.info(`User ${socket.user.username} seated in room ${room.id}`)

      if (room.status === 'OPEN' && roomService.isRoomFull(room)) {
        // Two concurrent seats of the last slot both see a full OPEN room
        // (socket.io does not serialize async handlers), and both used to
        // start a match — two parallel games for the same players (#232).
        // The claim is a compare-and-set; only its winner starts the match.
        if (await roomService.claimRoomForGame(room.id)) {
          try {
            const match = await matchmaking.createMatch(room.players)
            await roomService.markRoomInGame(room.id, match.gameId)
            startMatch(io, match)
          } catch (error) {
            // A failed start must not strand the room in IN_GAME with no
            // game: reopen it so a member leaving or the next seat retries.
            await roomService.releaseRoomClaim(room.id)
            throw error
          }
        }
      }

      await broadcastRooms(io)
    } catch (error) {
      logger.error('Failed to seat player', error)
      socket.emit('room_error', {
        message: error.message || 'Unable to join a room',
      })
    }
  })

  socket.on('room:leave', async () => {
    try {
      const leftRoom = await roomService.leaveOpenRoom(socket.user.id)
      if (leftRoom) {
        await broadcastRooms(io)
      }
    } catch (error) {
      logger.error('Failed to leave room', error)
      socket.emit('room_error', { message: 'Unable to leave the room' })
    }
  })

  // Lobby page hydration: send the room list to just this socket; later
  // changes arrive via the broadcast in `broadcastRooms`.
  socket.on('room:list', async () => {
    try {
      socket.emit('rooms_update', await roomService.listRooms())
    } catch (error) {
      logger.error('Failed to list rooms', error)
      socket.emit('room_error', { message: 'Unable to load rooms' })
    }
  })

  // Leaves the matchmaking queue without dropping the connection. The socket
  // now lives for the whole session (it is no longer owned by the lobby page),
  // so navigating away from the lobby sends this instead of disconnecting.
  socket.on('leave_lobby', () => {
    logger.info(`User ${socket.user.username} left the lobby`)
    socket.leave('lobby')
    lobbyStore.removePlayer(socket.user.id)
    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })
  })

  socket.on('disconnect', async () => {
    logger.info('user disconnected')
    lobbyStore.removePlayer(socket.user.id)
    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })

    // The waiting room sends room:leave on unmount, but a closed tab or
    // dropped connection never gets to — unseat here too so the room never
    // shows a ghost occupant.
    try {
      const leftRoom = await roomService.leaveOpenRoom(socket.user.id)
      if (leftRoom) {
        await broadcastRooms(io)
      }
    } catch (error) {
      logger.error('Failed to unseat disconnected player', error)
    }

    // If the player dropped mid-game, abandon the game and free its engine so
    // it does not leak, and let the remaining players know.
    const abandonedGame = await matchmaking.handlePlayerDisconnect(
      socket.user.id,
    )
    if (abandonedGame) {
      io.to(`game:${abandonedGame.id}`).emit('game_over', {
        gameId: abandonedGame.id,
        winnerUserId: null,
        reason: 'player_left',
        abandonedBy: socket.user.id,
      })

      try {
        if (await roomService.closeRoomsForGame(abandonedGame.id)) {
          await broadcastRooms(io)
        }
      } catch (error) {
        logger.error('Failed to close room for abandoned game', error)
      }
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
    if (!engine.winner) return

    const state = await gameStore.getGame(gameId)
    // Status check and flip with no await in between: this is the gate that
    // makes game-end processing (and the save below) run exactly once when
    // this races the abandon path. It relies on the store handing out a
    // shared object, so the first flip is immediately visible to the loser;
    // a copy-returning store (Redis) must replace it with an atomic
    // compare-and-set inside the store.
    if (!state || state.status !== 'IN_PROGRESS') return
    state.status = 'COMPLETED'
    state.winner = engine.winner
    state.endedAt = new Date()
    await gameStore.saveGame(gameId, state)
    gameStore.deleteEngine(gameId)

    // Persist before the game_over emit so the results screen reads a
    // leaderboard that already includes this game. A failed save loses the
    // stats row (logged, worth alerting on) but must never block tearing the
    // game down for the players.
    try {
      await gameService.persistGameResult(state)
    } catch (error) {
      logger.error(`Failed to persist completed game ${gameId}`, error)
    }

    // Same payload shape as the abandon path below: winnerUserId carries the
    // outcome, reason says how the game ended.
    io.to(`game:${gameId}`).emit('game_over', {
      gameId,
      winnerUserId: engine.winner,
      reason: 'completed',
    })

    // The room served its purpose once the game ends; close it so the
    // lobby offers a fresh room for the next round.
    try {
      if (await roomService.closeRoomsForGame(gameId)) {
        await broadcastRooms(io)
      }
    } catch (error) {
      logger.error('Failed to close room for finished game', error)
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
