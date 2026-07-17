const { uploadCurrentUserAvatarFile } = require('#modules/users/users.avatar')
const dataRightsService = require('#modules/users/users.data-rights.service')
const usersService = require('#modules/users/users.service')

const getRequestCorrelationId = (req) => req.get('x-request-id')

const getCurrentProfile = async (req, res) => {
  const result = await usersService.getCurrentProfile(req.user, {
    correlationId: getRequestCorrelationId(req),
  })

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
    {
      correlationId: getRequestCorrelationId(req),
    },
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

const exportCurrentUserData = async (req, res) => {
  const result = await dataRightsService.exportCurrentUserData(req.user)
  const username = req.user.username.replace(/[^a-z0-9-]/gi, '-')

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="trackscendence-data-${username}.json"`,
  )
  res.json(result)
}

const deleteCurrentUserAccount = async (req, res) => {
  const result = await dataRightsService.deleteCurrentUserAccount(
    req.user,
    req.body,
  )

  res.json(result)
}

module.exports = {
  deleteCurrentUserAccount,
  deleteCurrentUserAvatar,
  exportCurrentUserData,
  getCurrentProfile,
  getProfile,
  searchUsers,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  uploadCurrentUserAvatarFile,
}
