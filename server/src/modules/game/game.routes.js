const { Router } = require('express')
const gameController = require('#modules/game/game.controller')
const { requireAuth } = require('#middleware/auth.middleware')

const router = Router()

router.use(requireAuth)

router.get('/leaderboard', gameController.getLeaderboard)

module.exports = router
