const usersService = require('#modules/users/users.service')

const getProfile = async (req, res) => {
  const result = await usersService.getProfileByUsername(req.params.username)

  res.json(result)
}

const updateCurrentUserProfile = async (req, res) => {
  const result = await usersService.updateCurrentUserProfile(req.user, req.body)

  res.json(result)
}

module.exports = {
  getProfile,
  updateCurrentUserProfile,
}
