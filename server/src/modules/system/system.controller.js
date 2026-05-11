const prisma = require('#db/prisma')
const config = require('#utils/config')

const root = (req, res) => {
	const routes = {
		ping: '/api/v1/ping',
		health: '/api/v1/health',
	}

	if (config.NODE_ENV === 'development') {
		routes.docs = '/api/docs/'
	}

	res.json({
		name: 'Trackscendence Backend API',
		status: 'ok',
		version: 'v1',
		routes,
	})
}

const ping = (req, res) => {
	res.json({ message: 'pong', time: new Date().toISOString() })
}

const health = async (req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`
		res.json({ status: 'ok', database: 'connected' })
	} catch (error) {
		res.status(503).json({ status: 'error', database: 'disconnected' })
	}
}

module.exports = {
	root,
	ping,
	health,
}
