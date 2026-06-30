const ROLES = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
})

const ADMIN_ROLES = Object.freeze([ROLES.ADMIN])

module.exports = {
  ADMIN_ROLES,
  ROLES,
}
