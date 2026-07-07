const prisma = require('#db/prisma')

const botUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

const upsertBotPlayer = (player) => {
  return prisma.user.upsert({
    where: { email: player.email },
    update: {
      username: player.username,
      displayName: player.displayName,
      isBot: true,
      isGuest: false,
      deletedAt: null,
    },
    create: {
      email: player.email,
      username: player.username,
      displayName: player.displayName,
      isBot: true,
    },
    select: botUserSelect,
  })
}

module.exports = {
  upsertBotPlayer,
}
