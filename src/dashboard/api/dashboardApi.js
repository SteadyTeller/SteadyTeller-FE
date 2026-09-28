import { getAccessToken } from '../../auth/authStorage.js'
import { request } from '../../shared/api/httpClient.js'

function authenticatedRequest(path, options = {}) {
  return request(path, { ...options, token: getAccessToken() })
}

export const dashboardApi = {
  getGoals: () => authenticatedRequest('/api/v1/goals'),
  getConfirmedTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks/confirmed`),
}
