import { getAccessToken } from '../../auth/authStorage.js'
import { ApiError, request } from './httpClient.js'

function authenticatedRequest(path, options = {}) {
  return request(path, { ...options, token: getAccessToken() })
}

export const learningApi = {
  getGoals: () => authenticatedRequest('/api/v1/goals'),
  getConfirmedTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks/confirmed`),
  startScheduleItem: (scheduleId, itemId) => authenticatedRequest(`/api/v1/schedules/${scheduleId}/items/${itemId}/start`, { method: 'PATCH' }),
  completeScheduleItem: (scheduleId, itemId) => authenticatedRequest(`/api/v1/schedules/${scheduleId}/items/${itemId}/complete`, { method: 'PATCH' }),
  failScheduleItem: (scheduleId, itemId, reasonCode, reasonDetail) => authenticatedRequest(`/api/v1/schedules/${scheduleId}/items/${itemId}/failure`, {
    method: 'PATCH',
    body: JSON.stringify({ reasonCode, reasonDetail: reasonDetail || null }),
  }),
  saveTimerResult: (scheduleId, itemId, result) => authenticatedRequest(`/api/v1/schedules/${scheduleId}/items/${itemId}/timer-results`, {
    method: 'POST',
    body: JSON.stringify(result),
  }),
}

export function isTimerResultApiUnavailable(error) {
  return error instanceof ApiError && [404, 405, 501].includes(error.status)
}
