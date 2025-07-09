// General validation and masking utilities

/**
 * Validate if an email address is in a valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Mask a phone number, showing only the last 4 digits
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone
  return phone.substring(0, phone.length - 4) + '****'
} 