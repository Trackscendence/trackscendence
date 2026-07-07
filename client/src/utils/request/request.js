const env = import.meta.env || {}

export const apiBaseUrl = `${(env.VITE_API_URL || '/api').replace(/\/$/, '')}/v1`

// Dev-only breadcrumb: the debug HUD listens for this to log failed API calls.
// The name is owned here (the producer) so the HUD can import it without prod
// ever reaching into the dev module. The dispatch is gated on env.DEV, so it
// and this string tree-shake out of production builds.
export const REQUEST_ERROR_EVENT = 'trackscendence:request-error'

const emitRequestError = (method, path, status, message) => {
  if (!env.DEV || typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(REQUEST_ERROR_EVENT, {
      detail: { method, path, status, message },
    }),
  )
}

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
  // FormData bodies (file uploads) must go out untouched: the browser sets a
  // multipart Content-Type with the right boundary, and encoding them as JSON
  // would corrupt them. Everything else is JSON.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const headers = {
    Accept: 'application/json',
  }

  if (body && !isFormData) {
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
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      emitRequestError(method, path, 'timeout', 'Request timed out')
      throw new Error('Request timed out')
    }
    emitRequestError(method, path, 'network', err.message)
    throw err
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    const error = await parseError(response)
    emitRequestError(method, path, response.status, error.message)

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
