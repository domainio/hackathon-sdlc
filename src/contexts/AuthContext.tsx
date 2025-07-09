import { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { AuthState } from '../types/auth.types'

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>
  sendOTP: (phone: string, type: 'login' | 'register') => Promise<any>
  verifyOTP: (phone: string, code: string, type: 'login' | 'register') => Promise<any>
  fetchCurrentUser: () => void
  isSendingOTP: boolean
  isVerifyingOTP: boolean
  isLoggingOut: boolean
  sendOTPError: Error | null
  verifyOTPError: Error | null
  logoutError: Error | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}