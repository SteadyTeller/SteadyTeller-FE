import { request } from '../../shared/api/httpClient.js'

export const authApi = {
  signup: (email, password, nickname) => request('/api/v1/auth/members', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  }),
  login: (email, password) => request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  getCurrentMember: token => request('/api/v1/members/me', { token }),
}
