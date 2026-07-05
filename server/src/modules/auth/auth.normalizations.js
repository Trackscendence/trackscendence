const normalizeEmail = (email = '') => email.trim().toLowerCase()

const normalizeUsername = (username = '') => username.trim().toLowerCase()

const normalizeIdentifier = (identifier = '') => identifier.trim().toLowerCase()

const normalizePassword = (password = '') =>
  typeof password === 'string' ? password : ''

const normalizeRegistrationInput = ({ email, username, password } = {}) => {
  return {
    email: normalizeEmail(email),
    username: normalizeUsername(username),
    password: normalizePassword(password),
  }
}

module.exports = {
  normalizeEmail,
  normalizeUsername,
  normalizeIdentifier,
  normalizePassword,
  normalizeSignupInput,
  normalizeRegistrationInput,
}
