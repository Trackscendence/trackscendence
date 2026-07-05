import useChatStore from '@/stores/useChatStore'
import RoomLabel from '../RoomLabel'
import useAuthStore from '@/stores/useAuthStore'
import { listFriends } from '@/services/friends'
import { useEffect } from 'react'

const SideBar = () => {
  const rooms = useChatStore((state) => state.rooms)
  const addRoom = useChatStore((state) => state.addRoom)
  const setMessages = useChatStore((state) => state.setMessages)
  const token = useAuthStore((state) => state.token)

  // TODO refactor to useProfileStore()
  useEffect(() => {
    const setPrivateRooms = async () => {
      const data = await listFriends(token)

      data.friends.map((f) => {
        const roomId = `user:${f.user.id}`
        addRoom(roomId, f.user.username)
        setMessages(roomId, [])
        return {
          id: roomId,
          name: f.user.username,
        }
      })
    }

    setPrivateRooms()
  }, [token])

  return (
    <>
      <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
        <symbol id="circle-fill" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="4" />
        </symbol>
      </svg>
      <div className="border-e border-[#e1e6de] p-4">
        <ul>
          {Object.entries(rooms)
            .filter(([key]) => key.startsWith('channel:'))
            .map(([key, value]) => (
              <RoomLabel roomId={key} roomName={value.name} key={key} />
            ))}
        </ul>
        <h2 className="mt-4 font-semibold">FRIENDS</h2>
        <hr className="border-[#e1e6de]" />
        <ul>
          {Object.entries(rooms)
            .filter(([key]) => key.startsWith('user:'))
            .map(([key, value]) => (
              <RoomLabel roomId={key} roomName={value.name} key={key} />
            ))}
        </ul>
      </div>
    </>
  )
}

export default SideBar
