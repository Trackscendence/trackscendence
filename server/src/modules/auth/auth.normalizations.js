const normalizeEmail = (email) => email.trim().toLowerCase()

const normalizeUsername = (username) => username.trim().toLowerCase()

const normalizeIdentifier = (identifier) => identifier.trim().toLowerCase()

const normalizePassword = (password) =>
  typeof password === 'string' ? password : ''

const normalizeBoolean = (value) => value === true

const normalizeRegistrationInput = ({
  email,
  username,
  password,
  privacyAccepted,
  termsAccepted,
} = {}) => {
  return {
    email: normalizeEmail(email),
    username: normalizeUsername(username),
    password: normalizePassword(password),
    privacyAccepted: normalizeBoolean(privacyAccepted),
    termsAccepted: normalizeBoolean(termsAccepted),
  }
}

module.exports = {
  normalizeEmail,
  normalizeUsername,
  normalizeIdentifier,
  normalizeRegistrationInput,
}
