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
// notification. The first two carry an intro message (the bell shows the
// preview with inline Accept and Reject); the last two send without one, so
// the plain-request path is testable too: their notification navigates to the
// profile, where the Accept and Reject controls live (#395).
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

// Direct-message threads between the primary account and existing friends. The
// friend's messages stay unread for the primary account, so the mail dropdown
// and its badge render a populated, unread inbox against real API responses.
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
]

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

    // The friend has read the whole thread; the primary account has not, so the
    // friend's messages surface as unread.
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
      data: { [friendReadField]: new Date(stamp), [primaryReadField]: null },
    })

    if (lastIncoming) {
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

main()
  .then((summary) => {
    console.log(
      `Seed complete: log in as "${summary.primary}" / ${DEV_PASSWORD}. ` +
        `${summary.friends} friends, ${summary.requests} pending requests, ` +
        `${summary.conversations} direct-message threads, and game history populated.`,
    )
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
