const { Router } = require('express')
const system = require('#modules/system/system.routes')

const v1Router = Router()

v1Router.use('/', system)

module.exports = v1Router
