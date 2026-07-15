import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import buildBracketView from './buildBracketView.js'

const player = (id, name) => ({ id, name })

// Mirrors the design mock: eight players, quarterfinals decided, semifinals
// seated but unplayed, final not created yet.
const eightPlayerTournament = () => ({
  id: 't1',
  name: 'Friday Fury Cup',
  currentRound: 2,
  totalRounds: 3,
  playerCount: 8,
  prizePoints: 500,
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
