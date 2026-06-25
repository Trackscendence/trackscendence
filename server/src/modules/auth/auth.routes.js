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
 *                 code: BAD_REQUEST
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
 *                 code: CONFLICT
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
 *                 code: BAD_REQUEST
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
 *                 code: UNAUTHORIZED
 *                 message: Invalid email/username or password
 */
router.post('/login', authController.login)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *           example:
 *             email: test@example.com
 *     responses:
 *       200:
 *         description: Password reset request processed
 *         content:
 *           application/json:
 *             example:
 *               message: If email is registered, password reset instructions have been sent
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: BAD_REQUEST
 *                 message: Invalid request data
 *                 payload:
 *                   details:
 *                     - Email must be valid
 */
router.post('/forgot-password', authController.requestPasswordReset)

router.post('/login/2fa', authController.completeTwoFactorLogin)
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset a password using a reset token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received via email
 *                 example: 123e4567-e89b-12d3-a456-426614174000.abcd1234ffff5678
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: TheNewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             example:
 *               message: Password reset successful
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: BAD_REQUEST
 *                 message: Invalid request data
 *                 payload:
 *                   details:
 *                     - Password must be at least 8 characters
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: UNAUTHORIZED
 *                 message: Invalid or expired token
 */
router.post('/reset-password', authController.resetPassword)

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the current user's password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: TheCurrentPassword123!
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: TheNewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Password updated successfully
 *       400:
 *         description: Validation failed, incorrect current password, or password reused attempt
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: BAD_REQUEST
 *                 message: Current password is incorrect
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: UNAUTHORIZED
 *                 message: Invalid or expired token
 */
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
 *         description: Current authenticated user returned successfully
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             example:
 *               error:
 *                 code: UNAUTHORIZED
 *                 message: Invalid or expired token
 */
router.get('/me', requireAuth, authController.me)

router.post('/two-factor/setup', requireAuth, authController.setupTwoFactor)
router.post(
  '/two-factor/confirm',
  requireAuth,
  authController.confirmTwoFactorSetup,
)
router.post('/two-factor/disable', requireAuth, authController.disableTwoFactor)
router.post(
  '/two-factor/regenerate',
  requireAuth,
  authController.regenerateTwoFactor,
)

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
