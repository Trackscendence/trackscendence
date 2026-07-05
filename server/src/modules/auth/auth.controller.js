const authService = require('#modules/auth/auth.service')

const register = async (req, res) => {
  const user = await authService.register(req.body)

  res.status(201).json({ user })
}

const login = async (req, res) => {
  const result = await authService.login(req.body)

  res.json(result)
}

const completeTwoFactorLogin = async (req, res) => {
  const result = await authService.completeTwoFactorLogin(req.body)

  res.json(result)
}

const startFortyTwoLogin = (req, res) => {
  res.redirect(authService.getFortyTwoAuthorizeUrl())
}

const completeFortyTwoLogin = async (req, res) => {
  const result = await authService.loginWithFortyTwo(req.body)

  res.json(result)
}

const me = (req, res) => {
  res.json({ user: req.user })
}

const logout = (req, res) => {
  res.status(204).send()
}

const changePassword = async (req, res) => {
  const result = await authService.changePassword(req.user, req.body)

  res.json(result)
}

const requestPasswordReset = async (req, res) => {
  const result = await authService.requestPasswordReset(req.body)

  res.json(result)
}

const resetPassword = async (req, res) => {
  const result = await authService.resetPassword(req.body)

  res.json(result)
}

const setupTwoFactor = async (req, res) => {
  const result = await authService.setupTwoFactor(req.user)

  res.json(result)
}

const confirmTwoFactorSetup = async (req, res) => {
  const result = await authService.confirmTwoFactorSetup(req.user, req.body)

  res.json(result)
}

const disableTwoFactor = async (req, res) => {
  const result = await authService.disableTwoFactor(req.user)

  res.json(result)
}

const regenerateTwoFactor = async (req, res) => {
  const result = await authService.regenerateTwoFactor(req.user)

  res.json(result)
}

module.exports = {
  completeFortyTwoLogin,
  completeTwoFactorLogin,
  confirmTwoFactorSetup,
  register,
  startFortyTwoLogin,
  disableTwoFactor,
  login,
  me,
  logout,
  changePassword,
  requestPasswordReset,
  regenerateTwoFactor,
  resetPassword,
  setupTwoFactor,
}
