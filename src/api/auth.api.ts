import { remult } from 'remult'
import type { User, SendOTPParams, VerifyOTPParams } from '../types/auth.types'

const API_ENDPOINTS = {
  current: '/api/auth/current',
  logout: '/api/auth/logout',
  sendOtp: '/api/auth/sendOtp',
  verifyOtp: '/api/auth/verifyOtp',
} as const

// Helper function for making authenticated requests
const fetchWithCredentials = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

// Auth API functions
export const getCurrentUser = async (): Promise<{ user: User | null }> => {
  const { data } = await fetchWithCredentials<{ data: { user: User | null } }>(
    API_ENDPOINTS.current,
    {
      method: 'POST',
      body: JSON.stringify({ args: [] }),
    }
  )
  
  // Sync with remult
  remult.user = data.user || undefined
  
  return data
}

export const logout = async (): Promise<void> => {
  await fetchWithCredentials(API_ENDPOINTS.logout, {
    method: 'POST',
    body: JSON.stringify({ args: [] }),
  })
  
  // Clear remult user
  remult.user = undefined
}

export const sendOTP = async ({ phone, type }: SendOTPParams): Promise<any> => {
  return fetchWithCredentials(API_ENDPOINTS.sendOtp, {
    method: 'POST',
    body: JSON.stringify({ args: [phone, type] }),
  })
}

export const verifyOTP = async ({ phone, code, type }: VerifyOTPParams): Promise<{ user?: User }> => {
  return fetchWithCredentials(API_ENDPOINTS.verifyOtp, {
    method: 'POST',
    body: JSON.stringify({ args: [phone, code, type] }),
  })
}

// Export as a namespace-like object for backward compatibility
export const authAPI = {
  getCurrentUser,
  logout,
  sendOTP,
  verifyOTP,
}

// Alternative: You can also export individual functions and use them directly
// import { getCurrentUser, logout, sendOTP, verifyOTP } from './auth.api'