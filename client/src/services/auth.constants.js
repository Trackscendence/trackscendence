export const USERNAME_REGEX = /^[a-z][a-z0-9]*$/
export const USERNAME_MIN_LENGTH = 6
export const USERNAME_MAX_LENGTH = 32

export const EMAIL_MAX_LENGTH = 254
export const EMAIL_REGEX = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/

export const PASSWORD_MAX_LENGTH = 254
export const PASSWORD_WHITESPACE_REGEX = /\s/
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/
export const PASSWORD_LOWERCASE_REGEX = /[a-z]/
export const PASSWORD_NUMBER_REGEX = /\d/
export const PASSWORD_SYMBOL_REGEX = /[^a-z0-9]/i
export const PASSWORD_MIN_LENGTH = 8
