import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import useAuthStore from '@/stores/useAuthStore'
import useDirectMessageStore from '@/stores/useDirectMessageStore'
import useNotificationStore from '@/stores/useNotificationStore'
import useSocketStore from '@/stores/useSocketStore'
import ConversationList from './_components/ConversationList'
import MessageThread from './_components/MessageThread'

const Messages = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
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

      navigate(`/messages?conversation=${conversation.id}`, { replace: true })
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

    if (!activeConversationId && conversations[0]) {
      setActiveConversation(conversations[0].id)
    }
  }, [activeConversationId, conversations, searchParams, setActiveConversation])

  useEffect(() => {
    if (!activeConversationId) return
    loadMessages(activeConversationId)
  }, [activeConversationId, loadMessages])

  const sendMessage = (message) => {
    if (!selectedConversation?.friend?.id) return false

    const sent = useSocketStore
      .getState()
      .sendChatMessage(message, `user:${selectedConversation.friend.id}`)

    if (!sent) {
      pushNotification('Message could not be sent', 'error')
    }

    return sent
  }

  return (
    <div className="bg-surface-warm flex min-h-screen flex-col text-[#3d1200]">
      <AppHeader />

      <main className="flex flex-1 px-6 py-6">
        <div className="mx-auto grid h-[calc(100vh-8.25rem)] w-full max-w-[1240px] grid-cols-1 overflow-hidden rounded-lg border border-[#e6c9a8] bg-white shadow-[0_18px_45px_rgba(61,18,0,0.08)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationList
            activeConversationId={activeConversationId}
            conversations={visibleConversations}
            filter={filter}
            isLoading={isLoadingConversations}
            onFilterChange={setFilter}
            onSelect={(conversationId) => {
              setActiveConversation(conversationId)
              navigate(`/messages?conversation=${conversationId}`, {
                replace: true,
              })
            }}
          />
          <MessageThread
            conversation={selectedConversation}
            currentUserId={user?.id}
            isConnected={isConnected}
            isLoading={isLoadingMessages}
            messages={
              selectedConversation
                ? messagesByConversation[selectedConversation.id] || []
                : []
            }
            onSend={sendMessage}
          />
        </div>
      </main>
    </div>
  )
}

export default Messages
