import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string, remember: boolean) => Promise<User>
  register: (payload: { username: string; email: string; password: string }) => Promise<User>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ user: User }>('/auth/me').then(r => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  const login = async (identifier: string, password: string, remember: boolean) => {
    const result = await api<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password, remember }) })
    setUser(result.user)
    return result.user
  }

  const register = async (payload: { username: string; email: string; password: string }) => {
    const result = await api<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
    setUser(result.user)
    return result.user
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => setUser(prev => prev ? { ...prev, ...updates } : prev)

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
