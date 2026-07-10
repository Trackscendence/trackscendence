// Shared formatters for direct-message timestamps so the mail dropdown, the
// conversation list, the thread, and the notification menu all render times and
// dates the same way. Both guard against missing values.

export const formatMessageTime = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export const formatMessageDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}
