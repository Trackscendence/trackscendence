const { Router } = require('express')
const authController = require('#modules/auth/auth.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               username:
 *                 type: string
 *                 example: smoore
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: ThisIsMyRealPasswordPsych123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: REQUEST_ERROR
 *                 message: Invalid request data
 *                 payload:
 *                   details:
 *                     - Email must be valid
 *                     - Password must be at least 8 characters
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: REQUEST_ERROR
 *                 message: Email is already registered
 */
router.post('/register', authController.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authentication for a user logging in
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email address
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: thisIsSuchARealPassword1!
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: REQUEST_ERROR
 *                 message: Invalid request data
 *                 payload:
 *                   details:
 *                     - Identifier is required
 *       401:
 *         description: Invalid email/username or password
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: REQUEST_ERROR
 *                 message: Invalid email/username or password
 */
router.post('/login', authController.login)

router.post('/forgot-password', authController.requestPasswordReset)
router.post('/reset-password', authController.resetPassword)
router.post('/change-password', requireAuth, authController.changePassword)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current  authenticated user returned successfully
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: REQUEST_ERROR
 *                 message: Invalid or expired token
 */
router.get('/me', requireAuth, authController.me)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags:
 *       - Authentication
 *     responses:
 *       204:
 *         description: Logout successful
 */
router.post('/logout', authController.logout)

module.exports = router
