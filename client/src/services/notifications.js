import request from '@/utils/request'

const encodeSegment = (value) => encodeURIComponent(value)

export const getNotifications = (token) => {
  return request('/notifications', { token })
}

export const markNotificationRead = (notificationId, token) => {
  return request(`/notifications/${encodeSegment(notificationId)}/read`, {
    method: 'PATCH',
    token,
  })
}

export const markAllNotificationsRead = (token) => {
  return request('/notifications/read-all', {
    method: 'POST',
    token,
  })
}
