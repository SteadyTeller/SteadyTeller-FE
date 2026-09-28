import { getAccessToken } from '../../auth/authStorage.js'
import { request } from '../../shared/api/httpClient.js'

function get(path) {
  return request(path, { token: getAccessToken() })
}

export const recordsApi = {
  getGoals: () => get('/api/v1/goals'),
  getSummary: (startDate, endDate) => get(`/api/v1/statistics/summary?startDate=${startDate}&endDate=${endDate}`),
  getDaily: (startDate, endDate) => get(`/api/v1/statistics/daily?startDate=${startDate}&endDate=${endDate}`),
  getGoal: goalId => get(`/api/v1/statistics/goals/${goalId}`),
}
