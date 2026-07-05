const { Router } = require('express')
const { requireApiKey } = require('#middleware/api-key.middleware')
const publicRateLimiter = require('#middleware/public-rate-limit.middleware')
const publicController = require('#modules/public/public.controller')

const router = Router()

// Every public endpoint is rate limited per API key and requires a valid,
// non-revoked key in the X-API-Key header.
router.use(publicRateLimiter)
router.use(requireApiKey)

/**
 * @swagger
 * /public/leaderboard:
 *   get:
 *     summary: Paginated leaderboard
 *     tags:
 *       - Public API
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
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
 *         description: Leaderboard entries with pagination metadata
 *         content:
 *           application/json:
 *             example:
 *               leaderboard:
 *                 - rank: 1
 *                   userId: 7
 *                   username: srodrigo
 *                   displayName: Sergio
 *                   totalWins: 12
 *                   totalScore: 940
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 totalCount: 42
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Missing, invalid, or revoked API key
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/leaderboard', publicController.getLeaderboard)

/**
 * @swagger
 * /public/users/{username}:
 *   get:
 *     summary: Public profile and game stats for a user
 *     tags:
 *       - Public API
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public profile with aggregated stats
 *         content:
 *           application/json:
 *             example:
 *               user:
 *                 id: 7
 *                 username: srodrigo
 *                 displayName: Sergio
 *                 bio: UNO enjoyer
 *                 createdAt: '2026-05-12T09:30:00.000Z'
 *                 stats:
 *                   gamesPlayed: 20
 *                   wins: 12
 *                   losses: 8
 *                   rank: 1
 *       401:
 *         description: Missing, invalid, or revoked API key
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/users/:username', publicController.getUserProfile)

/**
 * @swagger
 * /public/users/{username}/matches:
 *   get:
 *     summary: Recent completed matches for a user
 *     tags:
 *       - Public API
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Most recent matches, newest first
 *       401:
 *         description: Missing, invalid, or revoked API key
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/users/:username/matches', publicController.getUserMatches)

/**
 * @swagger
 * /public/me:
 *   put:
 *     summary: Update the profile of the API key owner
 *     description: Updates displayName and/or bio for the user the API key belongs to.
 *     tags:
 *       - Public API
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 maxLength: 40
 *                 nullable: true
 *               bio:
 *                 type: string
 *                 maxLength: 280
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Updated public profile of the key owner
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Missing, invalid, or revoked API key
 *       429:
 *         description: Rate limit exceeded
 */
router.put('/me', publicController.updateOwnProfile)

module.exports = router
