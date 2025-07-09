// Phone utility functions for normalization and validation

/**
 * Normalize an Israeli phone number to +972 format
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '')

  // Convert Israeli format to +972 format
  if (normalized.startsWith('0')) {
    normalized = '972' + normalized.substring(1)
  } else if (!normalized.startsWith('972')) {
    normalized = '972' + normalized
  }

  return '+' + normalized
}

/**
 * Validate if a phone number is a valid Israeli number in +972 format
 */
export function isValidIsraeliPhone(phone: string): boolean {
  const phoneRegex = /^\+972([23489]|5[012345689]|77)[0-9]{7}$/
  return phoneRegex.test(phone)
} 