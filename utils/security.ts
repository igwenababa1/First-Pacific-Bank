
const CHAR_SETS = {
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  NUMBERS: '0123456789',
  SPECIAL: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Function to get a random character from a string
const getRandomChar = (str: string): string => {
    const random_bytes = new Uint32Array(1);
    crypto.getRandomValues(random_bytes);
    return str[random_bytes[0] % str.length];
};

interface PasswordOptions {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecial?: boolean;
}

export const generateStrongPassword = (options: PasswordOptions = {}): string => {
    const {
        length = 16, // Increased default length for "powerful" feel
        includeUppercase = true,
        includeLowercase = true,
        includeNumbers = true,
        includeSpecial = true,
    } = options;

    if (length < 8) throw new Error('Password length must be at least 8 characters.');

    const charSets: { type: keyof Omit<PasswordOptions, 'length'>; chars: string }[] = [];
    if (includeLowercase) {
        charSets.push({ type: 'includeLowercase', chars: CHAR_SETS.LOWERCASE });
    }
    if (includeUppercase) {
        charSets.push({ type: 'includeUppercase', chars: CHAR_SETS.UPPERCASE });
    }
    if (includeNumbers) {
        charSets.push({ type: 'includeNumbers', chars: CHAR_SETS.NUMBERS });
    }
    if (includeSpecial) {
        charSets.push({ type: 'includeSpecial', chars: CHAR_SETS.SPECIAL });
    }

    if (charSets.length === 0) {
        return '';
    }

    let password = '';
    charSets.forEach(set => {
        password += getRandomChar(set.chars);
    });

    const allChars = charSets.map(set => set.chars).join('');

    for (let i = password.length; i < length; i++) {
        password += getRandomChar(allChars);
    }

    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const random_bytes = new Uint32Array(1);
        crypto.getRandomValues(random_bytes);
        const j = random_bytes[0] % (i + 1);
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join('');
};

/**
 * Generates a random 4-digit PIN.
 */
export const generatePin = (): string => {
    let pin = '';
    for (let i = 0; i < 4; i++) {
        pin += getRandomChar(CHAR_SETS.NUMBERS);
    }
    return pin;
};

/**
 * Securely hashes a string using SHA-256.
 * Used for storing passwords without keeping them in plain text.
 */
export const hashString = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

/**
 * Placeholder for removed encryption logic to keep compatibility.
 */
export const encryptData = async (data: any): Promise<string> => {
   // Reverted: Complex encryption was causing stability issues.
   return JSON.stringify(data);
};

/**
 * Placeholder for removed decryption logic to keep compatibility.
 */
export const decryptData = async (base64String: string): Promise<any> => {
   // Reverted: Complex encryption was causing stability issues.
   try {
       return JSON.parse(base64String);
   } catch {
       return null;
   }
};

/**
 * Sanitizes input to prevent XSS.
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    return input
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:/gi, "");
};
