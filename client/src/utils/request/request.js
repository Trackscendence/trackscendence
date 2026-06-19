const apiBaseUrl = `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/v1`

const SESSION_ERROR_MESSAGES = new Set([
  'Authentication required',
  'Invalid or expired token',
])

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

const REQUEST_TIMEOUT_MS = 30_000

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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    const error = await parseError(response)

    if (
      response.status === 401 &&
      token &&
      error.code === 'UNAUTHORIZED' &&
      SESSION_ERROR_MESSAGES.has(error.message)
    ) {
      window.dispatchEvent(
        new CustomEvent('trackscendence:session-expired', {
          detail: { token },
        }),
      )
    }

    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export default request
