// Shapes the tournament store state into render-ready bracket rounds (#444).
// The server has no tournament module yet, so this file is the client-side
// contract the backend epic must serve: a tournament carries name,
// currentRound/totalRounds, playerCount, prizePoints, and rounds of matches
// where each match holds up to two players and an optional winnerId. Missing
// rounds and empty seats become TBD placeholder slots so the bracket always
// draws the full tree. Plain JS with no aliased imports so node --test can
// load it directly.

const ROUND_LABELS_BY_MATCH_COUNT = {
  1: 'Final',
  2: 'Semifinals',
  4: 'Quarterfinals',
}

// The four avatar fills from the bracket design. A player's colour is a
// deterministic hash of their id, so it follows them from round to round and
// is stable across renders and clients. Eliminated players go grey.
export const AVATAR_COLOR_PALETTE = ['#E03325', '#489E52', '#384E88', '#51AFF1']

export const ELIMINATED_AVATAR_COLOR = '#C9B8A8'

const hashPlayerId = (playerId) => {
  const value = String(playerId)
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

const toAvatarColor = (playerId, state) =>
  state === 'eliminated'
    ? ELIMINATED_AVATAR_COLOR
    : AVATAR_COLOR_PALETTE[hashPlayerId(playerId) % AVATAR_COLOR_PALETTE.length]

const matchCountForRound = (playerCount, roundIndex) =>
  Math.max(1, Math.round(playerCount / 2 ** (roundIndex + 1)))

const toInitials = (name = '') => name.trim().slice(0, 2).toUpperCase()

const toSlot = (player, winnerId, matchKey, seatIndex) => {
  if (!player) {
    return { key: `${matchKey}-seat-${seatIndex}`, state: 'tbd' }
  }

  let state = 'pending'
  if (winnerId) {
    state = player.id === winnerId ? 'winner' : 'eliminated'
  }

  return {
    key: `${matchKey}-${player.id}`,
    name: player.name,
    initials: toInitials(player.name),
    avatarUrl: player.avatarUrl || null,
    color: toAvatarColor(player.id, state),
    state,
  }
}

const toMatch = (match, roundIndex, matchIndex) => {
  const key = match?.id
    ? `match-${match.id}`
    : `round-${roundIndex}-match-${matchIndex}`
  const players = match?.players ?? []

  return {
    key,
    slots: [
      toSlot(players[0], match?.winnerId, key, 0),
      toSlot(players[1], match?.winnerId, key, 1),
    ],
  }
}

const toRound = (round, roundIndex, playerCount) => {
  const expectedMatches = matchCountForRound(playerCount, roundIndex)
  const matches = Array.from({ length: expectedMatches }, (unused, index) =>
    toMatch(round?.matches?.[index], roundIndex, index),
  )

  return {
    key: `round-${roundIndex}`,
    label:
      round?.label ||
      ROUND_LABELS_BY_MATCH_COUNT[expectedMatches] ||
      `Round ${roundIndex + 1}`,
    matches,
  }
}

const buildBracketView = (tournament) => {
  if (!tournament) return null

  const playerCount = tournament.playerCount ?? 0
  const totalRounds = tournament.totalRounds ?? tournament.rounds?.length ?? 0

  return {
    name: tournament.name,
    summary: `Round ${tournament.currentRound} of ${totalRounds} · ${playerCount} players`,
    prizePoints: tournament.prizePoints ?? null,
    rounds: Array.from({ length: totalRounds }, (unused, index) =>
      toRound(tournament.rounds?.[index], index, playerCount),
    ),
  }
}

export default buildBracketView
