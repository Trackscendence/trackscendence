const { Router } = require('express')
const auth = require('#modules/auth/auth.routes')
const friends = require('#modules/friends/friends.routes')
const system = require('#modules/system/system.routes')
const users = require('#modules/users/users.routes')

const v1Router = Router()

v1Router.use('/', system)
v1Router.use('/auth', auth)
v1Router.use('/users', users)
v1Router.use('/friends', friends)

module.exports = v1Router
