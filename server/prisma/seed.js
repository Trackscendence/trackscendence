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

const emailFor = (user) => user.email || `${user.username}@trackscendence.local`

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

  return { primary: primary.username, friends: friends.length }
}

main()
  .then((summary) => {
    console.log(
      `Seed complete: log in as "${summary.primary}" / ${DEV_PASSWORD}. ` +
        `${summary.friends} friends and game history populated.`,
    )
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
