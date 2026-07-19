const express = require('express')
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
const config = require('#utils/config')
const requestLogger = require('#middleware/morgan.middleware')
const { attachRequestId } = require('#middleware/request-id.middleware')
const rateLimiter = require('#middleware/rate-limit.middleware')
const { notFound, errorHandler } = require('#middleware/error.middleware')
const {
  UPLOADS_PUBLIC_PATH_PREFIX,
  UPLOADS_ROOT_DIR,
} = require('#modules/users/users.avatar')
const v1Router = require('#routes/v1')
const systemController = require('#modules/system/system.controller')

const app = express()

// Every deployment path puts exactly one proxy in front of Express (nginx in
// the compose stack, the Vite proxy in dev, Railway's edge on staging), so
// trust that single hop: req.ip becomes the real client address and the rate
// limiter buckets per visitor instead of lumping everyone behind the proxy
// together. Never `true` — that trusts arbitrary client-supplied
// X-Forwarded-For chains and lets callers spoof their way past rate limits.
app.set('trust proxy', 1)

app.use(attachRequestId)
app.use(helmet())
app.use(cors({ origin: config.CORS_ORIGIN }))
app.use(express.json())
app.use(requestLogger)
app.use(
  UPLOADS_PUBLIC_PATH_PREFIX,
  express.static(UPLOADS_ROOT_DIR, {
    fallthrough: false,
    index: false,
  }),
)

app.get('/', systemController.root)

app.use('/api', rateLimiter)
app.use('/api/v1', v1Router)

if (config.NODE_ENV === 'development') {
  const { swaggerUi, swaggerSpec } = require('#docs/swagger')
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

app.use('/api', notFound)

if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

module.exports = app
