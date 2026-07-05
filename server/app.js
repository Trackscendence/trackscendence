const express = require('express')
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
const config = require('#utils/config')
const requestLogger = require('#middleware/morgan.middleware')
const rateLimiter = require('#middleware/rate-limit.middleware')
const { notFound, errorHandler } = require('#middleware/error.middleware')
const {
  UPLOADS_PUBLIC_PATH_PREFIX,
  UPLOADS_ROOT_DIR,
} = require('#modules/users/users.avatar')
const v1Router = require('#routes/v1')
const systemController = require('#modules/system/system.controller')

const app = express()

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
