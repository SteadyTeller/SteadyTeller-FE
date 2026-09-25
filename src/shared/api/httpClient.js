const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request(path, { token, ...options } = {}) {
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
    throw new ApiError(body?.message || `요청에 실패했습니다. (${response.status})`, response.status)
  }

  return body?.data
}
