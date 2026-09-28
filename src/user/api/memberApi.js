import { getAccessToken } from '../../auth/authStorage.js'
import { request } from '../../shared/api/httpClient.js'

function authenticatedRequest(path, options = {}) {
  return request(path, { ...options, token: getAccessToken() })
}

export const memberApi = {
  updateMember: body => authenticatedRequest('/api/v1/members/me', { method: 'PATCH', body: JSON.stringify(body) }),
  getLearningProfile: () => authenticatedRequest('/api/v1/members/me/learning-profile'),
  updateLearningProfile: body => authenticatedRequest('/api/v1/members/me/learning-profile', { method: 'PUT', body: JSON.stringify(body) }),
}
