import { randomBytes } from 'crypto'
import { User } from '../../shared/entities/User.js'
import { AuditEvent } from '../../shared/entities/AuditEvent.js'
import { remult } from 'remult'

export interface OTPSession {
  phone: string
  code: string
  expiresAt: Date
  firstName?: string
  lastName?: string
  nationalId?: string
}

// In production, this would be stored in Redis
const otpSessions = new Map<string, OTPSession>()

export class AuthService {
  static generateOTP(): string {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static async sendOTP(phone: string, firstName?: string, lastName?: string): Promise<void> {
    // Remove any existing OTP for this phone
    const existingKey = Array.from(otpSessions.keys()).find(key => 
      otpSessions.get(key)?.phone === phone
    )
    if (existingKey) {
      otpSessions.delete(existingKey)
    }

    const code = this.generateOTP()
    const sessionId = randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 60000) // 60 seconds

    otpSessions.set(sessionId, {
      phone,
      code,
      expiresAt,
      firstName,
      lastName
    })

    // TODO: Integrate with Twilio to send actual SMS
    console.log(`OTP for ${phone}: ${code} (expires in 60 seconds)`)

    // Create audit event
    await remult.repo(AuditEvent).insert({
      type: 'AUTH',
      status: 'success',
      triggeredBy: 'system',
      metadata: { phone, action: 'otp_sent' }
    })
  }

  static async verifyOTP(phone: string, code: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const sessionEntry = Array.from(otpSessions.entries()).find(([_, session]) => 
      session.phone === phone
    )

    if (!sessionEntry) {
      await remult.repo(AuditEvent).insert({
        type: 'AUTH',
        status: 'error',
        triggeredBy: 'system',
        metadata: { phone, action: 'otp_verify_failed', reason: 'no_session' }
      })
      return { success: false, error: 'No OTP session found' }
    }

    const [sessionId, session] = sessionEntry

    if (session.expiresAt < new Date()) {
      otpSessions.delete(sessionId)
      await remult.repo(AuditEvent).insert({
        type: 'AUTH',
        status: 'error',
        triggeredBy: 'system',
        metadata: { phone, action: 'otp_verify_failed', reason: 'expired' }
      })
      return { success: false, error: 'OTP expired' }
    }

    if (session.code !== code) {
      await remult.repo(AuditEvent).insert({
        type: 'AUTH',
        status: 'error',
        triggeredBy: 'system',
        metadata: { phone, action: 'otp_verify_failed', reason: 'invalid_code' }
      })
      return { success: false, error: 'Invalid OTP' }
    }

    await remult.repo(AuditEvent).insert({
      type: 'AUTH',
      status: 'success',
      triggeredBy: 'system',
      metadata: { phone, action: 'otp_verified' }
    })

    return { success: true, sessionId }
  }

  static getOTPSession(sessionId: string): OTPSession | undefined {
    return otpSessions.get(sessionId)
  }

  static clearOTPSession(sessionId: string): void {
    otpSessions.delete(sessionId)
  }

  static async findOrCreateUser(phone: string, firstName: string, lastName: string): Promise<User> {
    const existingUser = await remult.repo(User).findFirst({ phone })
    
    if (existingUser) {
      // Update last login
      return await remult.repo(User).save({
        ...existingUser,
        lastLogin: new Date()
      })
    }

    // Create new user
    return await remult.repo(User).insert({
      firstName,
      lastName,
      phone,
      email: '', // Will be filled later
      nationalId: '', // Will be filled during DocuSign flow
      language: 'he'
    })
  }
} 