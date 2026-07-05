export const normalizeEmail = (email = '') => email.trim().toLowerCase()

export const normalizeUsername = (username = '') =>
  username.trim().toLowerCase()

export const normalizeIdentifier = (identifier = '') =>
  identifier.trim().toLowerCase()

export const normalizeSignupInput = (form) => ({
  email: normalizeEmail(form.email),
  username: normalizeUsername(form.username),
  password: form.password,
})

export const normalizeLoginInput = (form) => ({
  identifier: normalizeIdentifier(form.identifier),
  password: typeof form.password === 'string' ? form.password : '',
})
