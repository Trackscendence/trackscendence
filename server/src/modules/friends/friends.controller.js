const friendsService = require('#modules/friends/friends.service')

const listFriends = async (req, res) => {
  const result = await friendsService.listFriends(req.user)

  res.json(result)
}

const listFriendRequests = async (req, res) => {
  const result = await friendsService.listFriendRequests(req.user)

  res.json(result)
}

const sendFriendRequest = async (req, res) => {
  const result = await friendsService.sendFriendRequest(req.user, req.body)

  res.status(201).json(result)
}

const respondToFriendRequest = async (req, res) => {
  const result = await friendsService.respondToFriendRequest(req.user, req.body)

  res.json(result)
}

const deleteRelationship = async (req, res) => {
  const result = await friendsService.deleteRelationship(req.user, req.params)

  res.json(result)
}

module.exports = {
  deleteRelationship,
  listFriendRequests,
  listFriends,
  respondToFriendRequest,
  sendFriendRequest,
}
