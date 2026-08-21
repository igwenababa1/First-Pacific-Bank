export interface BankCodeInfo {
  routingNumber: string;
  bankName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

const BANK_CODE_CACHE = new Map<string, BankCodeInfo>();

export const lookupBankCode = async (routingNumber: string): Promise<BankCodeInfo | null> => {
    if (!routingNumber) return null;
    const cleanNumber = routingNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 9) return null;

    if (BANK_CODE_CACHE.has(cleanNumber)) {
        return BANK_CODE_CACHE.get(cleanNumber) || null;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); 

        const response = await fetch(`/api/banking/bankcode/${cleanNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[BankCodes API] HTTP error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
             const resultData = data.data[0];
             const result: BankCodeInfo = {
                routingNumber: cleanNumber,
                bankName: resultData.bank_name || resultData.name,
                address: resultData.street || resultData.address,
                city: resultData.city,
                state: resultData.state,
                zip: resultData.zip
            };
            BANK_CODE_CACHE.set(cleanNumber, result);
            return result;
        } else if (data && (data.customer_name || data.name || data.bank_name)) {
             const result: BankCodeInfo = {
                routingNumber: data.routing_number || cleanNumber,
                bankName: data.bank_name || data.customer_name || data.name,
                address: data.address || data.street,
                city: data.city,
                state: data.state,
                zip: data.zip
            };
            BANK_CODE_CACHE.set(cleanNumber, result);
            return result;
        }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            console.warn(`[BankCodes API] Request timeout for ${cleanNumber}`);
        } else {
            console.warn(`[BankCodes API] Lookup failed: ${err.message}`);
        }
    }
    
    return null;
}

export const RoutingLookup = lookupBankCode;

