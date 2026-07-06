const { Router } = require('express')
const gameController = require('#modules/game/game.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.use(requireAuth)

/**
 * @swagger
 * /game/leaderboard:
 *   get:
 *     summary: Leaderboard with filtering, sorting, and pagination
 *     tags:
 *       - Game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         description: Case-insensitive substring match on username or display name
 *         schema:
 *           type: string
 *           maxLength: 50
 *       - in: query
 *         name: minGames
 *         description: Only include players with at least this many recorded games
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [wins, totalScore, gamesPlayed, winRate]
 *           default: wins
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *                   gamesPlayed: 20
 *                   winRate: 0.6
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 totalCount: 42
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Missing or invalid token
 */
router.get('/leaderboard', gameController.getLeaderboard)

module.exports = router
