const { Router } = require('express')
const controller = require('#modules/system/system.controller')

const router = Router()

/**
 * @openapi
 * /ping:
 *   get:
 *     summary: Check whether the API process is responding
 *     description: Lightweight endpoint used for uptime checks and verifying that the API process is running.
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: pong
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
 *     summary: Check API and database health
 *     description:  Performs a health check against the API and its dependencies, including database connectivitiy. Useful for monitoring systems, load balancers, and deployment health checks.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API and database are healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 database:
 *                   type: string
 *                   example: connected
 *               example:
 *                 status: healthy
 *                 database: connected
 *       503:
 *         description: One or more dependencies are unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: REQUEST_ERROR
 *                     message:
 *                       type: string
 *                       example: Database connection failed
 *               example:
 *                 error:
 *                   code: REQUEST_ERROR
 *                   message: Database connection failed
 */
router.get('/health', controller.health)

module.exports = router
