import { create } from 'zustand'
import { getStoredToken } from '../services/tokenStorage.js'
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

const getMessagesService = () => import('@/services/messages')

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

const useDirectMessageStore = create((set) => ({
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
      const conversations = result.conversations || []
      set({
        conversations,
        isLoadingConversations: false,
        unreadCount:
          result.unreadCount ?? getConversationUnreadTotal(conversations),
      })
    } catch (error) {
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
      set({ error: error.message })
      await useDirectMessageStore.getState().loadConversations()
    }
  },

  ensureConversation: async (targetUserId) => {
    const notifications = useNotificationStore.getState()

    try {
      const { getOrCreateConversation } = await getMessagesService()
      const { conversation } = await getOrCreateConversation(
        targetUserId,
        requireToken(),
      )
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
      set({ error: error.message, isLoadingMessages: false })
    }
  },

  sendMessage: async ({ conversationId, message }) => {
    const notifications = useNotificationStore.getState()

    try {
      const { sendConversationMessage } = await getMessagesService()
      const result = await sendConversationMessage(
        { conversationId, message },
        requireToken(),
      )

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
      notifications.push(error.message, 'error')
      return null
    }
  },

  receiveMessage: (message, currentUserId) => {
    if (!message?.conversationId || !message?.id) return

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
        unreadCount: getConversationUnreadTotal(conversations),
      }
    })
  },

  reset: () => set(getDefaultState()),
}))

export default useDirectMessageStore
