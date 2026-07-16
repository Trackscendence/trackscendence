const tournamentService = require('#modules/tournament/tournament.service')

const listTournaments = async (req, res, next) => {
  try {
    res.json(
      await tournamentService.listTournaments({ status: req.query.status }),
    )
  } catch (error) {
    next(error)
  }
}

const getActiveTournament = async (req, res, next) => {
  try {
    res.json(await tournamentService.getActiveTournament(req.user))
  } catch (error) {
    next(error)
  }
}

const getTournament = async (req, res, next) => {
  try {
    res.json(await tournamentService.getTournament(req.params.id))
  } catch (error) {
    next(error)
  }
}

const createTournament = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await tournamentService.createTournament(req.user, req.body))
  } catch (error) {
    next(error)
  }
}

const joinTournament = async (req, res, next) => {
  try {
    res.json(await tournamentService.joinTournament(req.user, req.params.id))
  } catch (error) {
    next(error)
  }
}

const leaveTournament = async (req, res, next) => {
  try {
    res.json(await tournamentService.leaveTournament(req.user, req.params.id))
  } catch (error) {
    next(error)
  }
}

const startTournament = async (req, res, next) => {
  try {
    res.json(await tournamentService.startTournament(req.user, req.params.id))
  } catch (error) {
    next(error)
  }
}

const cancelTournament = async (req, res, next) => {
  try {
    res.json(await tournamentService.cancelTournament(req.user, req.params.id))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listTournaments,
  getActiveTournament,
  getTournament,
  createTournament,
  joinTournament,
  leaveTournament,
  startTournament,
  cancelTournament,
}
