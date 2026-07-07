const { PrismaClient } = require('@prisma/client')
const config = require('#utils/config')

// Tune the connection pool explicitly (audit B4). Prisma reads connection_limit
// and pool_timeout from the datasource URL's query string; a bare
// `new PrismaClient()` leaves them at Prisma's implicit defaults, which under a
// socket-connect burst can exhaust the pool and queue on pool_timeout. Any param
// an operator already set in DATABASE_URL wins over these defaults.
const buildDatabaseUrl = () => {
  const url = new URL(config.DATABASE_URL)
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', String(config.DB_CONNECTION_LIMIT))
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', String(config.DB_POOL_TIMEOUT))
  }
  return url.toString()
}

const prisma = new PrismaClient({ datasourceUrl: buildDatabaseUrl() })

module.exports = prisma
