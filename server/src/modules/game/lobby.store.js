const lobbyQueue = new Set()

const addPlayer = (socket) => {
  lobbyQueue.add(socket)
}

const addPlayersToFront = (sockets) => {
  const current = Array.from(lobbyQueue)
  lobbyQueue.clear()
  sockets.forEach((s) => lobbyQueue.add(s))
  current.forEach((s) => lobbyQueue.add(s))
}

const removePlayer = (socket) => {
  lobbyQueue.delete(socket)
}

const getLobbyCount = () => {
  return lobbyQueue.size
}

const extractMatchPlayers = (count) => {
  const players = Array.from(lobbyQueue).slice(0, count)
  players.forEach((p) => lobbyQueue.delete(p))
  return players
}

module.exports = {
  addPlayer,
  addPlayersToFront,
  removePlayer,
  getLobbyCount,
  extractMatchPlayers,
}
