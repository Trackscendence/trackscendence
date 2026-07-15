// The socket.io event names exchanged with the server. One source of truth so a
// rename is a single edit and every emit and listener is discoverable. Never
// inline these strings elsewhere; import from here. Values are the wire format
// and must match the server's handlers exactly.
export const SOCKET_EVENTS = {
  // Connection lifecycle (socket.io built-ins)
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Lobby (the join/leave queue is dormant but wired; do not delete)
  LOBBY_UPDATE: 'lobby_update',
  JOIN_LOBBY: 'join_lobby',
  LEAVE_LOBBY: 'leave_lobby',

  // Rooms
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_LIST: 'room:list',
  ROOM_SEAT: 'room:seat',
  ROOM_END: 'room:end',
  ROOM_FILL_BOTS: 'room:fill_bots',
  ROOM_ERROR: 'room_error',
  ROOM_CLOSED: 'room:closed',
  ROOMS_WATCH: 'rooms:watch',
  ROOMS_UNWATCH: 'rooms:unwatch',
  ROOMS_UPDATE: 'rooms_update',

  // Game lifecycle and moves
  GAME_START: 'game_start',
  GAME_STATE_UPDATE: 'game_state_update',
  GAME_STATE_REQUEST: 'game:state',
  GAME_OVER: 'game_over',
  GAME_PAUSED: 'game_paused',
  GAME_RESUMED: 'game_resumed',
  GAME_ERROR: 'game_error',
  GAME_LEAVE: 'game:leave',
  GAME_PLAY_CARD: 'game:play_card',
  GAME_DRAW_CARD: 'game:draw_card',
  GAME_PASS_TURN: 'game:pass_turn',
  GAME_CALL_UNO: 'game:call_uno',
  GAME_CATCH_UNO: 'game:catch_uno',
  UNO_CAUGHT: 'uno_caught',
  ACTIVE_GAME: 'active_game',

  // Chat (CHAT_MESSAGE and CHAT_PRIVATE_MESSAGE flow both directions)
  CHAT_MESSAGE: 'chat:message',
  CHAT_PRIVATE_MESSAGE: 'chat:private_message',
  CHAT_ROOM_JOIN: 'chat:room_join',
  CHAT_ROOMS: 'chat:rooms',
  CHAT_ERROR: 'chat:error',

  // Social notifications
  SOCIAL_NOTIFICATIONS_CHANGED: 'social:notifications_changed',
}

export default SOCKET_EVENTS
