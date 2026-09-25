import { getAccessToken } from '../../auth/authStorage.js'
import { request } from '../../shared/api/httpClient.js'

function authenticatedRequest(path, options = {}) {
  return request(path, { ...options, token: getAccessToken() })
}

export const learningManagementApi = {
  getGoals: () => authenticatedRequest('/api/v1/goals'),
  createGoal: payload => authenticatedRequest('/api/v1/goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoal: (goalId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getConfirmedTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks/confirmed`),
  getSchedules: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/schedules`),
  getSchedule: scheduleId => authenticatedRequest(`/api/v1/schedules/${scheduleId}`),
  createReplan: (goalId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}/replan/availabilities`, { method: 'PUT', body: JSON.stringify(payload) }),
}
