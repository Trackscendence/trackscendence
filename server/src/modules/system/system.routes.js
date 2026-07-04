const { Router } = require('express')
const controller = require('#modules/system/system.controller')
const { requireAuth, requireRole } = require('#middleware/auth.middleware')
const { ROLES } = require('#modules/auth/auth.roles')

const router = Router()

/**
 * @openapi
 * /ping:
 *   get:
 *     summary: Check whether the API process is responding.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API process is responding.
 */
router.get('/ping', controller.ping)

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API and database health.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API and database are healthy.
 *       503:
 *         description: Database connection failed.
 */
router.get('/health', controller.health)

/**
 * @openapi
 * /admin/access:
 *   get:
 *     summary: Verify admin-only backend access
 *     tags:
 *       - System
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted.
 *       401:
 *         description: Missing, invalid, or expired token.
 *       403:
 *         description: Authenticated user lacks admin privileges.
 */
router.get(
  '/admin/access',
  requireAuth,
  requireRole(ROLES.ADMIN),
  controller.adminAccess,
)

module.exports = router
