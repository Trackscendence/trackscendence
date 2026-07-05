const { uploadCurrentUserAvatarFile } = require('#modules/users/users.avatar')
const usersService = require('#modules/users/users.service')

const getCurrentProfile = async (req, res) => {
  const result = await usersService.getCurrentProfile(req.user)

  res.json(result)
}

const searchUsers = async (req, res) => {
  const result = await usersService.searchUsers(req.query)

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

const uploadCurrentUserAvatar = async (req, res) => {
  const result = await usersService.uploadCurrentUserAvatar(req.user, req.file)

  res.json(result)
}

const deleteCurrentUserAvatar = async (req, res) => {
  const result = await usersService.deleteCurrentUserAvatar(req.user)

  res.json(result)
}

module.exports = {
  deleteCurrentUserAvatar,
  getCurrentProfile,
  getProfile,
  searchUsers,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  uploadCurrentUserAvatarFile,
}
