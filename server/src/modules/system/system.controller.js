const prisma = require('#db/prisma')
const config = require('#utils/config')

const root = (req, res) => {
  const routes = {
    ping: '/api/v1/ping',
    health: '/api/v1/health',
    auth: '/api/v1/auth',
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

const adminAccess = (req, res) => {
  res.json({
    message: 'Admin access granted',
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
    },
    access: {
      scope: 'LIGHTWEIGHT_RBAC',
      capabilities: [
        'view_admin_routes',
        'view_operational_diagnostics',
        'access_future_admin_surfaces',
      ],
    },
  })
}

module.exports = {
  adminAccess,
  root,
  ping,
  health,
}
