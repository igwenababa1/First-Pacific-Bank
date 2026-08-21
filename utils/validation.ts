
import { COUNTRY_CALLING_CODES } from '../components/constants';
import { sanitizeInput } from './security';

/**
 * Validates a SWIFT/BIC code format.
 * A valid SWIFT/BIC is 8 or 11 characters long and follows a specific structure.
 * @param code The SWIFT/BIC code string.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateSwiftBic = (code: string): string | null => {
  if (!code) return "SWIFT/BIC is required.";
  // A SWIFT code is 8 or 11 characters: 4 letters (bank), 2 letters (country), 2 alphanumeric (location), and optionally 3 alphanumeric (branch).
  const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  if (!swiftRegex.test(code.toUpperCase())) {
    return "Invalid SWIFT/BIC. Must be 8 or 11 characters.";
  }
  return null;
};

/**
 * Validates an Account Number or IBAN format.
 * This is a basic check for length and characters.
 * @param accountNumber The account number string.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateAccountNumber = (accountNumber: string): string | null => {
  if (!accountNumber) return "Account Number/IBAN is required.";
  // Remove spaces for validation
  const sanitized = accountNumber.replace(/\s/g, '');
  // A very basic check for alphanumeric characters and a common length range for IBANs/account numbers.
  const accountRegex = /^[a-zA-Z0-9]{8,34}$/;
  if (!accountRegex.test(sanitized)) {
    return "Must be between 8 and 34 alphanumeric characters.";
  }
  return null;
};

/**
 * Performs a Luhn algorithm check for credit card number validity.
 * @param val The card number string (digits only).
 * @returns True if the number is valid, otherwise false.
 */
export const luhnCheck = (val: string): boolean => {
    if (!val || !/^\d+$/.test(val)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = val.length - 1; i >= 0; i--) {
        let digit = parseInt(val.charAt(i), 10);

        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
};

/**
 * Validates a card expiry date (MM/YY format) and ensures it's not in the past.
 * @param expiry The expiry date string.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateExpiryDate = (expiry: string): string | null => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return "Format must be MM/YY.";
    }
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (month < 1 || month > 12) {
        return "Invalid month.";
    }
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return "Card has expired.";
    }
    return null;
};

/**
 * Validates a CVC code (3 or 4 digits).
 * @param cvc The CVC string.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateCvc = (cvc: string): string | null => {
    if (!/^\d{3,4}$/.test(cvc)) {
        return "CVC must be 3 or 4 digits.";
    }
    return null;
};

/**
 * Checks a password against a set of complexity criteria.
 * @param password The password string.
 * @returns An object with boolean flags for each criterion.
 */
export const validatePassword = (password: string): {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
} => {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
};

/**
 * Validates a phone number for international formats using country calling codes.
 * @param phone The phone number string.
 * @param countryCode The ISO 3166-1 alpha-2 country code.
 * @returns An error message string if invalid, otherwise null.
 */
export const validatePhoneNumber = (phone: string, countryCode: string): string | null => {
  if (!phone.trim()) return null;

  const sanitized = phone.replace(/[\s-()]/g, '');
  
  if (countryCode === 'US') {
    // US: Expect +1 followed by exactly 10 digits
    if (!/^\+1\d{10}$/.test(sanitized)) {
      return "US numbers must start with +1 and contain exactly 10 following digits.";
    }
  } else {
    // General International: Expect + followed by 8 to 15 digits
    if (!/^\+\d{8,15}$/.test(sanitized)) {
      return "International numbers must start with + and contain 8 to 15 total digits.";
    }
  }

  return null;
};

/**
 * Strictly checks for dangerous characters used in injection attacks or bypass attempts.
 * @param input The string to validate (username, password, etc).
 * @returns True if input is safe, False if it contains restricted characters.
 */
export const validateSafeInput = (input: string): boolean => {
    if(!input) return false;
    
    // Aggressive pattern matching for known attack vectors
    // 1. Script tags
    if (/<script\b[^>]*>([\s\S]*?)<\/script>/gim.test(input)) return false;
    // 2. Event handlers
    if (/on\w+="[^"]*"/g.test(input)) return false;
    // 3. SQL Injection keywords (basic check, relying on WAF for deeper inspection)
    if (/\b(UNION|SELECT|INSERT|DELETE|DROP)\b|--|;/gi.test(input)) return false;
    // 4. File system traversal
    if (/\.\.\//.test(input)) return false;

    const sanitized = sanitizeInput(input);
    return sanitized === input; // If sanitization changed it, it was unsafe
};
