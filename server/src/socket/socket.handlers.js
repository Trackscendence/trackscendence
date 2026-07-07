const logger = require('#utils/logger')
const config = require('#utils/config')
const lobbyStore = require('#modules/game/lobby.store')
const gameStore = require('#modules/game/game.store')
const matchmaking = require('#modules/game/matchmaking.service')
const gameService = require('#modules/game/game.service')
const botTurns = require('#modules/game/bot-turn.service')
const roomService = require('#modules/room/room.service')
const devRunner = require('#modules/game/dev-runner.service')
const { buildGameStatePayload } = require('#modules/game/game.contract')
const { registerChatHandlers } = require('./chat.handlers')
const { runExclusiveRoomAction } = require('./room-action-guard')

// Grace timers for players who dropped mid-game, keyed by userId. Module
// scoped on purpose: the timer must survive the socket that scheduled it and
// be cancellable from the player's next connection.
const pendingAbandons = new Map()
const pendingDevRunsByRoom = new Map()
const devRoomExpirations = new Map()
const devGameTimers = new Map()
const DEV_ROOM_TTL_MS = 5 * 60 * 1000

const stopDevGameRun = (gameId) => {
  const timer = devGameTimers.get(gameId)
  if (timer) clearTimeout(timer)
  devGameTimers.delete(gameId)
}

const clearDevRoomExpiration = (roomId) => {
  const timer = devRoomExpirations.get(roomId)
  if (timer) clearTimeout(timer)
  devRoomExpirations.delete(roomId)
}

const scheduleDevRoomExpiration = (io, roomId) => {
  clearDevRoomExpiration(roomId)
  const timer = setTimeout(() => {
    pendingDevRunsByRoom.delete(roomId)
    devRoomExpirations.delete(roomId)
    roomService
      .closeOpenRoomById(roomId)
      .then(async (closedRoom) => {
        if (!closedRoom) return
        closedRoom.players.forEach((player) => {
          io.to(`user:${player.userId}`).emit('room:closed', {
            roomId: closedRoom.id,
          })
        })
        await broadcastRooms(io)
      })
      .catch((error) => logger.error('Failed to expire dev room', error))
  }, DEV_ROOM_TTL_MS)
  devRoomExpirations.set(roomId, timer)
}

const scheduleDevGameRun = ({ io, gameId, delayMs, checkGameEnd }) => {
  stopDevGameRun(gameId)
  const tick = async () => {
    devGameTimers.delete(gameId)
    const engine = gameStore.getEngine(gameId)
    if (!engine || engine.winner) {
      stopDevGameRun(gameId)
      return
    }

    try {
      devRunner.playNextAction(engine)
      broadcastGameState(io, gameId, engine)
      await checkGameEnd(gameId, engine)
    } catch (error) {
      stopDevGameRun(gameId)
      logger.error(`Failed to advance dev game ${gameId}`, error)
      return
    }

    const currentEngine = gameStore.getEngine(gameId)
    if (!currentEngine || currentEngine.winner) {
      stopDevGameRun(gameId)
      return
    }
    devGameTimers.set(gameId, setTimeout(tick, delayMs))
  }

  devGameTimers.set(gameId, setTimeout(tick, delayMs))
}

/**
 * Abandons whatever IN_PROGRESS game the player is in and notifies the
 * survivors. Runs when the reconnect grace expires without the player coming
 * back; a game that meanwhile completed is left alone (handlePlayerDisconnect
 * re-checks the status).
 */
const abandonActiveGame = async (io, userId) => {
  const abandonedGame = await matchmaking.handlePlayerDisconnect(userId)
  if (!abandonedGame) return
  stopDevGameRun(abandonedGame.id)
  botTurns.clearBotTurnTimer(abandonedGame.id)

  io.to(`game:${abandonedGame.id}`).emit('game_over', {
    gameId: abandonedGame.id,
    winnerUserId: null,
    reason: 'player_left',
    abandonedBy: userId,
  })

  try {
    if (await roomService.closeRoomsForGame(abandonedGame.id)) {
      await broadcastRooms(io)
    }
  } catch (error) {
    logger.error('Failed to close room for abandoned game', error)
  }
}

/**
 * Emits the public game state to every player, injecting each player's own
 * private hand. The payload shape lives in game.contract so it stays
 * regression-tested against hand leaks (game.contract.test.js).
 */
const broadcastGameState = (io, gameId, engine) => {
  engine.getPlayerIds().forEach((playerId) => {
    io.to(`user:${playerId}`).emit(
      'game_state_update',
      buildGameStatePayload({ engine, gameId, playerId }),
    )
  })
}

/**
 * Moves a started match's players out of the lobby and into their game room,
 * then pushes the initial state. Players are addressed by their `user:${id}`
 * rooms, so no live socket references are needed here.
 */
const startMatch = (io, { gameId, players, engine }, { checkGameEnd } = {}) => {
  players.forEach(({ userId }) => {
    io.in(`user:${userId}`).socketsLeave('lobby')
    io.in(`user:${userId}`).socketsJoin(`game:${gameId}`)
    io.to(`user:${userId}`).emit('game_start', { gameId, players })
  })
  broadcastGameState(io, gameId, engine)
  if (checkGameEnd) {
    botTurns.scheduleBotTurn({
      io,
      gameId,
      broadcastGameState,
      checkGameEnd,
    })
  }
}

/**
 * Pushes the full room list to every connected client. With the MVP's single
 * room this is cheap; once many rooms exist, this is the seam to scope the
 * broadcast to lobby watchers instead.
 */
const broadcastRooms = async (io) => {
  io.emit('rooms_update', await roomService.listRooms())
}

/**
 * Starts the match for a room that just filled to capacity. Shared by every
 * path that seats a player (auto-seat, create, join). The claim is a
 * compare-and-set so two concurrent seats of the last slot can't both start a
 * game for the same players (#232); a failed start aborts the never-announced
 * match and reopens the room.
 */
const startMatchIfRoomFull = async (io, room, { checkGameEnd } = {}) => {
  if (room.status !== 'OPEN' || !roomService.isRoomFull(room)) return null
  if (!(await roomService.claimRoomForGame(room.id))) return null

  let match
  try {
    match = await matchmaking.createMatch(room.players)
    await roomService.markRoomInGame(room.id, match.gameId)
  } catch (error) {
    if (match) {
      await matchmaking.abortMatch(match.gameId)
    }
    await roomService.releaseRoomClaim(room.id)
    throw error
  }
  startMatch(io, match, { checkGameEnd })
  return match
}

const registerHandlers = (io, socket) => {
  socket.join('channel:#general')
  socket.join(`user:${socket.user.id}`)
  registerChatHandlers(io, socket)

  logger.info('user connected')

  // A returning player arrives on a brand-new socket (page refresh,
  // transport reconnect): cancel their pending abandon and put the socket
  // back into its game's room so game_over and in-game chat reach it again.
  const pendingAbandon = pendingAbandons.get(socket.user.id)
  if (pendingAbandon) {
    clearTimeout(pendingAbandon)
    pendingAbandons.delete(socket.user.id)
  }
  gameStore
    .findActiveGameByUser(socket.user.id, { status: 'IN_PROGRESS' })
    .then((game) => {
      if (game) socket.join(`game:${game.id}`)
    })
    .catch((error) => logger.error('Failed to rejoin game room', error))

  const checkGameEnd = async (gameId, engine) => {
    if (!engine.winner) return

    stopDevGameRun(gameId)
    botTurns.clearBotTurnTimer(gameId)

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
    // Capture the final scores before the engine is freed below; the winner
    // takes the sum of the opponents' hands, everyone else scores 0 (#197).
    state.scores = engine.getScores()
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

    // The game is flushed to PostgreSQL and its engine freed above, so drop its
    // in-memory record too. Without this the state lingers in activeGames for
    // the life of the process (an unbounded leak) and grows the
    // findActiveGameByUser scan that runs on every connect/disconnect.
    await gameStore.deleteGame(gameId)

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

  const maybeStartDevRun = (roomId, match) => {
    if (!match) return
    const run = pendingDevRunsByRoom.get(roomId)
    if (!run) return

    pendingDevRunsByRoom.delete(roomId)
    clearDevRoomExpiration(roomId)
    if (!run.autoRun) return

    scheduleDevGameRun({
      io,
      gameId: match.gameId,
      delayMs: run.delayMs,
      checkGameEnd,
    })
  }

  const fillDevRunRoom = async (room) => {
    const run = pendingDevRunsByRoom.get(room.id)
    if (!run?.autoRun || room.players.length >= room.capacity) return room

    let filledRoom = room
    const seatedIds = new Set(room.players.map((player) => player.userId))
    const fillNames = devRunner.getFillPlayerNames(
      run.playerName,
      room.capacity,
    )
    for (const name of fillNames) {
      if (filledRoom.players.length >= filledRoom.capacity) break
      const player = await devRunner.ensureDevPlayer(name)
      if (seatedIds.has(player.id)) continue
      const joinedRoom = await roomService.joinRoom(player, filledRoom.id)
      if (joinedRoom.id === filledRoom.id) {
        filledRoom = joinedRoom
        seatedIds.add(player.id)
      }
    }
    return filledRoom
  }

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
        startMatch(io, match, { checkGameEnd })
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

  const finishRoomSeat = async (room) => {
    const filledRoom = await fillDevRunRoom(room)
    const match = await startMatchIfRoomFull(io, filledRoom, { checkGameEnd })
    maybeStartDevRun(filledRoom.id, match)
    await broadcastRooms(io)
  }

  const runRoomEntryAction = async (actionName, action) => {
    const result = await runExclusiveRoomAction(
      `room-entry:${socket.user.id}`,
      action,
    )
    if (result.skipped) {
      logger.info(
        `Ignored duplicate ${actionName} for user ${socket.user.username}`,
      )
    }
  }

  // Quick-start auto-seat: called by the waiting room on direct entry. It joins
  // a joinable open room when one exists, otherwise it opens a default room.
  socket.on('room:seat', async (data) => {
    await runRoomEntryAction('room:seat', async () => {
      try {
        const rawCapacity =
          data && typeof data === 'object' ? data.capacity : undefined
        const capacity = rawCapacity == null ? undefined : Number(rawCapacity)

        const room = await roomService.seatUser(socket.user, { capacity })
        logger.info(`User ${socket.user.username} seated in room ${room.id}`)
        await finishRoomSeat(room)
      } catch (error) {
        logger.error('Failed to seat player', error)
        socket.emit('room_error', {
          message: error.message || 'Unable to join a room',
        })
      }
    })
  })

  // Explicit create from the lobby "+ Room" button. This never falls through
  // to someone else's open room; the caller either reuses their own open room
  // or opens a new one at the requested capacity.
  socket.on('room:create', async (data) => {
    await runRoomEntryAction('room:create', async () => {
      try {
        const rawCapacity =
          data && typeof data === 'object' ? data.capacity : undefined
        const capacity = rawCapacity == null ? undefined : Number(rawCapacity)

        const room = await roomService.createRoom(socket.user, { capacity })
        logger.info(`User ${socket.user.username} opened room ${room.id}`)
        await finishRoomSeat(room)
      } catch (error) {
        logger.error('Failed to open room', error)
        socket.emit('room_error', {
          message: error.message || 'Unable to open a room',
        })
      }
    })
  })

  // Join a specific room from the lobby grid (a configurable room someone else
  // created). The match starts if this seat fills it.
  socket.on('room:join', async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    await runRoomEntryAction('room:join', async () => {
      try {
        const room = await roomService.joinRoom(
          socket.user,
          Number(data.roomId),
        )
        logger.info(`User ${socket.user.username} joined room ${room.id}`)
        await finishRoomSeat(room)
      } catch (error) {
        logger.error('Failed to join room', error)
        socket.emit('room_error', {
          message: error.message || 'Unable to join the room',
        })
      }
    })
  })

  socket.on('room:fill_bots', async () => {
    await runRoomEntryAction('room:fill_bots', async () => {
      try {
        const room = await roomService.fillOpenRoomWithBots(socket.user.id)
        logger.info(`User ${socket.user.username} filled room ${room.id}`)
        await finishRoomSeat(room)
      } catch (error) {
        logger.error('Failed to add bot players', error)
        socket.emit('room_error', {
          message: error.message || 'Unable to add bot players',
        })
      }
    })
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

  // Owner-only "End the room" (#221): closes the whole OPEN room instead of
  // just unseating the caller. Every seated player (the owner included) gets a
  // room:closed so their waiting room hands back to the lobby, and the grid
  // drops the room right away via the broadcast.
  socket.on('room:end', async () => {
    try {
      const endedRoom = await roomService.endOwnedRoom(socket.user.id)
      if (!endedRoom) {
        return socket.emit('room_error', {
          message: 'You can only end a room you own',
        })
      }
      pendingDevRunsByRoom.delete(endedRoom.id)
      clearDevRoomExpiration(endedRoom.id)
      endedRoom.players.forEach((player) => {
        io.to(`user:${player.userId}`).emit('room:closed', {
          roomId: endedRoom.id,
        })
      })
      await broadcastRooms(io)
    } catch (error) {
      logger.error('Failed to end room', error)
      socket.emit('room_error', { message: 'Unable to end the room' })
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

  if (config.NODE_ENV === 'development') {
    socket.on('dev:spawn_bot_room', async (data, respond) => {
      const reply = typeof respond === 'function' ? respond : () => {}
      const payload = data && typeof data === 'object' ? data : {}
      const playerName = devRunner.normalizePlayerName(payload.playerName)
      const capacity =
        payload.capacity == null ? 2 : Number.parseInt(payload.capacity, 10)
      const autoRun = Boolean(payload.autoRun)
      const delayMs = devRunner.resolveSpeedMs(payload.speed)

      try {
        const owner = await devRunner.ensureDevPlayer(playerName)
        const room = await roomService.createRoomForOwner(owner, {
          capacity,
          name: `${playerName}'s room`,
        })
        pendingDevRunsByRoom.set(room.id, { autoRun, delayMs, playerName })
        scheduleDevRoomExpiration(io, room.id)
        await broadcastRooms(io)
        logger.info(`Dev room ${room.id} opened by ${owner.username}`)
        reply({ ok: true, room })
      } catch (error) {
        logger.error('Failed to open dev room', error)
        reply({
          ok: false,
          message: error.message || 'Unable to open a dev room',
        })
      }
    })
  }

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

    // If the player dropped mid-game, give them a grace window before the
    // game is abandoned — a page refresh tears the socket down for a few
    // seconds and used to end the game on the spot (#201). Another socket
    // still in the user's room (a second tab) means they never really left.
    const activeGame = await gameStore.findActiveGameByUser(socket.user.id, {
      status: 'IN_PROGRESS',
    })
    if (!activeGame) return
    const remainingSockets = await io
      .in(`user:${socket.user.id}`)
      .fetchSockets()
    if (remainingSockets.length > 0) return

    const userId = socket.user.id
    clearTimeout(pendingAbandons.get(userId))
    const graceTimer = setTimeout(() => {
      pendingAbandons.delete(userId)
      abandonActiveGame(io, userId).catch((error) =>
        logger.error(`Failed to abandon game for user ${userId}`, error),
      )
    }, config.GAME_RECONNECT_GRACE_MS)
    pendingAbandons.set(userId, graceTimer)
  })

  // Resync (#201): a refreshed or late-mounting page holds a gameId but
  // missed the last broadcast. Replay the match roster and the current state
  // (with the caller's own hand) to this socket only, mirroring the original
  // game_start sequence, and re-join the game's room so future game_over and
  // chat emits reach it.
  socket.on('game:state', async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    const { gameId } = data

    const engine = gameStore.getEngine(gameId)
    if (!engine) return socket.emit('game_error', { message: 'Game not found' })
    if (!engine.getPlayerIds().includes(socket.user.id)) {
      return socket.emit('game_error', { message: 'Not your game' })
    }

    socket.join(`game:${gameId}`)
    const game = await gameStore.getGame(gameId)
    if (game?.players) {
      socket.emit('game_start', { gameId, players: game.players })
    }
    socket.emit('game_state_update', {
      ...engine.getState(),
      myHand: engine.getHand(socket.user.id),
      gameId,
    })
  })

  socket.on('game:play_card', async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    const { gameId, cardIndex, declaredColor } = data

    const engine = gameStore.getEngine(gameId)
    if (!engine) return socket.emit('game_error', { message: 'Game not found' })

    try {
      engine.playCard(socket.user.id, cardIndex, declaredColor)
      broadcastGameState(io, gameId, engine)
      await checkGameEnd(gameId, engine)
      botTurns.scheduleBotTurn({
        io,
        gameId,
        broadcastGameState,
        checkGameEnd,
      })
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
      botTurns.scheduleBotTurn({
        io,
        gameId,
        broadcastGameState,
        checkGameEnd,
      })
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
      botTurns.scheduleBotTurn({
        io,
        gameId,
        broadcastGameState,
        checkGameEnd,
      })
    } catch (err) {
      socket.emit('game_error', { message: err.message })
    }
  })
}

module.exports = registerHandlers
