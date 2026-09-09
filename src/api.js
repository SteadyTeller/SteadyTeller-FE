const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  const token = sessionStorage.getItem('accessToken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success === false) {
    if (response.status === 401) clearSession()
    throw new Error(body?.message || '요청을 처리하지 못했습니다.')
  }
  return body?.data
}

export function signUp(payload) {
  return request('/api/v1/auth/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload) {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getMyProfile() {
  return request('/api/v1/members/me')
}

export function saveSession(loginResponse) {
  sessionStorage.setItem('accessToken', loginResponse.accessToken)
  sessionStorage.setItem('member', JSON.stringify(loginResponse.member))
}

export function loadSession() {
  const accessToken = sessionStorage.getItem('accessToken')
  const memberJson = sessionStorage.getItem('member')
  if (!accessToken || !memberJson) return null

  try {
    return { accessToken, member: JSON.parse(memberJson) }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('member')
}
