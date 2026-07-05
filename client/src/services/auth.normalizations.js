export const normalizeEmail = (email = '') => email.trim().toLowerCase()

export const normalizeUsername = (username = '') =>
  username.trim().toLowerCase()

export const normalizeIdentifier = (identifier = '') =>
  identifier.trim().toLowerCase()

const normalizePassword = (password = '') =>
  typeof password === 'string' ? password : ''

export const normalizeSignupInput = (form = {}) => ({
  email: normalizeEmail(form.email),
  username: normalizeUsername(form.username),
  password: normalizePassword(form.password),
})

export const normalizeLoginInput = (form) => ({
  identifier: normalizeIdentifier(form.identifier),
  password: typeof form.password === 'string' ? form.password : '',
})
