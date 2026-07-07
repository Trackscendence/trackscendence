export const BOOT_RETRY_BASE_MS = 500
export const BOOT_RETRY_MAX_MS = 3000
const GATEWAY_CONNECTION_STATUSES = new Set([502, 504])

export const getBootRetryDelay = (attempt) =>
  Math.min(BOOT_RETRY_BASE_MS * 2 ** attempt, BOOT_RETRY_MAX_MS)

export const isBootConnectionError = (error) =>
  !error?.status || GATEWAY_CONNECTION_STATUSES.has(error.status)
