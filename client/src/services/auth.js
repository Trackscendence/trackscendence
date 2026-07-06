import request, { apiBaseUrl } from '@/utils/request'

export const AUTH_TOKEN_KEY = 'trackscendence.auth.token'

// Full-page navigation target, not an XHR: the server answers with a 302 to
// the 42 intra authorization page.
export const getFortyTwoLoginUrl = () => `${apiBaseUrl}/auth/42`

export const fetchAuthProviders = () => {
  return request('/auth/providers')
}

export const completeFortyTwoLogin = (payload) => {
  return request('/auth/42/callback', {
    method: 'POST',
    body: payload,
  })
}

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

export const completeTwoFactorLogin = (payload) => {
  return request('/auth/login/2fa', {
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

export const setupTwoFactor = (token) => {
  return request('/auth/two-factor/setup', {
    method: 'POST',
    token,
  })
}

export const confirmTwoFactorSetup = (payload, token) => {
  return request('/auth/two-factor/confirm', {
    method: 'POST',
    body: payload,
    token,
  })
}

export const disableTwoFactor = (token) => {
  return request('/auth/two-factor/disable', {
    method: 'POST',
    token,
  })
}

export const regenerateTwoFactor = (token) => {
  return request('/auth/two-factor/regenerate', {
    method: 'POST',
    token,
  })
}
