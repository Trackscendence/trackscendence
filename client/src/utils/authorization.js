export const USER_ROLES = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
})

export const hasRequiredRole = (user, allowedRoles = []) => {
  return Boolean(user && allowedRoles.includes(user.role))
}

export const isAdmin = (user) => {
  return hasRequiredRole(user, [USER_ROLES.ADMIN])
}
