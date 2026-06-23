const EMAIL_REGEX = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/
const USERNAME_REGEX = /^[a-z][a-z0-9]*$/

const PASSWORD_MIN_LENGTH = 8

const USERNAME_MIN_LENGTH = 6
const USERNAME_MAX_LENGTH = 32

const EMAIL_MAX_LENGTH = 254

const normalizeIdentifier = (identifier) => {
  const trimmedIdentifier = identifier.trim()

  return trimmedIdentifier.includes('@')
    ? trimmedIdentifier.toLowerCase()
    : trimmedIdentifier
}

const PASSWORD_WHITESPACE_REGEX = /\s/
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/
const PASSWORD_LOWERCASE_REGEX = /[a-z]/
const PASSWORD_NUMBER_REGEX = /\d/
const PASSWORD_SYMBOL_REGEX = /[^a-z0-9]/i

//FRONTEND VALIDATIONS FOR SIGNUP PAGE
export const validateSignupInput = ({ email, username, password }) => {
  const errors = {}

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedPassword = typeof password === 'string' ? password : ''

  if (!normalizedEmail) {
    errors.email = 'Email address is required'
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Email must be valid'
  } else if (normalizedEmail.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email must not be more than ${EMAIL_MAX_LENGTH} characters`
  }

  if (!normalizedUsername) {
    errors.username = 'Username is required'
  } else if (!USERNAME_REGEX.test(normalizedUsername)) {
    errors.username =
      'Username must start with a letter and contain only lowercase letters and numbers'
  } else if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    errors.username = `Username must not be less than ${USERNAME_MIN_LENGTH} characters`
  } else if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
    errors.username = `Username must not be more than ${USERNAME_MAX_LENGTH} characters`
  }

  if (!normalizedPassword) {
    errors.password = 'Password is required'
  } else if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  } else if (PASSWORD_WHITESPACE_REGEX.test(normalizedPassword)) {
    errors.password = 'Password must not contain whitespace'
  } else if (!PASSWORD_UPPERCASE_REGEX.test(normalizedPassword)) {
    errors.password = 'Password must contain an uppercase letter'
  } else if (!PASSWORD_LOWERCASE_REGEX.test(normalizedPassword)) {
    errors.password = 'Password must contain an lowercase letter'
  } else if (!PASSWORD_NUMBER_REGEX.test(normalizedPassword)) {
    errors.password = 'Password must contain a number'
  } else if (!PASSWORD_SYMBOL_REGEX.test(normalizedPassword)) {
    errors.password = 'Password must contain a symbol'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedData: {
      email: normalizedEmail,
      username: normalizedUsername,
      password: normalizedPassword,
    },
  }
}

//FRONTEND VALIDATIONS FOR LOGIN PAGE
export const validateLoginInput = ({ identifier, password }) => {
  const errors = {}

  const normalizedIdentifier =
    typeof identifier === 'string' ? normalizeIdentifier(identifier) : ''
  const normalizedPassword = typeof password === 'string' ? password : ''

  if (!normalizedIdentifier) {
    errors.identifier = 'Email or username is required'
  }

  if (!normalizedPassword) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedData: {
      identifier: normalizedIdentifier,
      password: normalizedPassword,
    },
  }
}
