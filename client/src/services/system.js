import request from '@/utils/request'

export const fetchAdminAccess = (token) => {
  return request('/admin/access', { token })
}
