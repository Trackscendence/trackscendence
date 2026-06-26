const logger = require('#utils/logger')
const lobbyStore = require('#modules/game/lobby.store')
const gameStore = require('#modules/game/game.store')
const crypto = require('node:crypto')

const REQUIRED_PLAYERS = 2

const registerHandlers = (io, socket) => {
  socket.join('channel:#general')

  logger.info('user connected:', socket.user)

  socket.on('join_lobby', async () => {
    logger.info(`User ${socket.user.username} joined the lobby`)
    socket.join('lobby')
    lobbyStore.addPlayer(socket)

    // Broadcast the new lobby count
    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })

    if (lobbyStore.getLobbyCount() >= REQUIRED_PLAYERS) {
      const matchPlayers = lobbyStore.extractMatchPlayers(REQUIRED_PLAYERS)
      const gameId = crypto.randomUUID()

      const gameState = {
        id: gameId,
        status: 'IN_PROGRESS',
        players: matchPlayers.map((p) => ({
          userId: p.user.id,
          username: p.user.username,
        })),
        startedAt: new Date(),
      }

      await gameStore.saveGame(gameId, gameState)

      matchPlayers.forEach((p) => {
        p.leave('lobby')
        p.join(`game:${gameId}`)
        p.emit('game_start', { gameId, players: gameState.players })
      })

      // Update remaining lobby players
      io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })
    }
  })

  socket.on('disconnect', () => {
    logger.info('user disconnected', socket.user)
    lobbyStore.removePlayer(socket)
    io.to('lobby').emit('lobby_update', { count: lobbyStore.getLobbyCount() })
  })

  socket.on('message', (data) => {
    logger.info(data)
    data.user = socket.user
    io.to(data.room).emit('message', data)
  })
}

module.exports = registerHandlers
