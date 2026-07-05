import useChatStore from '@/stores/useChatStore'
import RoomLabel from '../RoomLabel'
import useAuthStore from '@/stores/useAuthStore'
import { listFriends } from '@/services/friends'
import { useEffect } from 'react'

const SideBar = () => {
  const rooms = useChatStore((state) => state.rooms)
  const setRooms = useChatStore((state) => state.setRooms)
  const setMessages = useChatStore((state) => state.setMessages)
  const token = useAuthStore((state) => state.token)

  // TODO refactor to useProfileStore()
  useEffect(() => {
    let isMounted = true

    const setPrivateRooms = async () => {
      const data = await listFriends(token)

      const privateRooms = data.friends.map((f) => {
        const roomId = `user:${f.user.id}`
        setMessages(roomId, [])
        return {
          id: roomId,
          name: f.user.username,
        }
      })

      if (isMounted) {
        setRooms(rooms.concat(privateRooms))
        setMessages
      }
    }

    setPrivateRooms()

    return () => (isMounted = false)
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
          {rooms
            .filter((room) => room.id.startsWith('channel:'))
            .map((room) => (
              <RoomLabel room={room} key={room.id} />
            ))}
        </ul>
        <h2 className="mt-4 font-semibold">FRIENDS</h2>
        <hr className="border-[#e1e6de]" />
        <ul>
          {rooms
            .filter((room) => room.id.startsWith('user'))
            .map((room) => (
              <RoomLabel room={room} key={room.id} />
            ))}
        </ul>
      </div>
    </>
  )
}

export default SideBar
