import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import buildBracketView, {
  AVATAR_COLOR_PALETTE,
  ELIMINATED_AVATAR_COLOR,
} from './buildBracketView.js'

const player = (id, name) => ({ id, name })

const entrant = (id, username, seed, eliminatedAt = null) => ({
  id,
  username,
  seed,
  eliminatedAt,
})

// Mirrors the design mock: eight players, quarterfinals decided, semifinals
// seated but unplayed, final not created yet.
const eightPlayerTournament = () => ({
  id: 't1',
  name: 'Friday Fury Cup',
  currentRound: 2,
  totalRounds: 3,
  playerCount: 8,
  prizePoints: 500,
  players: [
    entrant('u1', 'Jordan', 1),
    entrant('u2', 'Spencer', 8, '2026-07-14T20:00:00Z'),
    entrant('u3', 'Alex', 4),
    entrant('u4', 'Mia', 5, '2026-07-14T20:05:00Z'),
    entrant('u5', 'Parker', 2, '2026-07-14T20:10:00Z'),
    entrant('u6', 'Tyler', 7),
    entrant('u7', 'Chris', 3),
    entrant('u8', 'Dana', 6, '2026-07-14T20:15:00Z'),
  ],
  rounds: [
    {
      label: 'Quarterfinals',
      matches: [
        {
          id: 'q1',
          players: [player('u1', 'Jordan'), player('u2', 'Spencer')],
          winnerId: 'u1',
        },
        {
          id: 'q2',
          players: [player('u3', 'Alex'), player('u4', 'Mia')],
          winnerId: 'u3',
        },
        {
          id: 'q3',
          players: [player('u5', 'Parker'), player('u6', 'Tyler')],
          winnerId: 'u6',
        },
        {
          id: 'q4',
          players: [player('u7', 'Chris'), player('u8', 'Dana')],
          winnerId: 'u7',
        },
      ],
    },
    {
      label: 'Semifinals',
      matches: [
        { id: 's1', players: [player('u1', 'Jordan'), player('u3', 'Alex')] },
        { id: 's2', players: [player('u6', 'Tyler'), player('u7', 'Chris')] },
      ],
    },
  ],
})

describe('buildBracketView', () => {
  it('returns null while no tournament is active', () => {
    assert.equal(buildBracketView(null), null)
  })

  it('summarizes the round progress and player count', () => {
    const view = buildBracketView(eightPlayerTournament())

    assert.equal(view.name, 'Friday Fury Cup')
    assert.equal(view.summary, 'Round 2 of 3 · 8 players')
    assert.equal(view.prizePoints, 500)
  })

  it('flags winners and eliminated players in decided matches', () => {
    const view = buildBracketView(eightPlayerTournament())
    const [jordan, spencer] = view.rounds[0].matches[0].slots

    assert.equal(jordan.state, 'winner')
    assert.equal(jordan.initials, 'JO')
    assert.equal(spencer.state, 'eliminated')
  })

  it('keeps undecided seats pending', () => {
    const view = buildBracketView(eightPlayerTournament())

    for (const slot of view.rounds[1].matches.flatMap((match) => match.slots)) {
      assert.equal(slot.state, 'pending')
    }
  })

  it('pads missing rounds and seats with TBD placeholders', () => {
    const view = buildBracketView(eightPlayerTournament())
    const finalRound = view.rounds[2]

    assert.equal(view.rounds.length, 3)
    assert.equal(finalRound.label, 'Final')
    assert.equal(finalRound.matches.length, 1)
    for (const slot of finalRound.matches[0].slots) {
      assert.equal(slot.state, 'tbd')
    }
  })

  it('gives every surviving player a deterministic palette colour', () => {
    const allSlots = (view) =>
      view.rounds.flatMap((round) =>
        round.matches.flatMap((match) => match.slots),
      )
    const firstView = buildBracketView(eightPlayerTournament())
    const secondView = buildBracketView(eightPlayerTournament())

    // Same input, same colours — the hash has no randomness in it.
    assert.deepEqual(
      allSlots(firstView).map((slot) => slot.color),
      allSlots(secondView).map((slot) => slot.color),
    )

    // The colour follows the player between rounds: Jordan wins the
    // quarterfinal and reappears in the semifinal with the same colour.
    const jordanQuarterfinal = firstView.rounds[0].matches[0].slots[0]
    const jordanSemifinal = firstView.rounds[1].matches[0].slots[0]
    assert.equal(jordanQuarterfinal.name, 'Jordan')
    assert.equal(jordanSemifinal.name, 'Jordan')
    assert.equal(jordanQuarterfinal.color, jordanSemifinal.color)
    assert.ok(AVATAR_COLOR_PALETTE.includes(jordanQuarterfinal.color))

    for (const slot of allSlots(firstView)) {
      if (slot.state === 'pending' || slot.state === 'winner') {
        assert.ok(AVATAR_COLOR_PALETTE.includes(slot.color))
      }
    }
  })

  it('renders eliminated players grey', () => {
    const view = buildBracketView(eightPlayerTournament())
    const [, spencer] = view.rounds[0].matches[0].slots

    assert.equal(spencer.state, 'eliminated')
    assert.equal(spencer.color, ELIMINATED_AVATAR_COLOR)
  })

  it('leaves TBD placeholder slots without a colour', () => {
    const view = buildBracketView(eightPlayerTournament())

    for (const slot of view.rounds[2].matches[0].slots) {
      assert.equal(slot.state, 'tbd')
      assert.equal(slot.color, undefined)
    }
  })

  it('threads seed and tournament status onto every filled slot', () => {
    const view = buildBracketView(eightPlayerTournament())
    const [jordan, spencer] = view.rounds[0].matches[0].slots

    assert.equal(jordan.seed, 1)
    assert.equal(jordan.tournamentStatus, 'active')
    assert.equal(jordan.description, 'Seed 1 · Still in')

    assert.equal(spencer.seed, 8)
    assert.equal(spencer.tournamentStatus, 'eliminated')
    assert.equal(spencer.description, 'Seed 8 · Eliminated')
  })

  it('marks the winner as champion once winnerId is set', () => {
    const view = buildBracketView({
      ...eightPlayerTournament(),
      status: 'COMPLETED',
      winnerId: 'u1',
    })
    const [jordan] = view.rounds[0].matches[0].slots

    assert.equal(jordan.tournamentStatus, 'champion')
    assert.equal(jordan.description, 'Seed 1 · Champion')
  })

  it('copes with a player missing from the roster', () => {
    const tournament = eightPlayerTournament()
    tournament.players = tournament.players.filter(
      (rosterEntry) => rosterEntry.id !== 'u1',
    )
    const view = buildBracketView(tournament)
    const [jordan] = view.rounds[0].matches[0].slots

    assert.equal(jordan.seed, null)
    assert.equal(jordan.description, 'Still in')
  })

  it('leaves TBD placeholder slots without seed or description', () => {
    const view = buildBracketView(eightPlayerTournament())

    for (const slot of view.rounds[2].matches[0].slots) {
      assert.equal(slot.seed, undefined)
      assert.equal(slot.description, undefined)
    }
  })

  it('resolves the champion from winnerId against the roster', () => {
    const tournament = {
      ...eightPlayerTournament(),
      status: 'COMPLETED',
      winnerId: 'u1',
      players: [
        { id: 'u1', username: 'Jordan', seed: 1, eliminatedAt: null },
        { id: 'u2', username: 'Spencer', seed: 2, eliminatedAt: '2026-07-15' },
      ],
    }

    assert.deepEqual(buildBracketView(tournament).champion, {
      name: 'Jordan',
    })
  })

  it('has no champion while the tournament is undecided', () => {
    assert.equal(buildBracketView(eightPlayerTournament()).champion, null)
  })

  it('labels generated rounds by bracket size', () => {
    const view = buildBracketView({
      name: 'Fresh Cup',
      currentRound: 1,
      totalRounds: 3,
      playerCount: 8,
      prizePoints: 100,
      rounds: [],
    })

    assert.deepEqual(
      view.rounds.map((round) => round.label),
      ['Quarterfinals', 'Semifinals', 'Final'],
    )
  })
})
