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
 */

const logger = require('#utils/logger')
const roomService = require('#modules/room/room.service')
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

let initialized = false

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
  }
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

  tournamentEvents.on(TOURNAMENT_EVENTS.STARTED, onBracketAdvance)
  tournamentEvents.on(TOURNAMENT_EVENTS.MATCH_RESULT, onBracketAdvance)
}

module.exports = { initTournamentBridge }
