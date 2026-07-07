export const attachSocketSessionListeners = (socket, handlers) => {
  detachSocketSessionListeners(socket, handlers)
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })
}

export const detachSocketSessionListeners = (socket, handlers) => {
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.off(event, handler)
  })
}
