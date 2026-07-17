const adminService = require('#modules/admin/admin.service')

const getAccess = (req, res) => {
  res.json(adminService.getAccess(req.user))
}

const getStats = async (req, res, next) => {
  try {
    res.json(await adminService.getStats())
  } catch (error) {
    next(error)
  }
}

const listUsers = async (req, res, next) => {
  try {
    res.json(await adminService.listUsers(req.query))
  } catch (error) {
    next(error)
  }
}

const getUser = async (req, res, next) => {
  try {
    res.json(await adminService.getUser(req.params.id))
  } catch (error) {
    next(error)
  }
}

const changeUserRole = async (req, res, next) => {
  try {
    res.json(
      await adminService.changeUserRole(req.user.id, req.params.id, req.body),
    )
  } catch (error) {
    next(error)
  }
}

const suspendUser = async (req, res, next) => {
  try {
    res.json(
      await adminService.suspendUser(req.user.id, req.params.id, req.body),
    )
  } catch (error) {
    next(error)
  }
}

const banUser = async (req, res, next) => {
  try {
    res.json(await adminService.banUser(req.user.id, req.params.id, req.body))
  } catch (error) {
    next(error)
  }
}

const reinstateUser = async (req, res, next) => {
  try {
    res.json(await adminService.reinstateUser(req.user.id, req.params.id))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  banUser,
  changeUserRole,
  getAccess,
  getStats,
  getUser,
  listUsers,
  reinstateUser,
  suspendUser,
}
