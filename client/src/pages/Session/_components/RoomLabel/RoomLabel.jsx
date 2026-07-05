import useChatStore from '@/stores/useChatStore'

const RoomLabel = ({ room }) => {
  const activeRoom = useChatStore((state) => state.activeRoom)
  const setActiveRoom = useChatStore((state) => state.setActiveRoom)

  return (
    <>
      <li
        className={
          room === activeRoom
            ? 'mt-2 flex w-full gap-1 rounded-md bg-[#58947C] px-4 py-2.5 text-sm font-semibold text-white'
            : 'mt-2 flex w-full gap-1 rounded-md bg-[#D9E7E0] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#B4CFC3]'
        }
        onClick={room === activeRoom ? undefined : () => setActiveRoom(room)}
        key={room}
      >
        {room.startsWith('user:') && (
          <div className="place-self-center">
            <svg className="size-4 place-self-center fill-green-500">
              <use href="#circle-fill" />
            </svg>
          </div>
        )}
        <div className="place-self-center">{room.split(':')[1]}</div>
        {/* {room !== activeRoom && (
          <div className="place-self-center rounded-md bg-[#2f7d61] p-1 text-white">
            15
          </div>
        )} */}
      </li>
    </>
  )
}

export default RoomLabel
