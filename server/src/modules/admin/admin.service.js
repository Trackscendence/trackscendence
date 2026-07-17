const getAccess = (user) => ({
  message: 'Admin access granted',
  user: {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  },
})

module.exports = {
  getAccess,
}
