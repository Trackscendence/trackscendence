const usersService = require('#modules/users/users.service')

const getCurrentProfile = async (req, res) => {
  const result = await usersService.getCurrentProfile(req.user)

  res.json(result)
}

const getProfile = async (req, res) => {
  const result = await usersService.getProfileByUsername(
    req.user,
    req.params.username,
  )

  res.json(result)
}

const updateCurrentUserProfile = async (req, res) => {
  const result = await usersService.updateCurrentUserProfile(req.user, req.body)

  res.json(result)
}

module.exports = {
  getCurrentProfile,
  getProfile,
  updateCurrentUserProfile,
}
