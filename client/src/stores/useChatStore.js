import { create } from 'zustand'

export const GENERAL_CHAT_ROOM_ID = 'channel:#general'
export const PRIVATE_ROOM_PREFIX = 'user:'

const MAX_MESSAGES_PER_ROOM = 100

const getDefaultRooms = () => ({
  [GENERAL_CHAT_ROOM_ID]: {
    id: GENERAL_CHAT_ROOM_ID,
    name: '# General',
    type: 'channel',
  },
})

const getDefaultMessages = () => ({
  [GENERAL_CHAT_ROOM_ID]: [],
})

const getDefaultState = () => ({
  rooms: getDefaultRooms(),
  messages: getDefaultMessages(),
  activeRoom: GENERAL_CHAT_ROOM_ID,
  nextMessageId: 1,
})

export const getPrivateRoomId = (userId) => `${PRIVATE_ROOM_PREFIX}${userId}`

export const isPrivateRoomId = (roomId) => {
  return typeof roomId === 'string' && roomId.startsWith(PRIVATE_ROOM_PREFIX)
}

const getFriendRoomName = (friend) => {
  return friend.user.displayName || friend.user.username
}

const getRoomsFromFriends = (friends) => {
  return friends.reduce((rooms, friend) => {
    const roomId = getPrivateRoomId(friend.user.id)
    rooms[roomId] = {
      id: roomId,
      name: getFriendRoomName(friend),
      type: 'private',
      userId: friend.user.id,
    }
    return rooms
  }, {})
}

const appendMessageToRoom = (state, roomId, message) => {
  const nextMessage = {
    ...message,
    id: state.nextMessageId,
  }
  const currentMessages = state.messages[roomId] || []
  const roomMessages = [...currentMessages, nextMessage].slice(
    -MAX_MESSAGES_PER_ROOM,
  )

  return {
    nextMessageId: state.nextMessageId + 1,
    messages: {
      ...state.messages,
      [roomId]: roomMessages,
    },
  }
}

const useChatStore = create((set) => ({
  ...getDefaultState(),

  syncFriendRooms: (friends = []) =>
    set((state) => {
      const rooms = {
        ...getDefaultRooms(),
        ...getRoomsFromFriends(friends),
      }
      const messages = Object.keys(rooms).reduce((nextMessages, roomId) => {
        nextMessages[roomId] = state.messages[roomId] || []
        return nextMessages
      }, {})

      return {
        rooms,
        messages,
        activeRoom: rooms[state.activeRoom]
          ? state.activeRoom
          : GENERAL_CHAT_ROOM_ID,
      }
    }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  addMessage: (roomId, message) =>
    set((state) => appendMessageToRoom(state, roomId, message)),
  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: messages.slice(-MAX_MESSAGES_PER_ROOM),
      },
    })),
  receiveRoomMessage: (data) => {
    if (!data || typeof data.message !== 'string' || !data.user) return

    const roomId =
      typeof data.recipient === 'string' ? data.recipient : GENERAL_CHAT_ROOM_ID

    set((state) => appendMessageToRoom(state, roomId, data))
  },
  receivePrivateMessage: (data, ownUserId) => {
    if (!data?.user || typeof data.recipient !== 'string') return
    if (typeof data.message !== 'string') return

    const isOwnMessage = String(data.user.id) === String(ownUserId)
    const roomId = isOwnMessage
      ? data.recipient
      : getPrivateRoomId(data.user.id)
    const roomName = data.user.displayName || data.user.username

    set((state) => {
      const type = isPrivateRoomId(roomId) ? 'private' : 'channel'
      return {
        rooms: {
          ...state.rooms,
          [roomId]: state.rooms[roomId] || {
            id: roomId,
            name: roomName,
            type,
          },
        },
        ...appendMessageToRoom(state, roomId, data),
      }
    })
  },
  reset: () => set(getDefaultState()),
}))

export default useChatStore
