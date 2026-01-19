// Phone validation composable for Russian phone numbers

export interface PhoneValidationResult {
  isValid: boolean
  formatted: string
  error?: string
}

/**
 * Validate and format Russian phone number
 * Supports formats:
 * - +7 (900) 123-45-67
 * - 8 (900) 123-45-67
 * - 9001234567
 * - +79001234567
 */
export function usePhoneValidation() {
  /**
   * Clean phone number - remove all non-digit characters except +
   */
  const cleanPhone = (phone: string): string => {
    return phone.replace(/[^\d+]/g, '')
  }

  /**
   * Format phone number to +7 (XXX) XXX-XX-XX
   */
  const formatPhone = (phone: string): string => {
    const cleaned = cleanPhone(phone)
    
    // Remove leading 8 and replace with +7
    let digits = cleaned.replace(/^8/, '7').replace(/^\+/, '')
    
    // If starts with 7, keep it, otherwise add 7
    if (!digits.startsWith('7')) {
      digits = '7' + digits
    }
    
    // Remove leading + if present in digits
    digits = digits.replace(/^\+/, '')
    
    // Extract parts
    const country = digits.slice(0, 1) // 7
    const area = digits.slice(1, 4) // 900
    const part1 = digits.slice(4, 7) // 123
    const part2 = digits.slice(7, 9) // 45
    const part3 = digits.slice(9, 11) // 67
    
    // Format if we have enough digits
    if (digits.length >= 11) {
      return `+${country} (${area}) ${part1}-${part2}-${part3}`
    } else if (digits.length >= 4) {
      // Partial formatting
      return `+${country} (${area}) ${part1}${part2 ? '-' + part2 : ''}${part3 ? '-' + part3 : ''}`
    }
    
    return `+${digits}`
  }

  /**
   * Validate Russian phone number
   */
  const validatePhone = (phone: string): PhoneValidationResult => {
    if (!phone || phone.trim().length === 0) {
      return {
        isValid: false,
        formatted: '',
        error: 'Телефон обязателен для связи'
      }
    }

    const cleaned = cleanPhone(phone)
    
    // Remove leading 8 and replace with 7
    let digits = cleaned.replace(/^8/, '7').replace(/^\+/, '')
    
    // If doesn't start with 7, add it
    if (!digits.startsWith('7')) {
      digits = '7' + digits
    }
    
    // Russian phone number should be 11 digits (7 + 10 digits)
    if (digits.length !== 11) {
      return {
        isValid: false,
        formatted: formatPhone(phone),
        error: 'Некорректный формат телефона. Используйте формат: +7 (900) 123-45-67'
      }
    }
    
    // Check if area code is valid (should start with 3, 4, 5, 6, 7, 8, 9)
    const areaCode = digits.slice(1, 4)
    const firstDigit = areaCode[0]
    
    if (!['3', '4', '5', '6', '7', '8', '9'].includes(firstDigit)) {
      return {
        isValid: false,
        formatted: formatPhone(phone),
        error: 'Некорректный код оператора'
      }
    }
    
    return {
      isValid: true,
      formatted: formatPhone(phone)
    }
  }

  /**
   * Normalize phone to E.164 format (+7XXXXXXXXXX)
   */
  const normalizePhone = (phone: string): string => {
    const cleaned = cleanPhone(phone)
    let digits = cleaned.replace(/^8/, '7').replace(/^\+/, '')
    
    if (!digits.startsWith('7')) {
      digits = '7' + digits
    }
    
    return '+' + digits
  }

  return {
    validatePhone,
    formatPhone,
    normalizePhone,
    cleanPhone
  }
}
