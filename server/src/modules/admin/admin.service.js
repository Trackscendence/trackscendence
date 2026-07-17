const getAccess = (user) => ({
  message: 'Admin access granted',
  user: {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  },
})

const getStats = async ({
  repository = adminRepository,
  store = gameStore,
} = {}) => {
  const [databaseStats, games] = await Promise.all([
    repository.getStats(),
    store.getAllGames(),
  ])

  return {
    stats: {
      ...databaseStats,
      activeGames: games.filter((game) => game.status === 'IN_PROGRESS').length,
      openReports: 0,
    },
  }
}

module.exports = {
  getAccess,
  getStats,
}
const adminRepository = require('#modules/admin/admin.repository')
const gameStore = require('#modules/game/game.store')
