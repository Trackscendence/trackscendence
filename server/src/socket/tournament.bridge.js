/**
 * TournamentBridge - the socket-side half of the tournament flow (#456).
 *
 * The tournament service is deliberately io-free: after every successful
 * state change it emits a domain event (tournament.events.js) and knows
 * nothing about rooms, games, or sockets. This bridge, initialized once with
 * the live Socket.IO server, is the subscriber that turns "these matches are
 * ready" into real games through the existing room flow: it opens a room with
 * both players already seated, starts the game through the same claim path
 * every lobby room uses, and stamps the resulting liveGameId/roomId on the
 * match so the game-end hooks can find their way back. Uninitialized (unit
 * tests exercising the service alone), the service's emissions are no-ops.
 *
 * It is also the live-bracket feed (#457): every domain event is mirrored to
 * the entered players as `tournament:updated` over their `user:${id}` rooms
 * (v1 has no spectator sockets, so per-user delivery needs no page-level room
 * join), and a freshly started match additionally tells its two players where
 * their game is with `tournament:match_ready`.
 */

const logger = require('#utils/logger')
const roomService = require('#modules/room/room.service')
const notificationsService = require('#modules/notifications/notifications.service')
const notificationsSocket = require('#modules/notifications/notifications.socket')
const tournamentRepository = require('#modules/tournament/tournament.repository')
const {
  tournamentEvents,
  TOURNAMENT_EVENTS,
} = require('#modules/tournament/tournament.events')
const { enqueueRoomAction } = require('./room-action-guard')
const {
  abandonActiveGame,
  broadcastRooms,
  createCheckGameEnd,
  startMatchIfRoomFull,
} = require('./socket.handlers')

// Socket event names this bridge emits. The client mirrors them in
// client/src/services/socketEvents.js; keep the wire strings in sync.
const TOURNAMENT_UPDATED_EVENT = 'tournament:updated'
const TOURNAMENT_MATCH_READY_EVENT = 'tournament:match_ready'

let initialized = false

/**
 * Mirrors the fresh bracket to every entered player. A null tournament (sent
 * individually on leave/cancel) tells that client it no longer has an active
 * tournament.
 */
const emitTournamentUpdate = (io, userId, tournament) => {
  io.to(`user:${userId}`).emit(TOURNAMENT_UPDATED_EVENT, { tournament })
}

const broadcastTournamentUpdate = (io, tournament) => {
  tournament.players.forEach((player) => {
    emitTournamentUpdate(io, player.id, tournament)
  })
}

/**
 * Tells the creator, in the bell, that someone entered their tournament. The
 * creator plays in their own bracket, so their own join carries no news and is
 * skipped. Notification failures must not sink the roster broadcast, so they
 * are logged and swallowed.
 */
const notifyCreatorOfJoin = async (tournament, joinedUserId) => {
  if (!joinedUserId || tournament.createdById === joinedUserId) return
  try {
    await notificationsService.createTournamentJoinedNotification({
      actorId: joinedUserId,
      userId: tournament.createdById,
    })
    notificationsSocket.emitSocialNotificationsChanged(tournament.createdById)
  } catch (error) {
    logger.error(`Tournament ${tournament.id} join notification failed`, error)
  }
}

/**
 * Starts one ready match: room, seats, game. Runs inside the tournament's
 * FIFO (see initTournamentBridge), so nothing else creates games for this
 * tournament concurrently.
 */
const startReadyMatch = async (io, tournament, readyMatch, checkGameEnd) => {
  // Re-read the row rather than trusting the event's snapshot: the same match
  // can appear on two consecutive events' ready lists (its game not created
  // yet when the second result was recorded), and this queue is the only game
  // creator, so a fresh read is a reliable "already started?" check.
  const match = await tournamentRepository.findMatchById(readyMatch.id)
  if (!match || match.liveGameId != null || match.winnerId != null) return

  const playerIds = [match.playerAId, match.playerBId]

  // A pairing is a server-side room entry: end whatever stranded game or open
  // seat each player still holds, exactly like the user-facing entry actions
  // do, so the auto-seat below never breaks the one-active-room invariant.
  // Both are no-ops in the common case (their previous match's room closed
  // when its game ended). A player's stranded game is never this tournament's
  // (single elimination pairs only players with no match in flight), so this
  // cannot recurse into the queue that is running it.
  for (const userId of playerIds) {
    await abandonActiveGame(io, userId)
    await roomService.leaveOpenRoom(userId)
  }

  const room = await roomService.createRoomForMatch({
    name: `${tournament.name} — R${match.round} M${match.slot + 1}`,
    playerIds,
  })

  let liveMatch = null
  try {
    liveMatch = await startMatchIfRoomFull(io, room, { checkGameEnd })
  } finally {
    // A failed start leaves a room that will never fill; close it so it does
    // not linger in the lobby. startMatchIfRoomFull released its claim, so
    // the room is back to OPEN and closable. Never mask the start error with
    // a close error.
    if (!liveMatch) {
      await roomService
        .closeOpenRoomById(room.id)
        .catch((error) =>
          logger.error(
            `Failed to close room ${room.id} after a lost start`,
            error,
          ),
        )
    }
  }
  if (!liveMatch) return

  // Tie the runtime game and the room to the match, so the game-end hooks can
  // route the winner back into the bracket. Compare-and-set guarded; a lost
  // claim is unreachable while this queue is the only creator, so it is only
  // logged.
  const claimed = await tournamentRepository.claimMatchForGame(match.id, {
    liveGameId: liveMatch.gameId,
    roomId: room.id,
  })
  if (!claimed) {
    logger.error(
      `Tournament match ${match.id} was already claimed; ` +
        `game ${liveMatch.gameId} is not linked to the bracket`,
    )
    return
  }

  // Deep link (#457): tell both players where their bracket game lives, so a
  // client anywhere in the app can route straight to it (the same pattern as
  // the reconnect-time active_game event).
  playerIds.forEach((userId) => {
    io.to(`user:${userId}`).emit(TOURNAMENT_MATCH_READY_EVENT, {
      tournamentId: tournament.id,
      matchId: match.id,
      gameId: liveMatch.gameId,
      roomId: room.id,
    })
  })
}

/**
 * Wires the bridge to the domain events. Call once, with the live io, where
 * the socket server is created.
 */
const initTournamentBridge = (io) => {
  if (initialized) return
  initialized = true

  const checkGameEnd = createCheckGameEnd(io)

  // All bridge work for one tournament runs through one FIFO, so a burst of
  // results cannot interleave one match's room creation with the next
  // advancement. Different tournaments proceed independently.
  const onBracketAdvance = ({ tournament, readyMatches = [] }) => {
    enqueueRoomAction(`tournament:${tournament.id}`, async () => {
      // The bracket change reaches every player before their next game does,
      // so a client never sees a game_start it cannot place in the bracket.
      broadcastTournamentUpdate(io, tournament)
      for (const readyMatch of readyMatches) {
        try {
          await startReadyMatch(io, tournament, readyMatch, checkGameEnd)
        } catch (error) {
          logger.error(
            `Failed to start tournament match ${readyMatch.id}`,
            error,
          )
        }
      }
      // The new rooms surface as IN_GAME on the lobby grid.
      if (readyMatches.length > 0) await broadcastRooms(io)
    }).catch((error) =>
      logger.error(
        `Tournament ${tournament.id} bracket advancement failed`,
        error,
      ),
    )
  }

  // Sign-up phase changes carry no matches to start, only bracket mirrors.
  // Queued under the same key so an update can never overtake an advancement.
  const onRosterChange = ({ tournament, joinedUserId }) => {
    enqueueRoomAction(`tournament:${tournament.id}`, async () => {
      broadcastTournamentUpdate(io, tournament)
      await notifyCreatorOfJoin(tournament, joinedUserId)
    }).catch((error) =>
      logger.error(
        `Tournament ${tournament.id} update broadcast failed`,
        error,
      ),
    )
  }

  // The leaver's active tournament is gone; everyone else sees the roster
  // shrink. A cancelled tournament stops being anyone's active tournament,
  // mirroring what GET /tournaments/active would now return for them.
  const onPlayerLeft = ({ tournament, leftUserId }) => {
    enqueueRoomAction(`tournament:${tournament.id}`, async () => {
      emitTournamentUpdate(io, leftUserId, null)
      broadcastTournamentUpdate(io, tournament)
    }).catch((error) =>
      logger.error(`Tournament ${tournament.id} leave broadcast failed`, error),
    )
  }

  const onCancelled = ({ tournament }) => {
    enqueueRoomAction(`tournament:${tournament.id}`, async () => {
      tournament.players.forEach((player) => {
        emitTournamentUpdate(io, player.id, null)
      })
    }).catch((error) =>
      logger.error(
        `Tournament ${tournament.id} cancel broadcast failed`,
        error,
      ),
    )
  }

  tournamentEvents.on(TOURNAMENT_EVENTS.STARTED, onBracketAdvance)
  tournamentEvents.on(TOURNAMENT_EVENTS.MATCH_RESULT, onBracketAdvance)
  tournamentEvents.on(TOURNAMENT_EVENTS.PLAYER_JOINED, onRosterChange)
  tournamentEvents.on(TOURNAMENT_EVENTS.PLAYER_LEFT, onPlayerLeft)
  tournamentEvents.on(TOURNAMENT_EVENTS.CANCELLED, onCancelled)
  // COMPLETED needs no extra subscription: the final's MATCH_RESULT already
  // carries the completed bracket (status, winnerId) to every player.
}

module.exports = { initTournamentBridge }
