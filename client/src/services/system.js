import request from '@/utils/request'

export const checkApiHealth = () => {
  return request('/health')
}

export const fetchAdminAccess = (token) => {
  return request('/admin/access', { token })
}
