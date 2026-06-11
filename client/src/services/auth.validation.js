
export const validateSignupInput = ({email, username, password}) => {
  const errors = {}

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim()
  const normalizedPassword = password

  const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

  if (!normalizedEmail) {
    errors.email = 'Valid email address is required'
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Email must be valid'
  }

  if (!normalizedUsername) {
    errors.username = 'Username is required'
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
