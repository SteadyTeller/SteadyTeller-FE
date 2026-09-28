import { getAccessToken } from '../../auth/authStorage.js'
import { request } from '../../shared/api/httpClient.js'

function authenticatedRequest(path, options = {}) {
  return request(path, { ...options, token: getAccessToken() })
}

export const learningManagementApi = {
  getGoals: () => authenticatedRequest('/api/v1/goals'),
  createGoal: payload => authenticatedRequest('/api/v1/goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoal: (goalId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  generateTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks/generate`, { method: 'POST' }),
  getCandidateTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks`),
  createCandidateTask: (goalId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}/tasks`, { method: 'POST', body: JSON.stringify(payload) }),
  updateCandidateTask: (taskId, payload) => authenticatedRequest(`/api/v1/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCandidateTask: taskId => authenticatedRequest(`/api/v1/tasks/${taskId}`, { method: 'DELETE' }),
  deleteConfirmedTask: taskId => authenticatedRequest(`/api/v1/confirmed-tasks/${taskId}`, { method: 'DELETE' }),
  getConfirmedTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks/confirmed`),
  confirmTasks: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/tasks/confirm`, { method: 'POST' }),
  getSchedules: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/schedules`),
  getSchedule: scheduleId => authenticatedRequest(`/api/v1/schedules/${scheduleId}`),
  completeScheduleItem: (scheduleId, itemId) => authenticatedRequest(`/api/v1/schedules/${scheduleId}/items/${itemId}/complete`, { method: 'PATCH' }),
  revertScheduleItemCompletion: (scheduleId, itemId) => authenticatedRequest(`/api/v1/schedules/${scheduleId}/items/${itemId}/complete`, { method: 'DELETE' }),
  getAvailabilities: goalId => authenticatedRequest(`/api/v1/members/me/availabilities?goalId=${encodeURIComponent(goalId)}`),
  getEditableAvailabilityDays: goalId => authenticatedRequest(`/api/v1/members/me/availabilities/editable-days?goalId=${encodeURIComponent(goalId)}`),
  replaceAvailabilities: (goalId, payload) => authenticatedRequest(`/api/v1/members/me/availabilities?goalId=${encodeURIComponent(goalId)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createReplan: (goalId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}/replan/availabilities`, { method: 'PUT', body: JSON.stringify(payload) }),
  getReplanCandidates: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/replan/tasks`),
  getReplanCapacity: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/replan/tasks/capacity-status`),
  createReplanCandidate: (goalId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}/replan/tasks`, { method: 'POST', body: JSON.stringify(payload) }),
  updateReplanCandidate: (goalId, candidateId, payload) => authenticatedRequest(`/api/v1/goals/${goalId}/replan/tasks/${candidateId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteReplanCandidate: (goalId, candidateId) => authenticatedRequest(`/api/v1/goals/${goalId}/replan/tasks/${candidateId}`, { method: 'DELETE' }),
  confirmReplan: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/replan/confirm`, { method: 'POST' }),
  cancelReplan: goalId => authenticatedRequest(`/api/v1/goals/${goalId}/replan`, { method: 'DELETE' }),
}
