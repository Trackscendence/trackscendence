const { Router } = require('express')
const adminController = require('#modules/admin/admin.controller')
const { requireAuth, requireRole } = require('#middleware/auth.middleware')
const { ROLES } = require('#modules/auth/auth.roles')

const router = Router()

router.use(requireAuth, requireRole(ROLES.ADMIN))
router.get('/access', adminController.getAccess)

module.exports = router
