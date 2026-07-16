export const validatePasswordConfirmation = ({
  password = '',
  confirmPassword = '',
} = {}) => {
  if (typeof confirmPassword !== 'string' || confirmPassword.length === 0) {
    return 'Confirm password is required'
  }

  if (typeof password === 'string' && password !== confirmPassword) {
    return 'Passwords do not match'
  }

  return null
}
