import { useCallback, useEffect, useState } from 'react'
import { authApi } from '../api/authApi.js'
import { clearAccessToken, getAccessToken, setAccessToken } from '../authStorage.js'

export function useAuth() {
  const [member, setMember] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(getAccessToken()))

  const logout = useCallback(() => {
    clearAccessToken()
    setMember(null)
  }, [])

  const loadMember = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setMember(null)
      setIsLoading(false)
      return null
    }

    setIsLoading(true)
    try {
      const currentMember = await authApi.getCurrentMember(token)
      setMember(currentMember)
      return currentMember
    } catch (error) {
      if (error.status === 401) clearAccessToken()
      setMember(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadMember() }, [loadMember])

  const login = useCallback(async ({ email, password }) => {
    const result = await authApi.login(email, password)
    setAccessToken(result.accessToken)
    return loadMember()
  }, [loadMember])

  const signup = useCallback(({ email, password, nickname }) => authApi.signup(email, password, nickname), [])

  return { member, isAuthenticated: Boolean(member), isLoading, login, logout, signup }
}
