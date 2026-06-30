const lobbyQueue = new Set()

const addPlayer = (socket) => {
  const isAlreadyInLobby = Array.from(lobbyQueue).some(
    (s) => s.user.id === socket.user.id,
  )
  if (!isAlreadyInLobby) {
    lobbyQueue.add(socket)
  }
}

const addPlayersToFront = (sockets) => {
  const current = Array.from(lobbyQueue).filter((s) => s.connected)
  lobbyQueue.clear()
  sockets.filter((s) => s.connected).forEach((s) => lobbyQueue.add(s))
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
