const { Router } = require('express')
const { requireAuth } = require('#middleware/auth.middleware')
const tournamentController = require('#modules/tournament/tournament.controller')

const router = Router()

router.use(requireAuth)

/**
 * @swagger
 * /tournaments:
 *   get:
 *     summary: List tournaments
 *     description: Newest first, optionally filtered by status.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [OPEN, RUNNING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of tournaments
 *         content:
 *           application/json:
 *             example:
 *               tournaments:
 *                 - id: 1
 *                   name: Friday Cup
 *                   status: OPEN
 *                   size: 4
 *                   prizePoints: 100
 *                   playerCount: 2
 *                   createdById: 7
 *                   createdAt: '2026-07-16T12:00:00.000Z'
 *       400:
 *         description: Unknown status filter
 *       401:
 *         description: Missing or invalid bearer token
 */
router.get('/', tournamentController.listTournaments)

/**
 * @swagger
 * /tournaments/active:
 *   get:
 *     summary: The caller's active tournament
 *     description: >
 *       The OPEN or RUNNING tournament the caller is entered in, or null when
 *       they are not in one.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The caller's active tournament, or null
 *         content:
 *           application/json:
 *             example:
 *               tournament: null
 *       401:
 *         description: Missing or invalid bearer token
 */
router.get('/active', tournamentController.getActiveTournament)

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     summary: One tournament with players and bracket
 *     description: >
 *       While the tournament is OPEN, rounds is empty; once RUNNING, each
 *       round carries its matches with a player reference or null per seat.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tournament detail
 *         content:
 *           application/json:
 *             example:
 *               tournament:
 *                 id: 1
 *                 name: Friday Cup
 *                 status: RUNNING
 *                 size: 4
 *                 prizePoints: 100
 *                 currentRound: 1
 *                 totalRounds: 2
 *                 playerCount: 4
 *                 createdById: 7
 *                 winnerId: null
 *                 players:
 *                   - id: 7
 *                     username: alice
 *                     seed: 0
 *                     eliminatedAt: null
 *                 rounds:
 *                   - label: Semifinals
 *                     matches:
 *                       - id: 11
 *                         players:
 *                           - { id: 7, name: alice, avatarUrl: null }
 *                           - { id: 8, name: bob, avatarUrl: null }
 *                         winnerId: null
 *                   - label: Final
 *                     matches:
 *                       - id: 13
 *                         players: [null, null]
 *                         winnerId: null
 *       400:
 *         description: Invalid tournament id
 *       401:
 *         description: Missing or invalid bearer token
 *       404:
 *         description: Tournament not found
 */
router.get('/:id', tournamentController.getTournament)

/**
 * @swagger
 * /tournaments:
 *   post:
 *     summary: Create a tournament
 *     description: >
 *       Opens a tournament for sign-ups. Creating does not enter the creator;
 *       they join through the join endpoint like everyone else.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - size
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 60
 *                 example: Friday Cup
 *               size:
 *                 type: integer
 *                 enum: [4, 8]
 *               prizePoints:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *     responses:
 *       201:
 *         description: Tournament created
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Missing or invalid bearer token
 */
router.post('/', tournamentController.createTournament)

/**
 * @swagger
 * /tournaments/{id}/join:
 *   post:
 *     summary: Join a tournament
 *     description: >
 *       Enters the caller. Players commit to one active tournament at a time.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joined; the updated tournament detail
 *       400:
 *         description: Invalid tournament id
 *       401:
 *         description: Missing or invalid bearer token
 *       404:
 *         description: Tournament not found
 *       409:
 *         description: >
 *           Not open, full, already entered, or the caller is already in
 *           another active tournament
 */
router.post('/:id/join', tournamentController.joinTournament)

/**
 * @swagger
 * /tournaments/{id}/leave:
 *   post:
 *     summary: Leave a tournament
 *     description: Withdraws the caller. Only possible while the tournament is OPEN.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Left the tournament
 *         content:
 *           application/json:
 *             example:
 *               tournament: null
 *       400:
 *         description: Invalid tournament id
 *       401:
 *         description: Missing or invalid bearer token
 *       404:
 *         description: Tournament not found
 *       409:
 *         description: The tournament has started, or the caller is not in it
 */
router.post('/:id/leave', tournamentController.leaveTournament)

/**
 * @swagger
 * /tournaments/{id}/start:
 *   post:
 *     summary: Start a tournament
 *     description: >
 *       Locks the bracket: seeds every player, lays out every round's matches,
 *       and flips the tournament to RUNNING at round 1. Creator only; every
 *       seat must be taken.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Started; the tournament detail with the round-1 bracket
 *       400:
 *         description: Invalid tournament id
 *       401:
 *         description: Missing or invalid bearer token
 *       403:
 *         description: Only the creator can start the tournament
 *       404:
 *         description: Tournament not found
 *       409:
 *         description: The tournament is not open or not full
 */
router.post('/:id/start', tournamentController.startTournament)

/**
 * @swagger
 * /tournaments/{id}:
 *   delete:
 *     summary: Cancel a tournament
 *     description: Creator only; only an OPEN tournament can be cancelled.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cancelled; the tournament detail with status CANCELLED
 *       400:
 *         description: Invalid tournament id
 *       401:
 *         description: Missing or invalid bearer token
 *       403:
 *         description: Only the creator can cancel the tournament
 *       404:
 *         description: Tournament not found
 *       409:
 *         description: The tournament is not open
 */
router.delete('/:id', tournamentController.cancelTournament)

module.exports = router
