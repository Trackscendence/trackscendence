export const BOOT_RETRY_BASE_MS = 500
export const BOOT_RETRY_MAX_MS = 3000
const GATEWAY_CONNECTION_STATUSES = new Set([502, 504])

// Give the stack about half a minute to come up before giving up. The delays
// ramp 500ms -> 1s -> 2s then cap at 3s, so 12 attempts is ~28s of waiting.
// Past that a spinner is a lie: the API is almost certainly down, not still
// starting, and the user deserves to be told instead of spinning forever.
export const BOOT_MAX_ATTEMPTS = 12

export const getBootRetryDelay = (attempt) =>
  Math.min(BOOT_RETRY_BASE_MS * 2 ** attempt, BOOT_RETRY_MAX_MS)

export const isBootConnectionError = (error) =>
  !error?.status || GATEWAY_CONNECTION_STATUSES.has(error.status)

// True once the attempt just made was the last one we're willing to try, so
// the caller can stop retrying and surface an honest "unreachable" state.
export const hasExhaustedBootRetries = (attempt) =>
  attempt + 1 >= BOOT_MAX_ATTEMPTS
