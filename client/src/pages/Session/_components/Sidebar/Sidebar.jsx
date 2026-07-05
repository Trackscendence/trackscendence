import useChatStore from '@/stores/useChatStore'
import RoomLabel from '../RoomLabel'

const SideBar = () => {
  const rooms = useChatStore((state) => state.rooms)

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
            .filter((room) => room.startsWith('channel:'))
            .map((room) => (
              <RoomLabel room={room} key={room} />
            ))}
        </ul>
        <h2 className="mt-4 font-semibold">FRIENDS</h2>
        <hr className="border-[#e1e6de]" />
        <ul>
          {rooms
            .filter((room) => room.startsWith('user'))
            .map((room) => (
              <RoomLabel room={room} key={room} />
            ))}
        </ul>
      </div>
    </>
  )
}

export default SideBar
