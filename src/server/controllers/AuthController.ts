import { Allow, BackendMethod, remult, type UserInfo } from 'remult'
import { User } from '../../shared/entities/User.js'
import { sessionUtils } from '../config/session.js'
import { normalizePhone, isValidIsraeliPhone } from '../utils/phoneUtils.js'
import { isValidEmail, maskPhone } from '../utils/validationUtils.js'
import { generateOtp, sendSms } from '../utils/otpUtils.js'

import type express from 'express'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type from 'cookie-session' // required to access the session member of the request object

declare module 'express' {
  interface Request {
    session?: {
      user?: UserInfo;
      [key: string]: any;
    };
  }
}

declare module 'remult' {
  export interface RemultContext {
    request?: express.Request
  }
}

// Types for requests and responses
export interface SendOtpRequest {
  phone: string
  type: 'login' | 'register'
}

export interface VerifyOtpRequest {
  phone: string
  otpCode: string
  type: 'login' | 'register'
  // For registration only
  firstName?: string
  lastName?: string
  email?: string
  nationalId?: string
}

export interface AuthResponse {
  success: boolean
  user?: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    phone: string
    email: string
    role: string
    isPhoneVerified: boolean
    isEmailVerified: boolean
  }
  message: string
}

export interface OtpResponse {
  success: boolean
  message: string
  expiresAt?: Date
}

export class AuthController {
  // OTP Configuration
  private static readonly OTP_LENGTH = 6
  private static readonly OTP_EXPIRY_MINUTES = 5
  private static readonly MAX_OTP_ATTEMPTS = 3
  private static readonly BLOCK_DURATION_MINUTES = 15

  /**
   * Send OTP for login or registration
   */
  @BackendMethod({ allowed: true, apiPrefix: 'auth' })
  static async sendOtp(phone: string, type: 'login' | 'register'): Promise<OtpResponse> {

    console.log('sendOtp', phone, type)
    
    if (!phone) {
      throw new Error('Phone number is required')
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone)
    
    // Validate phone format
    if (!isValidIsraeliPhone(normalizedPhone)) {
      throw new Error('Invalid Israeli phone number format')
    }

    let user = await remult.repo(User).findFirst({ phone: normalizedPhone })

    if (type === 'login') {
      // For login, user must exist and be active
      if (!user) {
        throw new Error('User not found')
      }
      if (!user.isActive) {
        throw new Error('Account is inactive. Please contact support.')
      }
    } else if (type === 'register') {
      // For registration, user must not exist
      if (user) {
        throw new Error('User already exists. Use login instead.')
      }
    }

    // Check if user is blocked from OTP attempts
    if (user && user.isOtpBlocked) {
      const timeLeft = Math.ceil((user.otpBlockedUntil!.getTime() - Date.now()) / 60000)
      throw new Error(`Too many failed attempts. Try again in ${timeLeft} minutes.`)
    }

    // Generate OTP
    const otpCode = generateOtp(AuthController.OTP_LENGTH)
    const otpExpiration = new Date(Date.now() + AuthController.OTP_EXPIRY_MINUTES * 60 * 1000)

    if (type === 'login' && user) {
      // Update existing user with OTP
      await remult.repo(User).update(user.id, {
        otpCode,
        otpExpiration,
        otpAttempts: 0
      })
    } else if (type === 'register') {
      // Create temporary user record for OTP verification
      user = await remult.repo(User).insert({
        firstName: 'TEMP',
        lastName: 'USER',
        phone: normalizedPhone,
        email: `temp_${Date.now()}@intai.local`,
        nationalId: 'TEMP',
        role: 'user',
        isActive: false, // Will be activated after successful registration
        isPhoneVerified: false,
        isEmailVerified: false,
        otpCode,
        otpExpiration,
        otpAttempts: 0
      })
    }

    // Send OTP via SMS (mock implementation - replace with real SMS service)
    await sendSms(normalizedPhone, otpCode)
    
    console.log(`OTP sent to ${normalizedPhone}: ${otpCode}`) // Remove in production

    return {
      success: true,
      message: `OTP sent to ${maskPhone(normalizedPhone)}`,
      expiresAt: otpExpiration
    }
  }

  /**
   * Verify OTP and complete login/registration
   */
  @BackendMethod({ allowed: true, apiPrefix: 'auth' })
  static async verifyOtp(phone: string, otpCode: string, type: 'login' | 'register'): Promise<AuthResponse> {
    
    if (!phone || !otpCode) {
      throw new Error('Phone number and OTP code are required')
    }

    const normalizedPhone = normalizePhone(phone)
    
    const user = await remult.repo(User).findFirst({ phone: normalizedPhone })
    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is blocked
    if (user.isOtpBlocked) {
      const timeLeft = Math.ceil((user.otpBlockedUntil!.getTime() - Date.now()) / 60000)
      throw new Error(`Too many failed attempts. Try again in ${timeLeft} minutes.`)
    }

    // Check if OTP is valid
    if (!user.isOtpValid || user.otpCode !== otpCode) {
      // Increment failed attempts
      const newAttempts = user.otpAttempts + 1
      const updateData: Partial<User> = { otpAttempts: newAttempts }
      
      // Block user if max attempts reached
      if (newAttempts >= AuthController.MAX_OTP_ATTEMPTS) {
        updateData.otpBlockedUntil = new Date(Date.now() + AuthController.BLOCK_DURATION_MINUTES * 60 * 1000)
        updateData.otpCode = undefined
        updateData.otpExpiration = undefined
      }
      
      await remult.repo(User).save({
        id: user.id,
        otpAttempts: updateData.otpAttempts,
        otpBlockedUntil: updateData.otpBlockedUntil,
        otpCode: updateData.otpCode,
        otpExpiration: updateData.otpExpiration
      })
      throw new Error('Invalid or expired OTP code')
    }

    let finalUser: User

    if (type === 'login') {
      // Clear OTP and update last login
      finalUser = await remult.repo(User).save({
        id: user.id,
        otpCode: undefined,
        otpExpiration: undefined,
        otpAttempts: 0,
        otpBlockedUntil: undefined,
        lastLogin: new Date(),
        isPhoneVerified: true
      })
    } else if (type === 'register') {
      // Validate registration data
      // if (!firstName || !lastName || !email || !nationalId) {
      //   throw new Error('First name, last name, email, and national ID are required for registration')
      // }

      // // Validate email format
      // if (!isValidEmail(email)) {
      //   throw new Error('Invalid email format')
      // }

      // Check if email already exists
      // const existingEmailUser = await remult.repo(User).findFirst({ email })
      // if (existingEmailUser && existingEmailUser.id !== user.id) {
      //   throw new Error('Email already in use')
      // }

      // Complete registration
      finalUser = await remult.repo(User).save({
        id: user.id,
        // firstName,
        // lastName,
        // email,
        // nationalId,
        isActive: true,
        isPhoneVerified: true,
        otpCode: undefined,
        otpExpiration: undefined,
        otpAttempts: 0,
        otpBlockedUntil: undefined,
        lastLogin: new Date()
      })
    } else {
      throw new Error('Invalid request type')
    }

    // Create session
    const sessionUser = {
      id: finalUser.id,
      firstName: finalUser.firstName,
      lastName: finalUser.lastName,
      fullName: finalUser.fullName,
      phone: finalUser.phone,
      email: finalUser.email,
      role: finalUser.role,
      isPhoneVerified: finalUser.isPhoneVerified,
      isEmailVerified: finalUser.isEmailVerified
    }

    remult.user = {id: finalUser.id, name: finalUser.fullName, roles: [finalUser.role]}
    remult.context.request!.session!.user = remult.user


    return {
      success: true,
      user: sessionUser,
      message: type === 'login' ? 'Login successful' : 'Registration completed successfully'
    }
  }

  /**
   * Logout user
   */
  @BackendMethod({ allowed: true, apiPrefix: 'auth' })
  static async logout(): Promise<{ success: boolean; message: string }> {
    remult.context.request!.session!['user'] = undefined
    remult.user = undefined

    return {
      success: true,
      message: 'Logout successful'
    }
  }

  /**
   * Get current authenticated user
   */
  @BackendMethod({ allowed: Allow.authenticated, apiPrefix: 'auth' })
  static async current(): Promise<{ user: any | null }> {
    const user = remult.user;
    return { user }
  }

  /**
   * Refresh session and validate user status
   */
  @BackendMethod({ allowed: true })
  static async refreshSession(req?: any): Promise<{ user: any | null }> {
    const sessionUser = req && req.session ? sessionUtils.getUser(req) : null
    
    if (!sessionUser) {
      return { user: null }
    }
    
    // Verify user still exists and is active
    const user = await remult.repo(User).findFirst({ 
      id: sessionUser.id,
      isActive: true 
    })
    
    if (!user) {
      // User no longer exists or is inactive, clear session
      if (req && req.session) {
        sessionUtils.clearUser(req)
      }
      return { user: null }
    }
    
    // Update session with fresh user data
    const freshSessionUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified
    }
    
    if (req && req.session) {
      sessionUtils.setUser(req, freshSessionUser)
    }
    
    return { user: freshSessionUser }
  }
} 