const chatRoomService = require('#modules/chat/chat-room.service')

const listRooms = async (req, res, next) => {
  try {
    res.json(await chatRoomService.listRooms(req.user))
  } catch (error) {
    next(error)
  }
}

const createRoom = async (req, res, next) => {
  try {
    res.status(201).json(await chatRoomService.createRoom(req.user, req.body))
  } catch (error) {
    next(error)
  }
}

const joinRoom = async (req, res, next) => {
  try {
    res.json(await chatRoomService.joinRoom(req.user, req.params))
  } catch (error) {
    next(error)
  }
}

const inviteUser = async (req, res, next) => {
  try {
    res.json(await chatRoomService.inviteUser(req.user, req.params, req.body))
  } catch (error) {
    next(error)
  }
}

const setMemberMuted = async (req, res, next) => {
  try {
    res.json(
      await chatRoomService.setMemberMuted(req.user, req.params, req.body),
    )
  } catch (error) {
    next(error)
  }
}

const removeMember = async (req, res, next) => {
  try {
    res.json(await chatRoomService.removeMember(req.user, req.params))
  } catch (error) {
    next(error)
  }
}

const listMessages = async (req, res, next) => {
  try {
    res.json(await chatRoomService.listMessages(req.user, req.params))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createRoom,
  inviteUser,
  joinRoom,
  listMessages,
  listRooms,
  removeMember,
  setMemberMuted,
}
