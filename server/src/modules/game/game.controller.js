const gameService = require('#modules/game/game.service')

const getLeaderboard = async (req, res) => {
  const result = await gameService.getLeaderboard(req.query)

  res.json(result)
}

module.exports = {
  getLeaderboard,
}
