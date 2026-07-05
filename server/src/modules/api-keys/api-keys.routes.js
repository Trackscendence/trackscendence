const { Router } = require('express')
const { requireAuth } = require('#middleware/auth.middleware')
const apiKeysController = require('#modules/api-keys/api-keys.controller')

const router = Router()

router.use(requireAuth)

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Create an API key for the public API
 *     description: >
 *       Issues a new API key tied to the authenticated user. The plaintext key
 *       is returned once and never stored; only its hash is kept.
 *     tags:
 *       - API keys
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 40
 *                 example: leaderboard-widget
 *     responses:
 *       201:
 *         description: API key created; the key field is only shown once
 *         content:
 *           application/json:
 *             example:
 *               message: 'API key created. Store it now: it is only shown once.'
 *               apiKey:
 *                 id: 1
 *                 name: leaderboard-widget
 *                 keyPrefix: tsc_0a1b2c3d
 *                 key: tsc_0a1b2c3d4e5f...
 *                 lastUsedAt: null
 *                 revokedAt: null
 *                 createdAt: '2026-07-05T12:00:00.000Z'
 *       400:
 *         description: Validation failed or active key limit reached
 *       401:
 *         description: Missing or invalid bearer token
 */
router.post('/', apiKeysController.createApiKey)

/**
 * @swagger
 * /api-keys:
 *   get:
 *     summary: List your API keys
 *     description: Returns key metadata only; plaintext keys are never returned.
 *     tags:
 *       - API keys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the caller's API keys, newest first
 *       401:
 *         description: Missing or invalid bearer token
 */
router.get('/', apiKeysController.listApiKeys)

/**
 * @swagger
 * /api-keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     description: Revoked keys stop working immediately but remain listed for audit.
 *     tags:
 *       - API keys
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
 *         description: API key revoked
 *       400:
 *         description: Invalid API key id
 *       404:
 *         description: No active API key with this id belongs to the caller
 */
router.delete('/:id', apiKeysController.revokeApiKey)

module.exports = router
