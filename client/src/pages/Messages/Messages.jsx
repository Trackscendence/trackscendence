import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import getConversationPath from '@/utils/conversationPath'
import useAuthStore from '@/stores/useAuthStore'
import useDirectMessageStore from '@/stores/useDirectMessageStore'
import useNotificationStore from '@/stores/useNotificationStore'
import useSocketStore from '@/stores/useSocketStore'
import ComposeThread from './_components/ComposeThread'
import ConversationList from './_components/ConversationList'
import MessageThread from './_components/MessageThread'

const Messages = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const isComposing = searchParams.get('compose') === '1'
  const user = useAuthStore((state) => state.user)
  const isConnected = useSocketStore((state) => state.isConnected)
  const conversations = useDirectMessageStore((state) => state.conversations)
  const activeConversationId = useDirectMessageStore(
    (state) => state.activeConversationId,
  )
  const isLoadingConversations = useDirectMessageStore(
    (state) => state.isLoadingConversations,
  )
  const isLoadingMessages = useDirectMessageStore(
    (state) => state.isLoadingMessages,
  )
  const messagesByConversation = useDirectMessageStore(
    (state) => state.messagesByConversation,
  )
  const typingByConversation = useDirectMessageStore(
    (state) => state.typingByConversation,
  )
  const setActiveConversation = useDirectMessageStore(
    (state) => state.setActiveConversation,
  )
  const ensureConversation = useDirectMessageStore(
    (state) => state.ensureConversation,
  )
  const loadConversations = useDirectMessageStore(
    (state) => state.loadConversations,
  )
  const loadMessages = useDirectMessageStore((state) => state.loadMessages)
  const blockUser = useDirectMessageStore((state) => state.blockUser)
  const sendStopTyping = useDirectMessageStore((state) => state.sendStopTyping)
  const sendTyping = useDirectMessageStore((state) => state.sendTyping)
  const unblockUser = useDirectMessageStore((state) => state.unblockUser)
  const pushNotification = useNotificationStore((state) => state.push)

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) || null,
    [activeConversationId, conversations],
  )

  const visibleConversations = useMemo(() => {
    if (filter === 'unread') {
      return conversations.filter(
        (conversation) => conversation.unreadCount > 0,
      )
    }

    return conversations
  }, [conversations, filter])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const targetUserId = searchParams.get('user')
    if (!targetUserId) return

    let isCancelled = false

    const openUserConversation = async () => {
      const conversation = await ensureConversation(Number(targetUserId))
      if (!conversation || isCancelled) return

      navigate(getConversationPath(conversation.id), { replace: true })
    }

    openUserConversation()

    return () => {
      isCancelled = true
    }
  }, [ensureConversation, navigate, searchParams])

  useEffect(() => {
    const queryConversationId = Number(searchParams.get('conversation'))
    if (Number.isInteger(queryConversationId) && queryConversationId > 0) {
      setActiveConversation(queryConversationId)
      return
    }

    // While composing the right panel is the compose form, so defaulting to
    // the first conversation would only highlight a row that is not shown.
    if (isComposing) return

    if (!activeConversationId && conversations[0]) {
      setActiveConversation(conversations[0].id)
    }
  }, [
    activeConversationId,
    conversations,
    isComposing,
    searchParams,
    setActiveConversation,
  ])

  useEffect(() => {
    if (!activeConversationId) return
    loadMessages(activeConversationId)
  }, [activeConversationId, loadMessages])

  const sendMessage = (message) => {
    if (!selectedConversation?.friend?.id) return false
    if (
      selectedConversation.blockState &&
      selectedConversation.blockState !== 'none'
    ) {
      return false
    }

    const sent = useSocketStore
      .getState()
      .sendChatMessage(message, `user:${selectedConversation.friend.id}`)

    if (!sent) {
      pushNotification('Message could not be sent', 'error')
    }

    return sent
  }

  const sendSelectedConversationTyping = () => {
    if (!selectedConversation?.friend?.id) return false
    return sendTyping(`user:${selectedConversation.friend.id}`)
  }

  const sendSelectedConversationStopTyping = () => {
    if (!selectedConversation?.friend?.id) return false
    return sendStopTyping(`user:${selectedConversation.friend.id}`)
  }

  const blockSelectedFriend = () => {
    if (!selectedConversation?.friend?.id) return undefined
    return blockUser(selectedConversation.friend.id)
  }

  const unblockSelectedFriend = () => {
    if (!selectedConversation?.friend?.id) return undefined
    return unblockUser(selectedConversation.friend.id)
  }

  // A compose send creates (or finds) the conversation first, delivers over
  // the same socket path a thread send uses, then lands in the thread.
  // ensureConversation never rejects; it toasts and returns null on failure.
  const sendToRecipient = async (recipientId, message) => {
    const conversation = await ensureConversation(recipientId)
    if (!conversation) return false

    const sent = useSocketStore
      .getState()
      .sendChatMessage(message, `user:${recipientId}`)

    if (!sent) {
      pushNotification('Message could not be sent', 'error')
      return false
    }

    navigate(getConversationPath(conversation.id), { replace: true })
    return true
  }

  return (
    <div className="bg-surface-warm flex min-h-screen flex-col text-[#3d1200]">
      <AppHeader />

      <main className="flex flex-1 px-6 py-6">
        <div className="mx-auto grid h-[calc(100vh-8.25rem)] w-full max-w-[1240px] grid-cols-1 overflow-hidden rounded-lg border border-[#e6c9a8] bg-white shadow-[0_18px_45px_rgba(61,18,0,0.08)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationList
            activeConversationId={isComposing ? null : activeConversationId}
            conversations={visibleConversations}
            filter={filter}
            isLoading={isLoadingConversations}
            onFilterChange={setFilter}
            onSelect={(conversationId) => {
              setActiveConversation(conversationId)
              navigate(getConversationPath(conversationId), {
                replace: true,
              })
            }}
          />
          {isComposing ? (
            <ComposeThread onSend={sendToRecipient} />
          ) : (
            <MessageThread
              conversation={selectedConversation}
              currentUserId={user?.id}
              isConnected={isConnected}
              isFriendTyping={Boolean(
                selectedConversation &&
                typingByConversation[selectedConversation.id],
              )}
              isLoading={isLoadingMessages}
              messages={
                selectedConversation
                  ? messagesByConversation[selectedConversation.id] || []
                  : []
              }
              onBlock={blockSelectedFriend}
              onSend={sendMessage}
              onStopTyping={sendSelectedConversationStopTyping}
              onTyping={sendSelectedConversationTyping}
              onUnblock={unblockSelectedFriend}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default Messages
