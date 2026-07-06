import io from 'socket.io-client'

// Same-origin by default: the proxy layer (Vite in dev, nginx in prod) owns
// the backend address, so the socket inherits the page's scheme and host —
// exactly what wss:// under HTTPS needs. VITE_SOCKET_URL stays as an escape
// hatch for setups with no proxy in front of the client at all.
const URL = import.meta.env.VITE_SOCKET_URL || window.location.origin

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
  path: '/websocket/',
})
