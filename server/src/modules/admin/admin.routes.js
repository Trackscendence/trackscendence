const { Router } = require('express')
const adminController = require('#modules/admin/admin.controller')
const { requireAuth, requireRole } = require('#middleware/auth.middleware')
const { ROLES } = require('#modules/auth/auth.roles')

const router = Router()

router.use(requireAuth, requireRole(ROLES.ADMIN))
router.get('/access', adminController.getAccess)
router.get('/stats', adminController.getStats)
router.get('/users', adminController.listUsers)
router.get('/users/:id', adminController.getUser)
router.patch('/users/:id/role', adminController.changeUserRole)
router.post('/users/:id/suspend', adminController.suspendUser)
router.post('/users/:id/ban', adminController.banUser)
router.post('/users/:id/reinstate', adminController.reinstateUser)
router.delete('/users/:id', adminController.deleteUser)

module.exports = router
