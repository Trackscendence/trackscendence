const apiBaseUrl = `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/v1`

export const AUTH_TOKEN_KEY = 'trackscendence.auth.token'
const SESSION_ERROR_MESSAGES = new Set(['Authentication required', 'Invalid or expired token'])

const parseError = async (response) => {
	let body

	try {
		body = await response.json()
	} catch {
		body = null
	}

	const message = body?.error?.message || 'Request failed'
	const error = new Error(message)
	error.status = response.status
	error.code = body?.error?.code
	error.payload = body?.error?.payload

	return error
}

const request = async (path, { method = 'GET', body, token } = {}) => {
	const headers = {
		Accept: 'application/json',
	}

	if (body) {
		headers['Content-Type'] = 'application/json'
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	const response = await fetch(`${apiBaseUrl}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	})

	if (!response.ok) {
		const error = await parseError(response)

		if (response.status === 401 && token && error.code === 'UNAUTHORIZED' && SESSION_ERROR_MESSAGES.has(error.message)) {
			window.dispatchEvent(new CustomEvent('trackscendence:session-expired'))
		}

		throw error
	}

	if (response.status === 204) {
		return null
	}

	return response.json()
}

export const register = (payload) => {
	return request('/auth/register', {
		method: 'POST',
		body: payload,
	})
}

export const login = (payload) => {
	return request('/auth/login', {
		method: 'POST',
		body: payload,
	})
}

export const fetchCurrentUser = (token) => {
	return request('/auth/me', { token })
}

export const logout = (token) => {
	return request('/auth/logout', {
		method: 'POST',
		token,
	})
}

export const changePassword = (payload, token) => {
	return request('/auth/change-password', {
		method: 'POST',
		body: payload,
		token,
	})
}

export const requestPasswordReset = (payload) => {
	return request('/auth/forgot-password', {
		method: 'POST',
		body: payload,
	})
}

export const resetPassword = (payload) => {
	return request('/auth/reset-password', {
		method: 'POST',
		body: payload,
	})
}
