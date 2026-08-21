
export interface BankValidationResult {
  valid: boolean;
  bankName?: string;
  city?: string;
  bic?: string;
  message?: string;
}

export const checkBlzCode = async (blzCode: string, countryCode: string): Promise<BankValidationResult | null> => {
  // Simple pre-validation: BLZ is typically 8 digits for DE
  const cleanCode = blzCode.replace(/\s/g, '');
  if (!/^\d+$/.test(cleanCode) || cleanCode.length < 5) return null;

  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("Offline");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://bank-iban-swift-api.p.rapidapi.com/CheckBlzCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'bank-iban-swift-api.p.rapidapi.com',
        'x-rapidapi-key': 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46'
      },
      body: JSON.stringify({
        blz_code: cleanCode,
        country_code: countryCode
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        return null;
    }
    
    const data = await response.json();
    
    if (data.error || data.message === 'Not found') return null;

    return {
        valid: true,
        bankName: data.bank_name || data.name || data.short_name,
        city: data.city || data.ort || data.location,
        bic: data.bic || data.swift,
        message: 'Bank verified successfully'
    };
  } catch (e) {
    // Fallback for demo purposes if API fails
    if (countryCode === 'DE' && cleanCode === '10070000') {
        return {
            valid: true,
            bankName: 'Deutsche Bank AG',
            city: 'Berlin',
            bic: 'DEUTDEBBXXX',
            message: 'Bank verified (Offline Mode)'
        };
    }
    return null;
  }
};
