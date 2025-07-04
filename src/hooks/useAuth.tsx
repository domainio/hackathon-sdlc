import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authAPI } from '../api/auth.api'
import type { AuthType } from '../types/auth.types'

const QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
} as const

export const  useAuth = () => {
  const queryClient = useQueryClient()

  // Fetch current user with React Query
  const { data: userData, isLoading, refetch: refetchUser } = useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: () => authAPI.getCurrentUser().then(res => {
      localStorage.setItem('user', JSON.stringify(res))
      return res

    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    retryDelay: 10000,
  })

  const user = userData?.user ?? JSON.parse(localStorage.getItem('user') || 'null')

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.currentUser, { user: null })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      localStorage.removeItem('user')
    },
  })

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: authAPI.sendOTP,
    onError: (error) => {
      console.error('Failed to send OTP:', error)
    },
  })

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: (data) => {
      if (data.user) {
        queryClient.setQueryData(QUERY_KEYS.currentUser, { user: data.user })
        queryClient.invalidateQueries({ queryKey: ['auth'] })
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    },
    onError: (error) => {
      console.error('Failed to verify OTP:', error)
    },
  })

  // Callbacks
  const logout = useCallback(() => {
    return logoutMutation.mutateAsync()
  }, [logoutMutation])

  const sendOTP = useCallback(
    (phone: string, type: AuthType) => {
      return sendOTPMutation.mutateAsync({ phone, type })
    },
    [sendOTPMutation]
  )

  const verifyOTP = useCallback(
    (phone: string, code: string, type: AuthType) => {
      return verifyOTPMutation.mutateAsync({ phone, code, type })
    },
    [verifyOTPMutation]
  )
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    fetchCurrentUser: refetchUser,
    logout,
    sendOTP,
    verifyOTP,
    isSendingOTP: sendOTPMutation.isPending,
    isVerifyingOTP: verifyOTPMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    sendOTPError: sendOTPMutation.error,
    verifyOTPError: verifyOTPMutation.error,
    logoutError: logoutMutation.error,
  }
}