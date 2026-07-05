import {
  EMAIL_REGEX,
  USERNAME_REGEX,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
} from './auth.constants'

import { normalizeIdentifier } from '@/services/auth.normalizations'

export const PASSWORD_WHITESPACE_REGEX = /\s/
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/
export const PASSWORD_LOWERCASE_REGEX = /[a-z]/
export const PASSWORD_NUMBER_REGEX = /\d/
export const PASSWORD_SYMBOL_REGEX = /[^a-z0-9]/i
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 254

//FRONTEND VALIDATIONS FOR SIGNUP PAGE
export const validateSignupInput = ({ email, username, password }) => {
  const errors = {}

  if (!email) {
    errors.email = 'Email address is required'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Email must be valid'
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email must not be more than ${EMAIL_MAX_LENGTH} characters`
  }

  if (!username) {
    errors.username = 'Username is required'
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username =
      'Username must start with a letter and contain only lowercase letters and numbers'
  } else if (username.length < USERNAME_MIN_LENGTH) {
    errors.username = `Username must not be less than ${USERNAME_MIN_LENGTH} characters`
  } else if (username.length > USERNAME_MAX_LENGTH) {
    errors.username = `Username must not be more than ${USERNAME_MAX_LENGTH} characters`
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be less than ${PASSWORD_MAX_LENGTH} characters`
  } else if (PASSWORD_WHITESPACE_REGEX.test(password)) {
    errors.password = 'Password must not contain whitespace'
  } else if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    errors.password = 'Password must contain an uppercase letter'
  } else if (!PASSWORD_LOWERCASE_REGEX.test(password)) {
    errors.password = 'Password must contain a lowercase letter'
  } else if (!PASSWORD_NUMBER_REGEX.test(password)) {
    errors.password = 'Password must contain a number'
  } else if (!PASSWORD_SYMBOL_REGEX.test(password)) {
    errors.password = 'Password must contain a symbol'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
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
