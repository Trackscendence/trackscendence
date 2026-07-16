// Development seed data.
//
// Populates the database with deterministic users, friendships and game history
// so the app can be developed against REAL API and socket responses instead of
// frontend fakes. Because the data flows through the actual backend, a broken
// endpoint shows up as a broken endpoint — it is not masked by a client-side
// fallback.
//
// Safety: this must NEVER run against production. It is invoked automatically
// from compose.dev.yaml (NODE_ENV=development) and via `npm run prisma:seed`.
// The production Dockerfile never calls it. The guard below is a second line of
// defense in case someone runs it by accident against a prod database.

const bcrypt = require('bcrypt')
const prisma = require('#db/prisma')
const {
  refreshUserRanks,
  updateLifetimeStatsForUsers,
} = require('#modules/game/game.stats')
const { nextSeat } = require('#modules/tournament/tournament.engine')

// The password every seeded account shares. Log in as `dev` with this.
const DEV_PASSWORD = 'DevPass123!'

// The account you log in as during development.
const PRIMARY = {
  email: 'dev@trackscendence.local',
  username: 'dev',
  displayName: 'Dev Player',
  bio: 'Local development account.',
}

// Supporting cast — these become the primary account's friends and leaderboard
// rivals. Names mirror the old frontend mocks so screens look familiar.
const FRIENDS = [
  { username: 'uno', displayName: 'Uno Master' },
  { username: 'skip', displayName: 'Skip Lord' },
  { username: 'cards', displayName: 'Card Shark' },
  { username: 'flip', displayName: 'Flip Queen' },
  { username: 'draw', displayName: 'Draw Four King' },
  { username: 'stack', displayName: 'Stack Champ' },
]

// People who have sent the primary account a friend request but are not friends
// yet. Each becomes a PENDING friendship plus an unread FRIEND_REQUEST
// notification. Requests with an intro message show the preview with inline
// Accept and Reject in the bell; requests without one navigate to the profile,
// where the Accept and Reject controls live (#395). One message is long on
// purpose, so preview truncation stays visible in the dropdown.
const REQUESTERS = [
  {
    username: 'wilds',
    displayName: 'Wild Card',
    requestMessage: 'GG earlier, want to add each other?',
  },
  {
    username: 'reverse',
    displayName: 'Reverse Ray',
    requestMessage: 'Up for a rematch this week?',
  },
  {
    username: 'swap',
    displayName: 'Swap Hands',
    requestMessage:
      'Hey! We were in the same room last night, the one where the deck ran ' +
      'out twice and everyone kept stacking draw cards. That comeback from ' +
      'one card down was the best thing I have seen all week. Add me and we ' +
      'can run it back whenever you are around.',
  },
  {
    username: 'match',
    displayName: 'Match Point',
    requestMessage: 'Saw you on the leaderboard. Fancy a game sometime?',
  },
  {
    username: 'shuffle',
    displayName: 'Shuffle Ace',
    requestMessage: null,
  },
  {
    username: 'zero',
    displayName: 'Zero Hero',
    requestMessage: null,
  },
]

// Direct-message threads between the primary account and existing friends.
// By default the friend's messages stay unread for the primary account, so
// the mail dropdown and its badge render a populated, unread inbox against
// real API responses. Threads marked `primaryHasRead: true` are already read:
// no badge, no notification, and (when the primary sent the last message) the
// "You:" preview path. One thread is a single long message so preview
// truncation stays visible there too.
const CONVERSATIONS = [
  {
    friend: 'uno',
    messages: [
      { from: 'friend', body: 'You around for a game later?' },
      { from: 'primary', body: 'Yeah, give me ten minutes.' },
      { from: 'friend', body: 'Nice, I will set up a room.' },
    ],
  },
  {
    friend: 'skip',
    messages: [
      { from: 'friend', body: 'That last hand was brutal.' },
      { from: 'friend', body: 'Rematch tomorrow?' },
    ],
  },
  {
    friend: 'cards',
    messages: [
      { from: 'friend', body: 'Did you see the new leaderboard?' },
      { from: 'primary', body: 'Not yet, anything change?' },
      { from: 'friend', body: 'skip overtook you this morning.' },
      { from: 'primary', body: 'No way. How many games did that take?' },
      { from: 'friend', body: 'Three in a row, all against uno.' },
      { from: 'friend', body: 'You need two wins to take it back.' },
    ],
  },
  {
    friend: 'flip',
    primaryHasRead: true,
    messages: [
      { from: 'friend', body: 'Thanks for the games yesterday!' },
      { from: 'primary', body: 'Any time, that reverse chain was great.' },
    ],
  },
  {
    friend: 'draw',
    messages: [
      {
        from: 'friend',
        body:
          'So about tonight: winner of the first game picks the rules for ' +
          'the rest, loser has to keep the same avatar for a week, and if ' +
          'anyone forgets to call UNO they buy the snacks next time. Deal?',
      },
    ],
  },
]

// An in-progress tournament, frozen between rounds so the bracket page has a
// real mid-run state to render: all four quarterfinals decided, both
// semifinals seated and waiting, the final still empty. `quarterfinalWinners`
// names the winning side ('A' or 'B') of each round-1 slot; round 1 pairs
// seed order as (1v2), (3v4), (5v6), (7v8) into slots 0-3.
const TOURNAMENT = {
  name: 'Friday Fury Cup',
  size: 8,
  prizePoints: 500,
  totalRounds: 3,
  currentRound: 2,
  quarterfinalWinners: ['A', 'B', 'A', 'B'],
}

const emailFor = (user) => user.email || `${user.username}@trackscendence.local`

const orderedPair = (firstId, secondId) =>
  firstId < secondId
    ? { userOneId: firstId, userTwoId: secondId }
    : { userOneId: secondId, userTwoId: firstId }

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run the development seed with NODE_ENV=production',
    )
  }

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12)

  const upsertUser = (user) =>
    prisma.user.upsert({
      where: { email: emailFor(user) },
      update: { displayName: user.displayName, bio: user.bio ?? null },
      create: {
        email: emailFor(user),
        username: user.username,
        displayName: user.displayName,
        bio: user.bio ?? null,
        passwordHash,
      },
    })

  const primary = await upsertUser(PRIMARY)

  const friends = []
  for (const friend of FRIENDS) {
    friends.push(await upsertUser(friend))
  }

  // Friendships: primary <-> each friend, ACCEPTED.
  for (const friend of friends) {
    await prisma.friendship.upsert({
      where: {
        requesterId_addresseeId: {
          requesterId: primary.id,
          addresseeId: friend.id,
        },
      },
      update: { status: 'ACCEPTED' },
      create: {
        requesterId: primary.id,
        addresseeId: friend.id,
        status: 'ACCEPTED',
      },
    })
  }

  // Game history: reset seeded users' games so re-running stays idempotent,
  // then create a handful of completed games with scores and a winner.
  const seedUserIds = [primary.id, ...friends.map((friend) => friend.id)]
  await prisma.gamePlayer.deleteMany({ where: { userId: { in: seedUserIds } } })
  await prisma.game.deleteMany({ where: { players: { none: {} } } })

  const rivals = friends.slice(0, 3)
  for (let gameIndex = 0; gameIndex < 8; gameIndex += 1) {
    const opponent = rivals[gameIndex % rivals.length]
    const primaryWon = gameIndex % 2 === 0

    await prisma.game.create({
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        players: {
          create: [
            {
              userId: primary.id,
              score: primaryWon ? 100 : 40,
              isWinner: primaryWon,
            },
            {
              userId: opponent.id,
              score: primaryWon ? 35 : 100,
              isWinner: !primaryWon,
            },
          ],
        },
      },
    })
  }

  // Recompute the denormalized stat counters the profile strip and the
  // leaderboard read, through the same queries the production save path uses,
  // so seeded history and seeded stats cannot drift apart (#396).
  await updateLifetimeStatsForUsers(prisma, seedUserIds)
  await refreshUserRanks(prisma)

  const requesters = []
  for (const requester of REQUESTERS) {
    const record = await upsertUser(requester)
    // upsertUser returns the stored user without the request copy, so carry the
    // intro message forward for the friendship and its notification.
    requesters.push({ ...record, requestMessage: requester.requestMessage })
  }

  await seedSocialGraph(primary, friends, requesters)
  await seedTournament(primary, friends, requesters)

  return {
    primary: primary.username,
    friends: friends.length,
    requests: requesters.length,
    conversations: CONVERSATIONS.length,
  }
}

// Seeds the app-wide social surface: pending friend requests, direct-message
// threads, and the notifications that back the lobby bell and mail dropdown.
// Wiped and rebuilt on every run so it stays idempotent.
async function seedSocialGraph(primary, friends, requesters) {
  const friendByUsername = new Map(
    friends.map((friend) => [friend.username, friend]),
  )
  const socialUserIds = [
    primary.id,
    ...friends.map((friend) => friend.id),
    ...requesters.map((requester) => requester.id),
  ]

  // Reset previous social seed data. Deleting conversations cascades to their
  // messages and message-linked notifications; the explicit notification delete
  // clears the friend-request rows that have no conversation.
  await prisma.socialNotification.deleteMany({
    where: { userId: { in: socialUserIds } },
  })
  await prisma.directConversation.deleteMany({
    where: {
      OR: [
        { userOneId: { in: socialUserIds } },
        { userTwoId: { in: socialUserIds } },
      ],
    },
  })

  // Pending friend requests -> unread FRIEND_REQUEST notifications for primary.
  for (const requester of requesters) {
    await prisma.friendship.upsert({
      where: {
        requesterId_addresseeId: {
          requesterId: requester.id,
          addresseeId: primary.id,
        },
      },
      update: {
        status: 'PENDING',
        requestMessage: requester.requestMessage ?? null,
      },
      create: {
        requesterId: requester.id,
        addresseeId: primary.id,
        status: 'PENDING',
        requestMessage: requester.requestMessage ?? null,
      },
    })

    await prisma.socialNotification.create({
      data: {
        userId: primary.id,
        actorId: requester.id,
        type: 'FRIEND_REQUEST',
        message: requester.requestMessage ?? null,
      },
    })
  }

  // Direct-message threads with unread incoming messages for primary.
  for (const spec of CONVERSATIONS) {
    const friend = friendByUsername.get(spec.friend)
    if (!friend) continue

    const conversation = await prisma.directConversation.create({
      data: orderedPair(primary.id, friend.id),
    })

    // Space messages a minute apart so the thread reads in a natural order.
    let stamp = Date.now() - spec.messages.length * 60_000
    let lastIncoming = null
    for (const entry of spec.messages) {
      stamp += 60_000
      const senderId = entry.from === 'primary' ? primary.id : friend.id
      const savedMessage = await prisma.directMessage.create({
        data: {
          conversationId: conversation.id,
          senderId,
          message: entry.body,
          createdAt: new Date(stamp),
        },
      })
      if (entry.from === 'friend') lastIncoming = savedMessage
    }

    // The friend has read the whole thread. The primary account has too when
    // the spec says so; otherwise the friend's messages surface as unread.
    const primaryReadField =
      conversation.userOneId === primary.id
        ? 'userOneLastReadAt'
        : 'userTwoLastReadAt'
    const friendReadField =
      conversation.userOneId === friend.id
        ? 'userOneLastReadAt'
        : 'userTwoLastReadAt'
    await prisma.directConversation.update({
      where: { id: conversation.id },
      data: {
        [friendReadField]: new Date(stamp),
        [primaryReadField]: spec.primaryHasRead ? new Date(stamp) : null,
      },
    })

    if (lastIncoming && !spec.primaryHasRead) {
      await prisma.socialNotification.create({
        data: {
          userId: primary.id,
          actorId: friend.id,
          type: 'DIRECT_MESSAGE',
          message: lastIncoming.message,
          conversationId: conversation.id,
          directMessageId: lastIncoming.id,
        },
      })
    }
  }
}

// Seeds the RUNNING tournament described by TOURNAMENT. Eight seeded users
// fill the bracket: the primary account, its six friends, and the first
// requester. Quarterfinal winners advance into the semifinals through the
// same `nextSeat` rule the live bracket uses, so the seeded state matches
// what playing round 1 for real would have produced. No match carries a
// liveGameId/gameId/roomId — these matches were never played through the
// engine. Deleted (by name + creator, cascading to players and matches) and
// rebuilt on every run so re-seeding never duplicates the tournament.
async function seedTournament(primary, friends, requesters) {
  // Bracket entrants in seed order 1..8.
  const players = [primary, ...friends, requesters[0]]

  await prisma.tournament.deleteMany({
    where: { name: TOURNAMENT.name, createdById: primary.id },
  })

  const tournament = await prisma.tournament.create({
    data: {
      name: TOURNAMENT.name,
      status: 'RUNNING',
      size: TOURNAMENT.size,
      prizePoints: TOURNAMENT.prizePoints,
      currentRound: TOURNAMENT.currentRound,
      totalRounds: TOURNAMENT.totalRounds,
      createdById: primary.id,
    },
  })

  for (const [seedIndex, player] of players.entries()) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: tournament.id,
        userId: player.id,
        seed: seedIndex + 1,
      },
    })
  }

  // Quarterfinals: decided. Losers get eliminatedAt stamps staggered five
  // minutes apart, as if the round played out match by match over an evening.
  const firstEliminationAt = Date.now() - 60 * 60_000
  const semifinalSeats = [{}, {}]
  for (const [slot, winningSide] of TOURNAMENT.quarterfinalWinners.entries()) {
    const playerA = players[slot * 2]
    const playerB = players[slot * 2 + 1]
    const winner = winningSide === 'A' ? playerA : playerB
    const loser = winningSide === 'A' ? playerB : playerA

    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tournament.id,
        round: 1,
        slot,
        playerAId: playerA.id,
        playerBId: playerB.id,
        winnerId: winner.id,
      },
    })
    await prisma.tournamentPlayer.update({
      where: {
        tournamentId_userId: { tournamentId: tournament.id, userId: loser.id },
      },
      data: { eliminatedAt: new Date(firstEliminationAt + slot * 5 * 60_000) },
    })

    const seat = nextSeat(1, slot)
    const seatField = seat.side === 'A' ? 'playerAId' : 'playerBId'
    semifinalSeats[seat.slot][seatField] = winner.id
  }

  // Semifinals: seated from the quarterfinal winners, not yet played.
  for (const [slot, seat] of semifinalSeats.entries()) {
    await prisma.tournamentMatch.create({
      data: { tournamentId: tournament.id, round: 2, slot, ...seat },
    })
  }

  // Final: exists but empty — the semifinals decide who sits in it.
  await prisma.tournamentMatch.create({
    data: { tournamentId: tournament.id, round: 3, slot: 0 },
  })
}

main()
  .then((summary) => {
    console.log(
      `Seed complete: log in as "${summary.primary}" / ${DEV_PASSWORD}. ` +
        `${summary.friends} friends, ${summary.requests} pending requests, ` +
        `${summary.conversations} direct-message threads, game history, ` +
        `and the "${TOURNAMENT.name}" tournament populated.`,
    )
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
