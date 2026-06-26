const authService = require('#modules/auth/auth.service')
const logger = require('#utils/logger')

const authenticate = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization
    if (!token) {
      return next(new Error('Authentication error'))
    }
    const extractedToken =
      typeof token === 'string' ? token.replace(/^Bearer\s+/i, '').trim() : ''
    if (!extractedToken) {
      return next(new Error('Authentication error'))
    }
    const user = await authService.getUserFromToken(extractedToken)
    socket.user = { id: user.id, username: user.username }
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
}

module.exports = {
  authenticate,
}
