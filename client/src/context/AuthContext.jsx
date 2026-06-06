import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './auth-context'
import {
  AUTH_TOKEN_KEY,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../services/auth'

const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()))

  useEffect(() => {
    let isMounted = true
    const storedToken = getStoredToken()

    if (!storedToken) {
      return undefined
    }

    fetchCurrentUser(storedToken)
      .then(({ user: currentUser }) => {
        if (!isMounted) {
          return
        }

        setToken(storedToken)
        setUser(currentUser)
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)

        if (!isMounted) {
          return
        }

        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const register = useCallback((payload) => {
    return registerRequest(payload)
  }, [])

  const login = useCallback(async (payload) => {
    const result = await loginRequest(payload)

    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    setToken(result.token)
    setUser(result.user)

    return result
  }, [])

  const logout = useCallback(async () => {
    const activeToken = token || getStoredToken()

    localStorage.removeItem(AUTH_TOKEN_KEY)
    setToken(null)
    setUser(null)

    if (activeToken) {
      try {
        await logoutRequest(activeToken)
      } catch {
        // Logout is client-side for stateless bearer tokens.
      }
    }
  }, [token])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      register,
      token,
      user,
    }),
    [isLoading, login, logout, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
