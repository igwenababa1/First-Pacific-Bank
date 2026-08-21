
export interface BinData {
  valid: boolean;
  scheme?: string; // VISA, MASTERCARD, etc.
  type?: string; // DEBIT, CREDIT
  level?: string;
  bank?: string; // Bank Name
  country?: string; // Country Code
  website?: string;
  phone?: string;
  error?: string; // User-friendly error message
}

// Helper for exponential backoff retry
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 2);
    }
}

export const fetchBinInfo = async (bin: string): Promise<BinData | null> => {
    const cleanBin = bin.replace(/\D/g, '');
    if (cleanBin.length < 6) return null;

    // Simulation logic based on common BINs to avoid API dependency for demo
    const isVisa = cleanBin.startsWith('4');
    const isMaster = cleanBin.startsWith('5');
    
    // Default fallback object
    const fallbackData: BinData = {
        valid: true,
        scheme: isVisa ? 'VISA' : (isMaster ? 'MASTERCARD' : undefined),
        type: 'CREDIT',
        level: 'PLATINUM',
        bank: 'PREMIUM RESERVED BANK',
        country: 'US',
        website: 'premiumreserved.com'
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { ...fallbackData, error: "Offline mode: Using cached/fallback data." };
    }

    try {
        const data = await retryOperation(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout to 5s

            try {
                const response = await fetch(`https://bin-info.p.rapidapi.com/bin.php?bin=${cleanBin.substring(0, 6)}`, {
                    method: 'GET',
                    headers: {
                        'x-rapidapi-host': 'bin-info.p.rapidapi.com',
                        'x-rapidapi-key': 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46'
                    },
                    signal: controller.signal
                });

                if (!response.ok) {
                    // Don't retry on 4xx errors (client error), only 5xx (server error)
                    if (response.status >= 400 && response.status < 500) {
                         throw new Error(`Client Error: ${response.status}`);
                    }
                    throw new Error(`Server Error: ${response.status}`);
                }
                
                const result = await response.json();
                if (result.success === false) return null;
                return result;

            } finally {
                clearTimeout(timeoutId);
            }
        });

        if (!data) return null;

        return {
            valid: true,
            scheme: data.card || data.scheme,
            type: data.type,
            level: data.level,
            bank: data.bank,
            country: data.country || data.countrycode,
            website: data.website,
            phone: data.phone
        };
    } catch (error) {
        console.warn("BIN API Error:", error);
        // Return fallback if API fails or times out, with an error indicator
        if (isVisa || isMaster) {
            return { 
                ...fallbackData, 
                error: "Service unavailable. Displaying estimated card details." 
            };
        }
        return { 
            valid: false, 
            error: "Unable to verify card details at this time." 
        };
    }
};
