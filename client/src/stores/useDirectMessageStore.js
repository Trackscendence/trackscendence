import { SOCKET_EVENTS } from '../services/socketEvents.js'
import { getStoredToken } from '../services/tokenStorage.js'
import { createSessionStore } from './createSessionStore.js'
import { isActiveToken } from './sessionGuard.js'
import useNotificationStore from './useNotificationStore.js'

const MAX_MESSAGES_PER_CONVERSATION = 100
const MAX_TYPING_CONVERSATIONS = 50
const PRIVATE_ROOM_PREFIX = 'user:'
const TYPING_THROTTLE_MS = 2000
export const TYPING_STALE_TIMEOUT_MS = 5000

const outboundTypingSentAtByRecipient = new Map()
const inboundTypingTimeoutsByConversation = new Map()

const getDefaultState = () => ({
  activeConversationId: null,
  conversations: [],
  error: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
  messagesByConversation: {},
  typingByConversation: {},
  unreadCount: 0,
})

const getActiveToken = () => getStoredToken()

const requireToken = () => {
  const token = getActiveToken()
  if (!token) throw new Error('Authentication required')
  return token
}

const getMessagesService = () => import('@/services/messages')
const getFriendsService = () => import('@/services/friends')
const getSocketService = () => import('../services/socket.js')

const normalizeConversationId = (value) => {
  const conversationId = Number(value)
  return Number.isInteger(conversationId) && conversationId > 0
    ? conversationId
    : null
}

const normalizePrivateRecipient = (recipient) => {
  const value = typeof recipient === 'string' ? recipient.trim() : ''
  if (!value.startsWith(PRIVATE_ROOM_PREFIX)) return ''

  const userId = Number(value.slice(PRIVATE_ROOM_PREFIX.length))
  if (!Number.isInteger(userId) || userId < 1) return ''

  return `${PRIVATE_ROOM_PREFIX}${userId}`
}

const clearInboundTypingTimeout = (conversationId) => {
  const key = String(conversationId)
  if (!inboundTypingTimeoutsByConversation.has(key)) return

  const timeoutId = inboundTypingTimeoutsByConversation.get(key)
  clearTimeout(timeoutId)
  inboundTypingTimeoutsByConversation.delete(key)
}

const clearAllTypingState = () => {
  inboundTypingTimeoutsByConversation.forEach((timeoutId) => {
    clearTimeout(timeoutId)
  })
  inboundTypingTimeoutsByConversation.clear()
  outboundTypingSentAtByRecipient.clear()
}

const deleteTypingEntry = (typingByConversation, conversationId) => {
  const key = String(conversationId)
  if (!typingByConversation[key]) return typingByConversation

  const nextTypingByConversation = { ...typingByConversation }
  delete nextTypingByConversation[key]
  return nextTypingByConversation
}

const limitTypingEntries = (typingByConversation) => {
  const entries = Object.entries(typingByConversation)
  if (entries.length <= MAX_TYPING_CONVERSATIONS) {
    return typingByConversation
  }

  const nextTypingByConversation = { ...typingByConversation }
  entries
    .sort(
      ([, first], [, second]) =>
        (first.receivedAt || 0) - (second.receivedAt || 0),
    )
    .slice(0, entries.length - MAX_TYPING_CONVERSATIONS)
    .forEach(([conversationId]) => {
      clearInboundTypingTimeout(conversationId)
      delete nextTypingByConversation[conversationId]
    })

  return nextTypingByConversation
}

const canSendTyping = (recipient) => {
  const now = Date.now()
  const lastSentAt = outboundTypingSentAtByRecipient.get(recipient)

  if (lastSentAt != null && now - lastSentAt < TYPING_THROTTLE_MS) {
    return false
  }

  outboundTypingSentAtByRecipient.set(recipient, now)

  if (outboundTypingSentAtByRecipient.size > MAX_TYPING_CONVERSATIONS) {
    const [oldestRecipient] = outboundTypingSentAtByRecipient.keys()
    outboundTypingSentAtByRecipient.delete(oldestRecipient)
  }

  return true
}

const emitTypingEvent = async (event, recipient) => {
  const normalizedRecipient = normalizePrivateRecipient(recipient)
  if (!normalizedRecipient || !getActiveToken()) return false

  try {
    const { socket } = await getSocketService()
    if (!socket.connected) return false

    socket.emit(event, { recipient: normalizedRecipient })
    return true
  } catch {
    return false
  }
}

const setConversationBlockState = (conversations, friendId, blockState) => {
  return conversations.map((conversation) =>
    conversation.friend?.id === friendId
      ? { ...conversation, blockState }
      : conversation,
  )
}

const sortConversations = (conversations) => {
  return [...conversations].sort((first, second) => {
    const firstTime = new Date(
      first.lastMessage?.createdAt || first.updatedAt || first.createdAt,
    ).getTime()
    const secondTime = new Date(
      second.lastMessage?.createdAt || second.updatedAt || second.createdAt,
    ).getTime()
    return secondTime - firstTime
  })
}

const upsertConversation = (conversations, nextConversation) => {
  if (!nextConversation) return conversations

  const existingIndex = conversations.findIndex(
    (conversation) => conversation.id === nextConversation.id,
  )

  if (existingIndex === -1) {
    return sortConversations([nextConversation, ...conversations])
  }

  const nextConversations = [...conversations]
  nextConversations[existingIndex] = {
    ...nextConversations[existingIndex],
    ...nextConversation,
    unreadCount:
      nextConversation.unreadCount ??
      nextConversations[existingIndex].unreadCount ??
      0,
  }
  return sortConversations(nextConversations)
}

const appendMessage = (messagesByConversation, message) => {
  const currentMessages = messagesByConversation[message.conversationId] || []
  if (currentMessages.some((item) => item.id === message.id)) {
    return messagesByConversation
  }

  return {
    ...messagesByConversation,
    [message.conversationId]: [...currentMessages, message].slice(
      -MAX_MESSAGES_PER_CONVERSATION,
    ),
  }
}

const getConversationUnreadTotal = (conversations) => {
  return conversations.reduce(
    (total, conversation) => total + (conversation.unreadCount || 0),
    0,
  )
}

// Session store (#391): holds the signed-in user's message content, so it is
// cleared by resetSessionStores() at teardown, and every post-await write is
// guarded so an in-flight response from a previous session cannot repopulate it.
const useDirectMessageStore = createSessionStore((set) => ({
  ...getDefaultState(),

  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),

  loadConversations: async () => {
    const token = getActiveToken()
    if (!token) return

    set({ error: '', isLoadingConversations: true })

    try {
      const { getConversations } = await getMessagesService()
      const result = await getConversations(token)
      if (!isActiveToken(token)) return
      const conversations = result.conversations || []
      set({
        conversations,
        isLoadingConversations: false,
        unreadCount:
          result.unreadCount ?? getConversationUnreadTotal(conversations),
      })
    } catch (error) {
      if (!isActiveToken(token)) return
      set({ error: error.message, isLoadingConversations: false })
    }
  },

  markAllRead: async () => {
    const token = getActiveToken()
    if (!token) return

    const { conversations } = useDirectMessageStore.getState()
    if (!conversations.some((conversation) => conversation.unreadCount > 0)) {
      return
    }

    // Zero the badges immediately, then persist; reload on failure to resync.
    set((state) => ({
      conversations: state.conversations.map((conversation) => ({
        ...conversation,
        unreadCount: 0,
      })),
      unreadCount: 0,
    }))

    try {
      const { markAllConversationsRead } = await getMessagesService()
      await markAllConversationsRead(token)
    } catch (error) {
      if (!isActiveToken(token)) return
      set({ error: error.message })
      await useDirectMessageStore.getState().loadConversations()
    }
  },

  ensureConversation: async (targetUserId) => {
    const notifications = useNotificationStore.getState()

    let token = null
    try {
      token = requireToken()
      const { getOrCreateConversation } = await getMessagesService()
      const { conversation } = await getOrCreateConversation(
        targetUserId,
        token,
      )
      if (!isActiveToken(token)) return null
      set((state) => {
        const conversations = upsertConversation(
          state.conversations,
          conversation,
        )
        return {
          activeConversationId: conversation.id,
          conversations,
          unreadCount: getConversationUnreadTotal(conversations),
        }
      })
      return conversation
    } catch (error) {
      if (token && !isActiveToken(token)) return null
      notifications.push(error.message, 'error')
      return null
    }
  },

  loadMessages: async (conversationId) => {
    const token = getActiveToken()
    if (!token || !conversationId) return

    set({ error: '', isLoadingMessages: true })

    try {
      const { getConversationMessages } = await getMessagesService()
      const { conversation, messages } = await getConversationMessages(
        conversationId,
        token,
      )
      if (!isActiveToken(token)) return

      set((state) => {
        const conversations = upsertConversation(state.conversations, {
          ...conversation,
          unreadCount: 0,
        })

        return {
          conversations,
          isLoadingMessages: false,
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: (messages || []).slice(
              -MAX_MESSAGES_PER_CONVERSATION,
            ),
          },
          unreadCount: getConversationUnreadTotal(conversations),
        }
      })
    } catch (error) {
      if (!isActiveToken(token)) return
      set({ error: error.message, isLoadingMessages: false })
    }
  },

  sendMessage: async ({ conversationId, message }) => {
    const notifications = useNotificationStore.getState()

    let token = null
    try {
      token = requireToken()
      const { sendConversationMessage } = await getMessagesService()
      const result = await sendConversationMessage(
        { conversationId, message },
        token,
      )
      if (!isActiveToken(token)) return null

      set((state) => {
        const conversations = upsertConversation(state.conversations, {
          id: result.message.conversationId,
          lastMessage: result.message,
          updatedAt: result.message.createdAt,
        })

        return {
          conversations,
          messagesByConversation: appendMessage(
            state.messagesByConversation,
            result.message,
          ),
          unreadCount: getConversationUnreadTotal(conversations),
        }
      })

      return result.message
    } catch (error) {
      if (token && !isActiveToken(token)) return null
      notifications.push(error.message, 'error')
      return null
    }
  },

  sendTyping: async (recipient) => {
    const normalizedRecipient = normalizePrivateRecipient(recipient)
    if (!normalizedRecipient || !canSendTyping(normalizedRecipient)) {
      return false
    }

    const emitted = await emitTypingEvent(
      SOCKET_EVENTS.CHAT_TYPING,
      normalizedRecipient,
    )

    if (!emitted) {
      outboundTypingSentAtByRecipient.delete(normalizedRecipient)
    }

    return emitted
  },

  sendStopTyping: async (recipient) => {
    const normalizedRecipient = normalizePrivateRecipient(recipient)
    if (!normalizedRecipient) return false

    outboundTypingSentAtByRecipient.delete(normalizedRecipient)
    return emitTypingEvent(SOCKET_EVENTS.CHAT_STOP_TYPING, normalizedRecipient)
  },

  // Block/unblock reuse the friendship record on the server; here they only
  // flip the affected conversation's blockState so the thread swaps between the
  // composer and the blocked banner. The friend id is stable, so the update
  // survives a conversation reorder.
  blockUser: async (friendId) => {
    const notifications = useNotificationStore.getState()

    let token = null
    try {
      token = requireToken()
      const { blockUser } = await getFriendsService()
      const result = await blockUser(friendId, token)
      if (!isActiveToken(token)) return null
      set((state) => ({
        conversations: setConversationBlockState(
          state.conversations,
          friendId,
          result.blockState,
        ),
      }))
      return result
    } catch (error) {
      if (token && !isActiveToken(token)) return null
      notifications.push(error.message, 'error')
      return null
    }
  },

  unblockUser: async (friendId) => {
    const notifications = useNotificationStore.getState()

    let token = null
    try {
      token = requireToken()
      const { unblockUser } = await getFriendsService()
      const result = await unblockUser(friendId, token)
      if (!isActiveToken(token)) return null
      set((state) => ({
        conversations: setConversationBlockState(
          state.conversations,
          friendId,
          result.blockState,
        ),
      }))
      return result
    } catch (error) {
      if (token && !isActiveToken(token)) return null
      notifications.push(error.message, 'error')
      return null
    }
  },

  receiveMessage: (message, currentUserId) => {
    if (!message?.conversationId || !message?.id) return
    // Socket handler: a late event after teardown must not write into a store
    // that was just cleared for the next user (#391).
    if (!getActiveToken()) return

    clearInboundTypingTimeout(message.conversationId)

    set((state) => {
      const isIncoming = String(message.senderId) !== String(currentUserId)
      const isActive = state.activeConversationId === message.conversationId
      const existingConversation = state.conversations.find(
        (conversation) => conversation.id === message.conversationId,
      )
      const conversations = upsertConversation(state.conversations, {
        id: message.conversationId,
        lastMessage: message,
        unreadCount:
          isIncoming && !isActive
            ? (existingConversation?.unreadCount || 0) + 1
            : existingConversation?.unreadCount || 0,
        updatedAt: message.createdAt,
        friend: isIncoming ? message.user : existingConversation?.friend,
      })

      return {
        conversations,
        messagesByConversation: appendMessage(
          state.messagesByConversation,
          message,
        ),
        typingByConversation: deleteTypingEntry(
          state.typingByConversation,
          message.conversationId,
        ),
        unreadCount: getConversationUnreadTotal(conversations),
      }
    })
  },

  receiveTyping: (payload) => {
    if (!getActiveToken()) return

    const conversationId = normalizeConversationId(payload?.conversationId)
    if (!conversationId) return

    clearInboundTypingTimeout(conversationId)

    const timeoutId = setTimeout(() => {
      useDirectMessageStore.getState().clearTyping(conversationId)
    }, TYPING_STALE_TIMEOUT_MS)
    inboundTypingTimeoutsByConversation.set(String(conversationId), timeoutId)

    set((state) => ({
      typingByConversation: limitTypingEntries({
        ...state.typingByConversation,
        [conversationId]: { receivedAt: Date.now() },
      }),
    }))
  },

  receiveStopTyping: (payload) => {
    if (!getActiveToken()) return

    const conversationId = normalizeConversationId(payload?.conversationId)
    if (!conversationId) return

    useDirectMessageStore.getState().clearTyping(conversationId)
  },

  clearTyping: (conversationId) => {
    const normalizedConversationId = normalizeConversationId(conversationId)
    if (!normalizedConversationId) return

    clearInboundTypingTimeout(normalizedConversationId)

    set((state) => ({
      typingByConversation: deleteTypingEntry(
        state.typingByConversation,
        normalizedConversationId,
      ),
    }))
  },

  reset: () => {
    clearAllTypingState()
    set(getDefaultState())
  },
}))

export default useDirectMessageStore
