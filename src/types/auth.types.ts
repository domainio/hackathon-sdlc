export interface User {
    id: string
    name: string
    phone: string
    language: 'he' | 'en'
    needsOnboarding: boolean
  }
  
  export interface AuthState {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
  }
  
  export type AuthType = 'login' | 'register'
  
  export interface SendOTPParams {
    phone: string
    type: AuthType
  }
  
  export interface VerifyOTPParams extends SendOTPParams {
    code: string
  }
  