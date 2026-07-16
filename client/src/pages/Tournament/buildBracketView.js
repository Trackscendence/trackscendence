// Shapes the tournament detail payload into render-ready bracket rounds
// (#444/#458). The input is the server's tournament detail shape: name,
// currentRound/totalRounds, playerCount, prizePoints, winnerId, a players
// roster, and rounds of matches where each match holds up to two players and
// an optional winnerId. Missing rounds and empty seats become TBD placeholder
// slots so the bracket always draws the full tree. Plain JS with no aliased
// imports so node --test can load it directly.

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

// Human wording for the tournament-level status, used verbatim by the hover
// card and as the profile link's screen-reader description.
const STATUS_LABELS = {
  champion: 'Champion',
  eliminated: 'Eliminated',
  active: 'Still in',
}

// Tournament-level status, as opposed to slot.state which is per match: a
// quarterfinal winner is 'winner' in that match yet still 'active' overall.
// Losing any match means elimination in a single-elimination bracket, so a
// lost slot reads 'eliminated' even if the roster has not caught up yet.
const toTournamentStatus = (player, state, roster) => {
  if (state === 'eliminated') return 'eliminated'
  if (roster.winnerId && player.id === roster.winnerId) return 'champion'
  if (roster.byId.get(player.id)?.eliminatedAt) return 'eliminated'
  return 'active'
}

const toSlot = (player, winnerId, matchKey, seatIndex, roster) => {
  if (!player) {
    return { key: `${matchKey}-seat-${seatIndex}`, state: 'tbd' }
  }

  let state = 'pending'
  if (winnerId) {
    state = player.id === winnerId ? 'winner' : 'eliminated'
  }

  const seed = roster.byId.get(player.id)?.seed ?? null
  const tournamentStatus = toTournamentStatus(player, state, roster)

  return {
    key: `${matchKey}-${player.id}`,
    name: player.name,
    initials: toInitials(player.name),
    avatarUrl: player.avatarUrl || null,
    color: toAvatarColor(player.id, state),
    state,
    seed,
    tournamentStatus,
    description:
      seed != null
        ? `Seed ${seed} · ${STATUS_LABELS[tournamentStatus]}`
        : STATUS_LABELS[tournamentStatus],
  }
}

const toMatch = (match, roundIndex, matchIndex, roster) => {
  const key = match?.id
    ? `match-${match.id}`
    : `round-${roundIndex}-match-${matchIndex}`
  const players = match?.players ?? []

  return {
    key,
    slots: [
      toSlot(players[0], match?.winnerId, key, 0, roster),
      toSlot(players[1], match?.winnerId, key, 1, roster),
    ],
  }
}

const toRound = (round, roundIndex, playerCount, roster) => {
  const expectedMatches = matchCountForRound(playerCount, roundIndex)
  const matches = Array.from({ length: expectedMatches }, (unused, index) =>
    toMatch(round?.matches?.[index], roundIndex, index, roster),
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

// A completed tournament names its champion via winnerId; resolve it against
// the roster so the view can show the winner without re-deriving it.
const toChampion = (tournament) => {
  if (!tournament.winnerId) return null

  const winner = tournament.players?.find(
    (candidate) => candidate.id === tournament.winnerId,
  )

  return winner ? { name: winner.username } : null
}

const buildBracketView = (tournament) => {
  if (!tournament) return null

  const playerCount = tournament.playerCount ?? 0
  const totalRounds = tournament.totalRounds ?? tournament.rounds?.length ?? 0

  // Index the roster once so every slot can look up its seed and
  // eliminated-or-not without scanning the players array again.
  const roster = {
    byId: new Map(
      (tournament.players ?? []).map((entrant) => [entrant.id, entrant]),
    ),
    winnerId: tournament.winnerId ?? null,
  }

  return {
    name: tournament.name,
    summary: `Round ${tournament.currentRound} of ${totalRounds} · ${playerCount} players`,
    prizePoints: tournament.prizePoints ?? null,
    champion: toChampion(tournament),
    rounds: Array.from({ length: totalRounds }, (unused, index) =>
      toRound(tournament.rounds?.[index], index, playerCount, roster),
    ),
  }
}

export default buildBracketView
