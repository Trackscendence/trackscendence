const config = require('#utils/config')

const ROLES = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
})

const adminEmails = new Set(config.ADMIN_EMAILS)

const isAdminEmail = (email) =>
  typeof email === 'string' && adminEmails.has(email.trim().toLowerCase())

module.exports = {
  isAdminEmail,
  ROLES,
}
