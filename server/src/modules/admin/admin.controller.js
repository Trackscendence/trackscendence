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

module.exports = {
  getAccess,
  getStats,
  listUsers,
}
