
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]*$/

const PASSWORD_MIN_LENGTH = 8

const USERNAME_MIN_LENGTH = 6
const USERNAME_MAX_LENGTH = 32

const normalizeIdentifier = (identifier) => {
  const trimmedIdentifier = identifier.trim()

  return trimmedIdentifier.includes('@')
    ? trimmedIdentifier.toLowerCase() : trimmedIdentifier
}

//SIGNUP PAGE VALIDATIONS
export const validateSignupInput = ({email, username, password}) => {
  const errors = {}
  
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedPassword = password.trim()

  if (!normalizedEmail) {
    errors.email = 'Valid email address is requred'
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Email must be valid'
  }

  if (!normalizedUsername) {
    errors.username = 'Username is required'
  } else if (!USERNAME_REGEX.test(normalizedUsername)) {
    errors.username = 'Username must start with a letter and container only letter and numbers'
  } else if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    errors.username = `Username must not be less than ${USERNAME_MIN_LENGTH} characters`
  } else if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
    errors.username = `Username must not be more than ${USERNAME_MAX_LENGTH} characters`
  }

  if (!normalizedPassword) {
    errors.password = 'Password is required'
  } else if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
  	errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
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

//LOGIN PAGE VALIDATIONS
export const validateLoginInput = ({identifier, password}) => {
  const errors = {}
  
  const normalizedIdentifier = typeof identifier === 'string' ? normalizeIdentifier(identifier) : ''
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
