const adminService = require('#modules/admin/admin.service')

const getAccess = (req, res) => {
  res.json(adminService.getAccess(req.user))
}

module.exports = {
  getAccess,
}
