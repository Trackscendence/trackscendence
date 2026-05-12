const authService = require('#modules/auth/auth.service')

const register = async (req, res) => {
	const user = await authService.register(req.body)

	res.status(201).json({ user })
}

const login = async (req, res) => {
	const result = await authService.login(req.body)

	res.json(result)
}

const me = (req, res) => {
	res.json({ user: req.user })
}

const logout = (req, res) => {
	res.status(204).send()
}

module.exports = {
	register,
	login,
	me,
	logout,
}
