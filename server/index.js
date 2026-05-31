const app = require('#app')
const { createServer } = require('node:http')
const config = require('#utils/config')
const logger = require('#utils/logger')

const server = createServer(app)

const { Server } = require('socket.io')

const io = new Server(server, {
  path: '/websocket/'
})

io.on('connection', (socket) => {
	console.log('user connected:', socket.id)
		
	socket.on('disconnect', () => {
			console.log('user disconnected:', socket.id)
	})

})	

server.listen(config.PORT, () => {
	logger.info(`Server running on port ${config.PORT}`)
})
