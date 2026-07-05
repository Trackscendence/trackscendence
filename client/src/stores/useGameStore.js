import { create } from 'zustand'
import { socket } from '@/services/socket'

const useGameStore = create((set) => ({
  matchHistory: [],
  leaderboard: [],
  currentMatch: null,

  // Pre-game waiting room state, driven by the #88 socket contract:
  // `lobby_update` -> lobbyCount, `game_start` -> match. The match (gameId plus
  // players with usernames) is kept separate from `gameState` on purpose: the
  // in-game `game_state_update` payload carries only the engine's public state
  // (hand sizes, current player) and would otherwise clobber the player names
  // the waiting room needs to show the opponent.
  lobbyCount: 0,
  match: null,
  gameState: null,
  gameError: null,

  // Persistent rooms (#185): `rooms_update` -> rooms. The waiting room derives
  // "my room" (and the opponent's name) from this list; the lobby page renders
  // it as room cards.
  rooms: [],
  roomError: null,

  setMatchHistory: (matchHistory) => set({ matchHistory }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  setLobbyCount: (lobbyCount) => set({ lobbyCount }),
  setMatch: (match) => set({ match }),
  setGameState: (gameState) => set({ gameState }),
  setGameError: (gameError) => set({ gameError }),
  setRooms: (rooms) => set({ rooms }),
  setRoomError: (roomError) => set({ roomError }),

  joinLobby: () => socket.emit('join_lobby'),
  // No server `leave_lobby` event exists yet; the server drops a player from
  // the queue when their socket disconnects, so leaving is handled at the
  // socket layer. This just resets the local waiting-room state.
  leaveLobby: () => set({ lobbyCount: 0, match: null }),
  clearGame: () => set({ match: null, gameState: null, gameError: null }),

  // Auto-seat: the server puts the player in the open room, creating one if
  // none exists (first in owns it), and starts the game once the room fills.
  seatRoom: () => socket.emit('room:seat'),
  leaveRoom: () => socket.emit('room:leave'),
  listRooms: () => socket.emit('room:list'),

  playCard: (gameId, cardIndex, declaredColor) =>
    socket.emit('game:play_card', { gameId, cardIndex, declaredColor }),
  drawCard: (gameId) => socket.emit('game:draw_card', { gameId }),
  passTurn: (gameId) => socket.emit('game:pass_turn', { gameId }),
}))

export default useGameStore
