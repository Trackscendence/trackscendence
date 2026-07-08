// Session-token persistence, isolated to one dependency-free module. The storage
// mechanism (localStorage today) lives behind these three helpers so it can
// change in exactly one place, and because this file imports nothing else it can
// be consumed by modules that must stay loadable outside the bundler (e.g. the
// node-tested stores) without dragging in the HTTP/request graph.
const AUTH_TOKEN_KEY = 'trackscendence.auth.token'

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export const setStoredToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearStoredToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
