const publicService = require('#modules/public/public.service')

const getLeaderboard = async (req, res) => {
  const result = await publicService.getLeaderboard(req.query)

  res.json(result)
}

const getUserProfile = async (req, res) => {
  const result = await publicService.getUserProfile(req.params.username)

  res.json(result)
}

const getUserMatches = async (req, res) => {
  const result = await publicService.getUserMatches(
    req.params.username,
    req.query,
  )

  res.json(result)
}

const updateOwnProfile = async (req, res) => {
  const result = await publicService.updateOwnProfile(req.user, req.body)

  res.json(result)
}

module.exports = {
  getLeaderboard,
  getUserMatches,
  getUserProfile,
  updateOwnProfile,
}
