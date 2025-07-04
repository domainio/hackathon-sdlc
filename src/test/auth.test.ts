import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../server/services/AuthService.js'

// Mock Remult
vi.mock('remult', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    remult: {
      repo: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue({})
      }))
    }
  }
})

describe('AuthService', () => {
  beforeEach(() => {
    // Clear any existing OTP sessions before each test
    const otpSessions = (AuthService as any).otpSessions
    if (otpSessions) {
      otpSessions.clear()
    }
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = AuthService.generateOTP()
      expect(otp).toMatch(/^\d{6}$/)
      expect(otp.length).toBe(6)
    })

    it('should generate different OTPs on multiple calls', () => {
      const otp1 = AuthService.generateOTP()
      const otp2 = AuthService.generateOTP()
      // While there's a small chance they could be the same, it's very unlikely
      expect(otp1).not.toBe(otp2)
    })
  })

  describe('OTP flow', () => {
    const testPhone = '+1234567890'
    const testFirstName = 'John'
    const testLastName = 'Doe'

    it('should send OTP and store session', async () => {
      await AuthService.sendOTP(testPhone, testFirstName, testLastName)
      
      // Since we can't easily access the internal sessions map,
      // we'll test by trying to verify with a dummy code
      const result = await AuthService.verifyOTP(testPhone, '000000')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid OTP')
    })

    it('should verify valid OTP', async () => {
      // Mock console.log to capture the OTP
      const originalLog = console.log
      let capturedOTP = ''
      console.log = (message: string) => {
        const match = message.match(/OTP for .+: (\d{6})/)
        if (match) {
          capturedOTP = match[1]
        }
      }

      await AuthService.sendOTP(testPhone, testFirstName, testLastName)
      
      // Restore console.log
      console.log = originalLog

      expect(capturedOTP).toMatch(/^\d{6}$/)
      
      const result = await AuthService.verifyOTP(testPhone, capturedOTP)
      expect(result.success).toBe(true)
      expect(result.sessionId).toBeDefined()
    })

    it('should reject invalid OTP', async () => {
      await AuthService.sendOTP(testPhone, testFirstName, testLastName)
      
      const result = await AuthService.verifyOTP(testPhone, '000000')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid OTP')
    })

    it('should reject OTP for non-existent session', async () => {
      const result = await AuthService.verifyOTP('invalid-phone', '123456')
      expect(result.success).toBe(false)
      expect(result.error).toBe('No OTP session found')
    })
  })
}) 