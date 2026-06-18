import { request } from './api'

export const AUTH_TOKEN_KEY = 'trackscendence.auth.token'

export const register = (payload) => {
  return request('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export const login = (payload) => {
  return request('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export const fetchCurrentUser = (token) => {
  return request('/auth/me', { token })
}

export const logout = (token) => {
  return request('/auth/logout', {
    method: 'POST',
    token,
  })
}

export const changePassword = (payload, token) => {
  return request('/auth/change-password', {
    method: 'POST',
    body: payload,
    token,
  })
}

export const requestPasswordReset = (payload) => {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: payload,
  })
}

export const resetPassword = (payload) => {
  return request('/auth/reset-password', {
    method: 'POST',
    body: payload,
  })
}
