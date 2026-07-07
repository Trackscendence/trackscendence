export const cancelDeferredRoomExit = ({ timerRef, cancel = clearTimeout }) => {
  if (!timerRef.current) return

  cancel(timerRef.current)
  timerRef.current = null
}

export const scheduleDeferredRoomExit = ({
  timerRef,
  leaveRoom,
  leaveLobby,
  schedule = setTimeout,
  cancel = clearTimeout,
}) => {
  cancelDeferredRoomExit({ timerRef, cancel })

  timerRef.current = schedule(() => {
    leaveRoom()
    leaveLobby()
    timerRef.current = null
  }, 0)
}
