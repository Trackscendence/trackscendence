const gameRepository = require('#modules/game/game.repository')

const LEADERBOARD_LIMIT = 10

const toLeaderboardEntry = (entry, index) => ({
  rank: index + 1,
  userId: entry.userId,
  username: entry.username,
  displayName: entry.displayName,
  totalWins: Number(entry.totalWins || 0),
  totalScore: Number(entry.totalScore || 0),
})

const getLeaderboard = async () => {
  const leaderboard = await gameRepository.getLeaderboard(LEADERBOARD_LIMIT)

  return {
    leaderboard: leaderboard.map(toLeaderboardEntry),
  }
}

module.exports = {
  getLeaderboard,
}
