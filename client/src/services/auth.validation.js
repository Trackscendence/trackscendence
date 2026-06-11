
export const validateSignupInput = ({email, username, password}) => {
  const errors = {}

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedPassword = password.trim()

  const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]*$/

  if (!normalizedEmail) {
    errors.email = 'Valid email address is required'
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Email must be valid'
  }

  if (!normalizedUsername) {
    errors.username = 'Username is required'
  } else if (!USERNAME_REGEX.test(normalizedUsername)) {
    errors.username = 'Username cannot start with a number'
  }

  if (!normalizedPassword) {
    errors.password = 'Password is required'
  } else if (normalizedPassword.length < 8) {
  	errors.password = 'Password must be at least 8 characters'
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
