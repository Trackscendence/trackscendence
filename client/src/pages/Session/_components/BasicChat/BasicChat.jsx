import { useEffect } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useChatStore, { GENERAL_CHAT_ROOM_ID } from '@/stores/useChatStore'
import useProfileStore from '@/stores/useProfileStore'
import useSocketStore from '@/stores/useSocketStore'
import Room from '../Room'
import Sidebar from '../Sidebar'

const BasicChat = () => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const friends = useProfileStore((state) => state.friends)
  const refreshFriendContext = useProfileStore(
    (state) => state.refreshFriendContext,
  )
  const roomsById = useChatStore((state) => state.rooms)
  const messagesByRoom = useChatStore((state) => state.messages)
  const activeRoomId = useChatStore((state) => state.activeRoom)
  const setActiveRoom = useChatStore((state) => state.setActiveRoom)
  const syncFriendRooms = useChatStore((state) => state.syncFriendRooms)
  const sendChatMessage = useSocketStore((state) => state.sendChatMessage)

  const activeRoom = roomsById[activeRoomId] || roomsById[GENERAL_CHAT_ROOM_ID]
  const messages = messagesByRoom[activeRoom?.id] || []

  useEffect(() => {
    if (!token) return undefined

    refreshFriendContext().catch(() => undefined)

    return undefined
  }, [refreshFriendContext, token])

  useEffect(() => {
    syncFriendRooms(friends)
  }, [friends, syncFriendRooms])

  return (
    <div className="mt-6 rounded-lg border border-[#d8dfd4] bg-white p-4 shadow-sm sm:p-6">
      <div className="grid overflow-hidden rounded-md border border-[#e1e6de] bg-[#fbfcfa] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Sidebar
          activeRoomId={activeRoom?.id}
          onSelectRoom={setActiveRoom}
          rooms={Object.values(roomsById)}
        />
        <Room
          currentUserId={user?.id}
          messages={messages}
          onSendMessage={(message) => sendChatMessage(message, activeRoom?.id)}
          room={activeRoom}
        />
      </div>
    </div>
  )
}

export default BasicChat
