let deferredRoomExitTimer = null

export const cancelDeferredRoomExit = ({
  timerRef,
  cancel = clearTimeout,
} = {}) => {
  const timer = timerRef?.current ?? deferredRoomExitTimer
  if (!timer) return

  cancel(timer)
  if (timerRef) timerRef.current = null
  if (deferredRoomExitTimer === timer) deferredRoomExitTimer = null
}

export const scheduleDeferredRoomExit = ({
  timerRef,
  leaveRoom,
  leaveLobby,
  schedule = setTimeout,
  cancel = clearTimeout,
}) => {
  cancelDeferredRoomExit({ timerRef, cancel })

  const timer = schedule(() => {
    leaveRoom()
    leaveLobby()
    if (timerRef) timerRef.current = null
    if (deferredRoomExitTimer === timer) deferredRoomExitTimer = null
  }, 0)
  deferredRoomExitTimer = timer
  if (timerRef) timerRef.current = timer
}
