const lobbyQueue = new Set()

const addPlayer = (socket) => {
  lobbyQueue.add(socket)
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
  removePlayer,
  getLobbyCount,
  extractMatchPlayers,
}
