// OTP utilities: generation and SMS sending

/**
 * Generate a numeric OTP code of the given length (default 6)
 */
export function generateOtp(length = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * Send an OTP code via SMS (placeholder for Twilio integration)
 */
export async function sendSms(phone: string, otpCode: string): Promise<void> {
  // TODO: Integrate with Twilio or other SMS provider
  // For now, just log to console
  console.log(`SMS to ${phone}: Your IntAI verification code is: ${otpCode}`)
} 