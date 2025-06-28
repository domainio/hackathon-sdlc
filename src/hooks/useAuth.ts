import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { remult } from 'remult'

export interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  language: 'he' | 'en'
  needsOnboarding: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false
  })

  // Check current user on mount
  const { data: currentUser, isLoading: isCheckingAuth } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/current', {
          credentials: 'include'
        })
        if (response.ok) {
          return await response.json()
        }
        return null
      } catch (error) {
        console.error('Failed to get current user:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async ({ phone, firstName, lastName }: { 
      phone: string 
      firstName?: string 
      lastName?: string 
    }) => {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, firstName, lastName }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send OTP')
      }
      
      return await response.json()
    },
    onSuccess: (data) => {
      console.log('OTP sent successfully:', data)
    },
    onError: (error) => {
      console.error('Failed to send OTP:', error)
    }
  })

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to verify OTP')
      }
      
      return await response.json()
    },
    onSuccess: (data) => {
      if (data.user) {
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true
        })
      }
    },
    onError: (error) => {
      console.error('Failed to verify OTP:', error)
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to logout')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  })

  const sendOTP = useCallback((phone: string, firstName?: string, lastName?: string) => {
    return sendOTPMutation.mutateAsync({ phone, firstName, lastName })
  }, [sendOTPMutation])

  const verifyOTP = useCallback((phone: string, code: string) => {
    return verifyOTPMutation.mutateAsync({ phone, code })
  }, [verifyOTPMutation])

  const logout = useCallback(() => {
    return logoutMutation.mutateAsync()
  }, [logoutMutation])

  return {
    // State
    ...authState,
    isLoading: authState.isLoading || isCheckingAuth,
    
    // Actions
    sendOTP,
    verifyOTP,
    logout,
    
    // Mutation states
    isSendingOTP: sendOTPMutation.isPending,
    isVerifyingOTP: verifyOTPMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    
    // Errors
    sendOTPError: sendOTPMutation.error,
    verifyOTPError: verifyOTPMutation.error,
    logoutError: logoutMutation.error,
  }
} 