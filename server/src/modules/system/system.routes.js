const { Router } = require('express')
const controller = require('./system.controller')

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

module.exports = router
