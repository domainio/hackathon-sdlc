import { BackendMethod, remult } from 'remult'
import { AuthService } from '../services/AuthService.js'

export class AuthController {
  @BackendMethod({ allowed: true }) // Public endpoint
  static async sendOTP(phone: string, firstName?: string, lastName?: string) {
    // Validate phone number format
    if (!phone || phone.length < 10) {
      throw new Error('Invalid phone number')
    }

    // Validate name fields if provided
    if (firstName && (firstName.length < 2 || firstName.length > 50)) {
      throw new Error('First name must be between 2 and 50 characters')
    }

    if (lastName && (lastName.length < 2 || lastName.length > 50)) {
      throw new Error('Last name must be between 2 and 50 characters')
    }

    await AuthService.sendOTP(phone, firstName, lastName)
    
    return { 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 60 // seconds
    }
  }

  @BackendMethod({ allowed: true }) // Public endpoint
  static async verifyOTP(phone: string, code: string) {
    if (!phone || !code) {
      throw new Error('Phone and code are required')
    }

    const result = await AuthService.verifyOTP(phone, code)
    
    if (!result.success) {
      throw new Error(result.error || 'OTP verification failed')
    }

    const session = AuthService.getOTPSession(result.sessionId!)
    if (!session) {
      throw new Error('Session not found')
    }

    // Check if user exists or needs to be created
    let user = null
    if (session.firstName && session.lastName) {
      user = await AuthService.findOrCreateUser(phone, session.firstName, session.lastName)
    }

    // Clear the OTP session
    AuthService.clearOTPSession(result.sessionId!)

    return {
      success: true,
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        language: user.language,
        needsOnboarding: !user.nationalId || !user.email
      } : null,
      needsRegistration: !user
    }
  }

  @BackendMethod({ allowed: true, apiPrefix: "auth"})
  static async current() {
    // This will be implemented with proper session management
    // For now, return null (not authenticated)
    return null
  }

  @BackendMethod({ allowed: true })
  static async logout() {
    // This will be implemented with proper session management
    return { success: true }
  }
} 