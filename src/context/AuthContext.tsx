import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  refreshSessionTokens,
} from '@/lib/api'
import { clearTokens, isAuthenticated, setTokens } from '@/lib/tokenStorage'
import type { AuthUser } from '@/types/api'

type AuthContextValue = {
  authenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshSession: () => Promise<boolean>
  avatarVersion: number
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(isAuthenticated)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [avatarVersion, setAvatarVersion] = useState(0)

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null)
      return
    }
    try {
      const profile = await getMe()
      setUser(profile)
      setAvatarVersion((v) => v + 1)
    } catch {
      setUser(null)
      if (!isAuthenticated()) setAuthenticated(false)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const ok = await refreshSessionTokens()
    if (ok) {
      setAuthenticated(true)
      await refreshUser()
    } else {
      setAuthenticated(false)
      setUser(null)
    }
    return ok
  }, [refreshUser])

  useEffect(() => {
    if (!authenticated) {
      setUser(null)
      return
    }
    void (async () => {
      try {
        await refreshUser()
      } catch {
        const ok = await refreshSession()
        if (!ok) setAuthenticated(false)
      }
    })()
  }, [authenticated, refreshUser, refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password)
    setTokens(tokens.access_token, tokens.refresh_token)
    setAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      /* still clear local session */
    }
    clearTokens()
    setAuthenticated(false)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      authenticated,
      user,
      login,
      logout,
      refreshUser,
      refreshSession,
      avatarVersion,
    }),
    [authenticated, user, login, logout, refreshUser, refreshSession, avatarVersion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
