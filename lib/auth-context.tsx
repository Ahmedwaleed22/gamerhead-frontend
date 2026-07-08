'use client'

// lib/auth-context.tsx
// Wrap your layout.tsx with <AuthProvider> and use useAuth() anywhere.

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { authApi, ApiError } from './api'
import { trackEvent } from './gtag'
import { AchievementBadge } from '@/types/Badges.type'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:             string
  slug:           string
  username:       string
  email:          string | null
  googleId:       string | null
  steamAccountId: string | null
  onboardingDone: boolean
  usernameColor:  string
  avatarUrl:      string | null
  bannerUrl:      string | null
  level:          number
  xp:             number
  xpToNextLevel:  number
  reputation:     number
  credits:        number
  cashBalance:    number
  isPremium:      boolean
  premiumExpiresAt: string | null
  isCoach:        boolean
  isVerified:     boolean
  role:           string
  friends:        string[]
  friendRequests: string[]
  notifications:  Record<string, boolean>
  privacy:        Record<string, boolean>
  dob:            string | null
  badges:         AchievementBadge[]
}

interface AuthState {
  user:      AuthUser | null
  token:     string | null
  loading:   boolean            // true while checking localStorage on mount
  error:     string | null
}

interface AuthContextValue extends AuthState {
  login:    (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, dob: string) => Promise<void>
  logout:   () => Promise<void>
  refresh:  () => Promise<void>   // re-fetch /auth/me and update user
  clearError: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:    null,
    token:   null,
    loading: true,
    error:   null,
  })

  // On mount — restore the session from the HttpOnly cookie (falling back to a
  // legacy bearer token if one is still present). /auth/me returns 401 when there
  // is no valid session, in which case we render as logged out.
  useEffect(() => {
    authApi.me()
      .then(res => setState({ user: res.user, token: localStorage.getItem('ce_token'), loading: false, error: null }))
      .catch(() => {
        localStorage.removeItem('ce_token')
        setState({ user: null, token: null, loading: false, error: null })
      })
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const { accessToken, user } = await authApi.login({ identifier, password })
      localStorage.setItem('ce_token', accessToken)
      setState({ user, token: accessToken, loading: false, error: null })
      trackEvent('login', { method: 'email' })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed'
      setState(s => ({ ...s, loading: false, error: message }))
      throw err
    }
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (username: string, email: string, password: string, dob: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      await authApi.register({ username, email, password, dob })
      setState(s => ({ ...s, loading: false }))
      trackEvent('sign_up', { method: 'email' })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed'
      setState(s => ({ ...s, loading: false, error: message }))
      throw err
    }
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout() // invalidate the server session + revoke the token
    } catch {
      // Even if the request fails, clear local state below.
    }
    localStorage.removeItem('ce_token')
    setState({ user: null, token: null, loading: false, error: null })
    trackEvent('logout')
  }, [])

  // ── Refresh user data ─────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const res = await authApi.me()
      setState(s => ({ ...s, user: res.user }))
    } catch {
      // Silent fail — if this errors the token is bad, log out
      logout()
    }
  }, [logout])

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refresh, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ─── Convenience hooks ────────────────────────────────────────────────────────

/** Returns the logged-in user or null. Does NOT throw. */
export function useUser(): AuthUser | null {
  return useAuth().user
}

/** Returns true if a user is logged in. */
export function useIsLoggedIn(): boolean {
  return useAuth().user !== null
}

/** Throws if not logged in. Use inside protected pages. */
export function useRequireAuth(): AuthUser {
  const { user, loading } = useAuth()
  if (!loading && !user) {
    if (typeof window !== 'undefined') window.location.href = '/login'
  }
  return user!
}