import request from '@/utils/request'

export const checkApiHealth = () => {
  return request('/health')
}
