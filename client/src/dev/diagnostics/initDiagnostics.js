import { REQUEST_ERROR_EVENT } from '@/utils/request'
import useDiagnosticsStore from './diagnosticsStore'

// Guard against double-attaching: React StrictMode mounts effects twice in dev,
// and every listener added here has a matching remove in the returned cleanup.
let isAttached = false

const truncate = (value, max = 200) => {
  const text = typeof value === 'string' ? value : String(value ?? '')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

// Starts capturing uncaught errors, unhandled promise rejections, and failed
// API requests into the diagnostics log. Returns a cleanup that detaches every
// listener — call it from the effect that owns the HUD's lifetime.
const initDiagnostics = () => {
  if (isAttached) return () => {}
  isAttached = true

  const { push } = useDiagnosticsStore.getState()

  const onError = (event) =>
    push({
      kind: 'error',
      label: truncate(event.message || 'Uncaught error'),
      detail: event.filename
        ? `${event.filename}:${event.lineno ?? '?'}`
        : undefined,
    })

  const onRejection = (event) => {
    const reason = event.reason
    push({
      kind: 'rejection',
      label: truncate(reason?.message || reason || 'Unhandled rejection'),
      detail: reason?.stack ? truncate(reason.stack, 120) : undefined,
    })
  }

  const onRequestError = (event) => {
    const { method, path, status, message } = event.detail || {}
    push({
      kind: 'request',
      label: truncate(`${status ?? 'ERR'} ${method || 'GET'} ${path || ''}`),
      detail: message ? truncate(message, 120) : undefined,
    })
  }

  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  window.addEventListener(REQUEST_ERROR_EVENT, onRequestError)

  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
    window.removeEventListener(REQUEST_ERROR_EVENT, onRequestError)
    isAttached = false
  }
}

export default initDiagnostics
