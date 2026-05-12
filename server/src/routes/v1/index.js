const { Router } = require('express')
const auth = require('#modules/auth/auth.routes')
const system = require('#modules/system/system.routes')

const v1Router = Router()

v1Router.use('/', system)
v1Router.use('/auth', auth)

module.exports = v1Router
