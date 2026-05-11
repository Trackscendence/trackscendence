const express = require('express')
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
const config = require('./utils/config')
const requestLogger = require('./src/middleware/morgan.middleware')
const rateLimiter = require('./src/middleware/rate-limit.middleware')
const { notFound, errorHandler } = require('./src/middleware/error.middleware')
const apiRouter = require('./src/routes')
const systemController = require('./src/modules/system/system.controller')

const app = express()

app.use(helmet())
app.use(cors({ origin: config.CORS_ORIGIN }))
app.use(express.json())
app.use(requestLogger)
app.use(rateLimiter)

app.get('/', systemController.root)

app.use('/api', apiRouter)

if (config.NODE_ENV === 'development') {
  const { swaggerUi, swaggerSpec } = require('./src/docs/swagger')
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

app.use('/api', notFound)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

module.exports = app
