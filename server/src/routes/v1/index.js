const { Router } = require('express')
const apiKeys = require('#modules/api-keys/api-keys.routes')
const auth = require('#modules/auth/auth.routes')
const friends = require('#modules/friends/friends.routes')
const game = require('#modules/game/game.routes')
const publicApi = require('#modules/public/public.routes')
const system = require('#modules/system/system.routes')
const users = require('#modules/users/users.routes')

const v1Router = Router()

v1Router.use('/', system)
v1Router.use('/api-keys', apiKeys)
v1Router.use('/auth', auth)
v1Router.use('/users', users)
v1Router.use('/friends', friends)
v1Router.use('/game', game)
v1Router.use('/public', publicApi)

module.exports = v1Router
