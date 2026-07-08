import { create } from 'zustand'
// Relative import (not the @/ alias) so this store stays loadable under the node
// test runner; socketEvents is a dependency-free constants file.
import { SOCKET_EVENTS } from '../services/socketEvents.js'
import useNotificationStore from './useNotificationStore.js'

export const GENERAL_CHAT_ROOM_ID = 'channel:#general'
export const PRIVATE_ROOM_PREFIX = 'user:'
export const GAME_ROOM_PREFIX = 'game:'
export const CHAT_ROOM_PREFIX = 'chat:'

const MAX_MESSAGES_PER_ROOM = 100
const AUTH_TOKEN_KEY = 'trackscendence.auth.token'

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
  chatRooms: [],
  isLoadingRooms: false,
  isSubmittingRoom: false,
  error: '',
  nextMessageId: 1,
})

export const getPrivateRoomId = (userId) => `${PRIVATE_ROOM_PREFIX}${userId}`

export const getGameRoomId = (gameId) => `${GAME_ROOM_PREFIX}${gameId}`

export const getChatRoomId = (roomId) => `${CHAT_ROOM_PREFIX}${roomId}`

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

const getRoomsFromChatRooms = (chatRooms) => {
  return chatRooms.reduce((rooms, room) => {
    const roomId = room.socketRoom || getChatRoomId(room.id)
    rooms[roomId] = {
      ...room,
      id: roomId,
      chatRoomId: room.id,
      name: room.name,
      type: 'chat',
    }
    return rooms
  }, {})
}

const buildRooms = ({ chatRooms, friends }) => ({
  ...getDefaultRooms(),
  ...getRoomsFromChatRooms(chatRooms),
  ...getRoomsFromFriends(friends),
})

const buildMessages = (state, rooms) => {
  return Object.keys(rooms).reduce((nextMessages, roomId) => {
    nextMessages[roomId] = state.messages[roomId] || []
    return nextMessages
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

const getActiveToken = () => {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

const requireToken = () => {
  const token = getActiveToken()
  if (!token) {
    throw new Error('Authentication required')
  }
  return token
}

const getRoomApiId = (room) => room?.chatRoomId || room?.id

const getChatService = () => import('@/services/chat')

const joinSocketChatRoom = async (roomId) => {
  const { socket } = await import('@/services/socket')
  if (socket.connected && roomId) {
    socket.emit(SOCKET_EVENTS.CHAT_ROOM_JOIN, { roomId })
  }
}

const useChatStore = create((set) => ({
  ...getDefaultState(),

  syncFriendRooms: (friends = []) =>
    set((state) => {
      const rooms = buildRooms({ chatRooms: state.chatRooms, friends })

      return {
        rooms,
        messages: buildMessages(state, rooms),
        activeRoom: rooms[state.activeRoom]
          ? state.activeRoom
          : GENERAL_CHAT_ROOM_ID,
      }
    }),
  syncChatRooms: (chatRooms = []) =>
    set((state) => {
      const friendRooms = Object.values(state.rooms)
        .filter((room) => room.type === 'private')
        .map((room) => ({
          user: {
            id: room.userId,
            username: room.name,
            displayName: room.name,
          },
        }))
      const rooms = buildRooms({ chatRooms, friends: friendRooms })

      return {
        chatRooms,
        rooms,
        messages: buildMessages(state, rooms),
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
  clearRoomMessages: (roomId) =>
    set((state) => {
      if (roomId === GENERAL_CHAT_ROOM_ID) {
        return {
          messages: {
            ...state.messages,
            [GENERAL_CHAT_ROOM_ID]: [],
          },
        }
      }

      const messages = { ...state.messages }
      delete messages[roomId]
      return { messages }
    }),
  receiveRoomMessage: (data) => {
    if (!data || typeof data.message !== 'string' || !data.user) return

    const roomId =
      typeof data.recipient === 'string' ? data.recipient : GENERAL_CHAT_ROOM_ID

    set((state) => appendMessageToRoom(state, roomId, data))
  },
  loadChatRooms: async () => {
    const token = getActiveToken()
    if (!token) return

    set({ error: '', isLoadingRooms: true })

    try {
      const { getRooms } = await getChatService()
      const { rooms } = await getRooms(token)
      useChatStore.getState().syncChatRooms(rooms)
      set({ isLoadingRooms: false })
    } catch (error) {
      set({ error: error.message, isLoadingRooms: false })
    }
  },
  createChatRoom: async ({ name, visibility }) => {
    const notifications = useNotificationStore.getState()

    set({ error: '', isSubmittingRoom: true })

    try {
      const { createRoom, getRooms } = await getChatService()
      const { room } = await createRoom({ name, visibility }, requireToken())
      const { rooms } = await getRooms(requireToken())
      useChatStore.getState().syncChatRooms(rooms)
      await joinSocketChatRoom(room.id)
      set({ activeRoom: room.socketRoom, isSubmittingRoom: false })
      notifications.push('Room created', 'success')
      return room
    } catch (error) {
      set({ error: error.message, isSubmittingRoom: false })
      notifications.push(error.message, 'error')
      return null
    }
  },
  joinChatRoom: async (room) => {
    const notifications = useNotificationStore.getState()
    const roomId = getRoomApiId(room)

    set({ error: '', isSubmittingRoom: true })

    try {
      const { getRooms, joinRoom } = await getChatService()
      const { room: joinedRoom } = await joinRoom(roomId, requireToken())
      const { rooms } = await getRooms(requireToken())
      useChatStore.getState().syncChatRooms(rooms)
      await joinSocketChatRoom(joinedRoom.id)
      set({ activeRoom: joinedRoom.socketRoom, isSubmittingRoom: false })
      notifications.push('Room joined', 'success')
      return joinedRoom
    } catch (error) {
      set({ error: error.message, isSubmittingRoom: false })
      notifications.push(error.message, 'error')
      return null
    }
  },
  loadRoomMessages: async (room) => {
    const token = getActiveToken()
    const roomId = getRoomApiId(room)

    if (!token || !room?.isJoined || !roomId) return

    try {
      const { getMessages } = await getChatService()
      const { messages } = await getMessages(roomId, token)
      useChatStore.getState().setMessages(room.id, messages)
    } catch {
      // Live chat remains usable if history cannot be loaded.
    }
  },
  inviteChatRoomUser: async ({ room, targetUserId }) => {
    const notifications = useNotificationStore.getState()
    const roomId = getRoomApiId(room)

    set({ error: '', isSubmittingRoom: true })

    try {
      const { getRooms, inviteUserToRoom } = await getChatService()
      const { room: updatedRoom } = await inviteUserToRoom(
        { roomId, targetUserId },
        requireToken(),
      )
      const { rooms } = await getRooms(requireToken())
      useChatStore.getState().syncChatRooms(rooms)
      set({ isSubmittingRoom: false })
      notifications.push('Invitation sent', 'success')
      return updatedRoom
    } catch (error) {
      set({ error: error.message, isSubmittingRoom: false })
      notifications.push(error.message, 'error')
      return null
    }
  },
  setChatRoomMemberMuted: async ({ isMuted, room, targetUserId }) => {
    const notifications = useNotificationStore.getState()
    const roomId = getRoomApiId(room)

    set({ error: '', isSubmittingRoom: true })

    try {
      const { getRooms, updateRoomMember } = await getChatService()
      const { room: updatedRoom } = await updateRoomMember(
        { isMuted, roomId, targetUserId },
        requireToken(),
      )
      const { rooms } = await getRooms(requireToken())
      useChatStore.getState().syncChatRooms(rooms)
      set({ isSubmittingRoom: false })
      notifications.push(isMuted ? 'Member muted' : 'Member unmuted', 'success')
      return updatedRoom
    } catch (error) {
      set({ error: error.message, isSubmittingRoom: false })
      notifications.push(error.message, 'error')
      return null
    }
  },
  removeChatRoomMember: async ({ room, targetUserId }) => {
    const notifications = useNotificationStore.getState()
    const roomId = getRoomApiId(room)

    set({ error: '', isSubmittingRoom: true })

    try {
      const { getRooms, removeRoomMember } = await getChatService()
      const { room: updatedRoom } = await removeRoomMember(
        { roomId, targetUserId },
        requireToken(),
      )
      const { rooms } = await getRooms(requireToken())
      useChatStore.getState().syncChatRooms(rooms)
      set({ isSubmittingRoom: false })
      notifications.push('Member removed', 'success')
      return updatedRoom
    } catch (error) {
      set({ error: error.message, isSubmittingRoom: false })
      notifications.push(error.message, 'error')
      return null
    }
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
