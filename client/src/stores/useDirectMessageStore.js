import { getStoredToken } from '../services/tokenStorage.js'
import { createSessionStore } from './createSessionStore.js'
import { isActiveToken } from './sessionGuard.js'
import useNotificationStore from './useNotificationStore.js'

const MAX_MESSAGES_PER_CONVERSATION = 100

const getDefaultState = () => ({
  activeConversationId: null,
  conversations: [],
  error: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
  messagesByConversation: {},
  unreadCount: 0,
})

const getActiveToken = () => getStoredToken()

const requireToken = () => {
  const token = getActiveToken()
  if (!token) throw new Error('Authentication required')
  return token
}

const defaultMessagesServiceLoader = () => import('@/services/messages')
let messagesServiceLoader = defaultMessagesServiceLoader

export const setMessagesServiceLoaderForTests = (loader) => {
  messagesServiceLoader = loader
}

export const resetMessagesServiceLoaderForTests = () => {
  messagesServiceLoader = defaultMessagesServiceLoader
}

const getMessagesService = () => messagesServiceLoader()
const getFriendsService = () => import('@/services/friends')

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

const getTimestamp = (value) => {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const shouldReplaceReadAt = (currentReadAt, nextReadAt) => {
  const nextTimestamp = getTimestamp(nextReadAt)
  if (nextTimestamp === null) return false

  const currentTimestamp = getTimestamp(currentReadAt)
  return currentTimestamp === null || nextTimestamp > currentTimestamp
}

const advanceOwnReadAt = (conversations, conversationId, readAt) => {
  return conversations.map((conversation) => {
    if (String(conversation.id) !== String(conversationId)) {
      return conversation
    }
    if (!shouldReplaceReadAt(conversation.lastReadAt, readAt)) {
      return conversation
    }

    return {
      ...conversation,
      lastReadAt: readAt,
    }
  })
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

    const isIncoming = String(message.senderId) !== String(currentUserId)
    const isActive =
      useDirectMessageStore.getState().activeConversationId ===
      message.conversationId

    set((state) => {
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
        unreadCount: getConversationUnreadTotal(conversations),
      }
    })

    // A message that lands while its thread is on screen is read the moment
    // it renders, so push the cursor to the server; that is what flips the
    // sender's receipt live instead of waiting for the next thread open.
    if (isIncoming && isActive) {
      useDirectMessageStore
        .getState()
        .markConversationRead(message.conversationId, message.createdAt)
    }
  },

  markConversationRead: async (conversationId, readAt) => {
    const token = getActiveToken()
    if (!token || !conversationId) return

    // Advance the local cursor first so the incoming bubble flips at once.
    set((state) => ({
      conversations: advanceOwnReadAt(
        state.conversations,
        conversationId,
        readAt,
      ),
    }))

    try {
      const { markConversationRead } = await getMessagesService()
      const result = await markConversationRead(conversationId, token)
      if (!isActiveToken(token)) return
      set((state) => ({
        conversations: advanceOwnReadAt(
          state.conversations,
          conversationId,
          result.readAt,
        ),
      }))
    } catch {
      // The cursor resyncs from the conversation DTO on the next thread load.
    }
  },

  markConversationReadByFriend: ({ conversationId, readAt } = {}) => {
    if (!conversationId || !readAt) return
    if (!getActiveToken()) return

    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (String(conversation.id) !== String(conversationId)) {
          return conversation
        }
        if (!shouldReplaceReadAt(conversation.friendLastReadAt, readAt)) {
          return conversation
        }

        return {
          ...conversation,
          friendLastReadAt: readAt,
        }
      }),
    }))
  },

  reset: () => set(getDefaultState()),
}))

export default useDirectMessageStore
