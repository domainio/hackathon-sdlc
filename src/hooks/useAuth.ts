import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { remult } from 'remult'
import { AuthController } from '../server/controllers/AuthController.js'

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
    queryFn: () => AuthController.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async ({ phone, firstName, lastName }: { 
      phone: string 
      firstName?: string 
      lastName?: string 
    }) => {
      return await AuthController.sendOTP(phone, firstName, lastName)
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
      return await AuthController.verifyOTP(phone, code)
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
    mutationFn: () => AuthController.logout(),
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