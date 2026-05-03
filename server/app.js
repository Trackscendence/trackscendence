const express = require('express')
const path = require('path')
const middleware = require('./utils/middleware')
const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()

app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/ping', (req, res) => {
	res.json({ message: 'pong', time: new Date().toISOString() })
})

app.get('/api/health', async (req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`
		res.json({ status: 'ok', database: 'connected' })
	} catch (error) {
		res.status(503).json({ status: 'error', database: 'disconnected' })
	}
})

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '../client/dist')))
	app.get('/*splat', (req, res) => {
		res.sendFile(path.join(__dirname, '../client/dist/index.html'))
	})
}

module.exports = app
