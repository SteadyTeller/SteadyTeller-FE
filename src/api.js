const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  const token = localStorage.getItem('steadyTeller.accessToken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || `요청에 실패했습니다. (${response.status})`)
  }
  return body?.data
}

export const api = {
  signup: (email, password, nickname) => request('/api/v1/auth/members', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  }),
  login: (email, password) => request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  member: () => request('/api/v1/members/me'),
  updateMember: (payload) => request('/api/v1/members/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  withdraw: () => request('/api/v1/members/me', { method: 'DELETE' }),
  goal: (goalId) => request(`/api/v1/goals/${goalId}`),
  goals: () => request('/api/v1/goals'),
  createGoal: (payload) => request('/api/v1/goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoal: (goalId, payload) => request(`/api/v1/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteGoal: (goalId) => request(`/api/v1/goals/${goalId}`, { method: 'DELETE' }),
  candidates: (goalId) => request(`/api/v1/goals/${goalId}/tasks`),
  generateTasks: (goalId) => request(`/api/v1/goals/${goalId}/tasks/generate`, { method: 'POST' }),
  addCandidate: (goalId, payload) => request(`/api/v1/goals/${goalId}/tasks`, { method: 'POST', body: JSON.stringify(payload) }),
  updateCandidate: (taskId, payload) => request(`/api/v1/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCandidate: (taskId) => request(`/api/v1/tasks/${taskId}`, { method: 'DELETE' }),
  confirmTasks: (goalId) => request(`/api/v1/goals/${goalId}/tasks/confirm`, { method: 'POST' }),
  schedules: (goalId) => request(`/api/v1/goals/${goalId}/schedules`),
  generateSchedule: (goalId) => request(`/api/v1/goals/${goalId}/schedules`, { method: 'POST' }),
  schedule: (scheduleId) => request(`/api/v1/schedules/${scheduleId}`),
  deleteSchedule: (scheduleId) => request(`/api/v1/schedules/${scheduleId}`, { method: 'DELETE' }),
  updateScheduleItem: (scheduleId, itemId, payload) => request(`/api/v1/schedules/${scheduleId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  startScheduleItem: (scheduleId, itemId) => request(`/api/v1/schedules/${scheduleId}/items/${itemId}/start`, { method: 'PATCH' }),
  completeScheduleItem: (scheduleId, itemId) => request(`/api/v1/schedules/${scheduleId}/items/${itemId}/complete`, { method: 'PATCH' }),
  revertScheduleItemCompletion: (scheduleId, itemId) => request(`/api/v1/schedules/${scheduleId}/items/${itemId}/complete`, { method: 'DELETE' }),
  learningProfile: () => request('/api/v1/members/me/learning-profile'),
  updateLearningProfile: (payload) => request('/api/v1/members/me/learning-profile', { method: 'PUT', body: JSON.stringify(payload) }),
  availabilities: () => request('/api/v1/members/me/availabilities'),
  createAvailability: (payload) => request('/api/v1/members/me/availabilities', { method: 'POST', body: JSON.stringify(payload) }),
  updateAvailability: (availabilityId, payload) => request(`/api/v1/members/me/availabilities/${availabilityId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAvailability: (availabilityId) => request(`/api/v1/members/me/availabilities/${availabilityId}`, { method: 'DELETE' }),
}
