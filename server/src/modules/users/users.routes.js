const { Router } = require('express')
const { requireAuth } = require('#middleware/auth.middleware')
const usersController = require('#modules/users/users.controller')

const router = Router()

router.use(requireAuth)

router.get('/me', usersController.getCurrentProfile)
router.patch('/me', usersController.updateCurrentUserProfile)

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users by username or display name
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         description: Case-insensitive substring match on username or display name
 *         schema:
 *           type: string
 *           maxLength: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Matching users with pagination metadata
 *         content:
 *           application/json:
 *             example:
 *               users:
 *                 - id: 7
 *                   username: srodrigo
 *                   displayName: Sergio
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 totalCount: 1
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Missing or invalid token
 */
// Must be registered before /:username so "search" is not read as a username.
router.get('/search', usersController.searchUsers)
router.get('/:username', usersController.getProfile)

module.exports = router
