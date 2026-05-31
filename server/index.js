const app = require('#app')
const { createServer } = require('node:http')
const authService = require('#modules/auth/auth.service')
const config = require('#utils/config')
const logger = require('#utils/logger')

const server = createServer(app)

const { Server } = require('socket.io')

const io = new Server(server, {
  path: '/websocket/'
})

io.on('connection', (socket) => {
	socket.timeout(5000).emit('token', async (err,response) => {
		if (err) {
			socket.disconnect()
		} else {
			try {
				const user = await authService.getUserFromToken(response)
				socket.user = { id: user.id, username: user.username }
				socket.join('channel:#general')
				logger.info('user connected:', socket.user )
			} catch (error) {
				console.log(error)
			}
		}
	})

	socket.on('disconnect', () => {
			logger.info('user disconnected', socket.user)
		})
	
	socket.on('message', (data) => {
		logger.info(data)
		data.user = socket.user
		io.to(data.room).emit('message', data)
	})
})	

server.listen(config.PORT, () => {
	logger.info(`Server running on port ${config.PORT}`)
})
