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
  const isSubmittingRoom = useChatStore((state) => state.isSubmittingRoom)
  const createChatRoom = useChatStore((state) => state.createChatRoom)
  const inviteChatRoomUser = useChatStore((state) => state.inviteChatRoomUser)
  const joinChatRoom = useChatStore((state) => state.joinChatRoom)
  const loadChatRooms = useChatStore((state) => state.loadChatRooms)
  const loadRoomMessages = useChatStore((state) => state.loadRoomMessages)
  const removeChatRoomMember = useChatStore(
    (state) => state.removeChatRoomMember,
  )
  const setActiveRoom = useChatStore((state) => state.setActiveRoom)
  const setChatRoomMemberMuted = useChatStore(
    (state) => state.setChatRoomMemberMuted,
  )
  const syncFriendRooms = useChatStore((state) => state.syncFriendRooms)
  const sendChatMessage = useSocketStore((state) => state.sendChatMessage)

  const activeRoom = roomsById[activeRoomId] || roomsById[GENERAL_CHAT_ROOM_ID]
  const messages = messagesByRoom[activeRoom?.id] || []

  useEffect(() => {
    if (!token) return undefined

    refreshFriendContext().catch(() => undefined)
    loadChatRooms()

    return undefined
  }, [loadChatRooms, refreshFriendContext, token])

  useEffect(() => {
    syncFriendRooms(friends)
  }, [friends, syncFriendRooms])

  useEffect(() => {
    loadRoomMessages(activeRoom)
  }, [activeRoom, loadRoomMessages])

  return (
    <div className="mt-6 rounded-lg border border-[#d8dfd4] bg-white p-4 shadow-sm sm:p-6">
      <div className="grid overflow-hidden rounded-md border border-[#e1e6de] bg-[#fbfcfa] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Sidebar
          activeRoomId={activeRoom?.id}
          isSubmittingRoom={isSubmittingRoom}
          onCreateRoom={createChatRoom}
          onSelectRoom={setActiveRoom}
          rooms={Object.values(roomsById)}
        />
        <Room
          currentUserId={user?.id}
          isSubmittingRoom={isSubmittingRoom}
          messages={messages}
          onInviteUser={inviteChatRoomUser}
          onJoinRoom={joinChatRoom}
          onRemoveMember={removeChatRoomMember}
          onSendMessage={(message) => sendChatMessage(message, activeRoom?.id)}
          onSetMuted={setChatRoomMemberMuted}
          room={activeRoom}
        />
      </div>
    </div>
  )
}

export default BasicChat
