const { Router } = require('express')
const authController = require('#modules/auth/auth.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()
/**
* @swagger
*
* /auth/register:
*   post:
*     summary: Register a new user
*       tags: [Auth]
*       requestBody:
*         required: true
*         content:
*           application/json:
*             schema:
*               type: object
*               required:
*                 - email
*                 - username
*                 - password
*               properties:
*                 email:
*                   type: string
*                   example: test@example.com
*                 username:
*                   type: string
*                   example: smoore
*                 password:
*                   type: string
*                   example: ThisIsMyRealPasswordPsych123!
*		responses:
*		  201:
*           description: User registered successfully
*/
router.post('/register', authController.register)

/**
* @swagger
*
* /auth/login:
*   post:
*     summary: Login a user
*     tags: [Auth]
*     responses:
*       200:
*         description: Login successful
*/
router.post('/login', authController.login)

/**
* @swagger
*
* /auth/me:
*   get:
*     summary: Get current authenticated user
*     tags: [Auth]
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Current user profile
*       401:
*         description: Unauthorized
*/
router.get('/me', requireAuth, authController.me)

/**
* @swagger
*
* /auth/logout:
*   post:
*     summary: Logout a user
*     tags: [Auth]
*     responses:
*       200:
*         description: Logout successful
*/
router.post('/logout', authController.logout)

module.exports = router
