
export interface RoutingNumberInfo {
  routingNumber: string;
  bankName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

const API_HOST = 'bank-codes.p.rapidapi.com';
const API_KEY = 'e365443ed2mshc3a2db9397edd19p10e3aajsn7308d1455835';

// Simple in-memory cache to prevent redundant lookups
const ROUTING_CACHE = new Map<string, RoutingNumberInfo>();

export const lookupRoutingNumber = async (routingNumber: string): Promise<RoutingNumberInfo | null> => {
    // Basic validation: Must be exactly 9 digits
    const cleanNumber = routingNumber.replace(/\D/g, '');
    if (!/^\d{9}$/.test(cleanNumber)) return null;

    // Check Cache
    if (ROUTING_CACHE.has(cleanNumber)) {
        return ROUTING_CACHE.get(cleanNumber) || null;
    }

    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
             throw new Error("Offline");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

        const response = await fetch(`/api/banking/routing/${cleanNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Fallback for specific demo numbers if API quota exceeded or error
            if (cleanNumber === '121000248') {
                 const fallback = {
                     routingNumber: cleanNumber,
                     bankName: "WELLS FARGO BANK, N.A.",
                     city: "SAN FRANCISCO",
                     state: "CA",
                     zip: "94104"
                 };
                 ROUTING_CACHE.set(cleanNumber, fallback);
                 return fallback;
            }
             if (cleanNumber === '021000021') {
                 const fallback = {
                     routingNumber: cleanNumber,
                     bankName: "JPMORGAN CHASE BANK, N.A.",
                     city: "NEW YORK",
                     state: "NY",
                     zip: "10017"
                 };
                 ROUTING_CACHE.set(cleanNumber, fallback);
                 return fallback;
            }
            throw new Error(`API Error ${response.status}`);
        }

        const data = await response.json();
        
        // Map API response to our interface
        if (data && data.data && data.data.length > 0) {
             const resultData = data.data[0];
             const result: RoutingNumberInfo = {
                routingNumber: cleanNumber,
                bankName: resultData.bank_name || resultData.name,
                address: resultData.street || resultData.address,
                city: resultData.city,
                state: resultData.state,
                zip: resultData.zip
            };
            ROUTING_CACHE.set(cleanNumber, result);
            return result;
        } else if (data && (data.customer_name || data.name || data.bank_name)) {
             const result: RoutingNumberInfo = {
                routingNumber: data.routing_number || cleanNumber,
                bankName: data.bank_name || data.customer_name || data.name,
                address: data.address,
                city: data.city,
                state: data.state,
                zip: data.zip,
                phone: data.telephone
            };
            ROUTING_CACHE.set(cleanNumber, result);
            return result;
        }

        return null;

    } catch (error) {
        console.warn("[RoutingService] Lookup failed or offline:", error);
        
        // Robust Fallback Map for Demo Continuity
        const knownBanks: Record<string, any> = {
            '021000021': { name: 'JPMORGAN CHASE BANK, N.A.', city: 'NEW YORK', state: 'NY' },
            '121000358': { name: 'BANK OF AMERICA, N.A.', city: 'SAN FRANCISCO', state: 'CA' },
            '122000043': { name: 'CITIBANK, N.A.', city: 'LAS VEGAS', state: 'NV' },
            '121000248': { name: 'WELLS FARGO BANK, N.A.', city: 'SAN FRANCISCO', state: 'CA' },
            '325070760': { name: 'CAPITAL ONE, N.A.', city: 'MCLEAN', state: 'VA' },
            '063100277': { name: 'TRUIST BANK', city: 'CHARLOTTE', state: 'NC' }
        };
        
        if (knownBanks[cleanNumber]) {
            const fallback = {
                routingNumber: cleanNumber,
                bankName: knownBanks[cleanNumber].name,
                city: knownBanks[cleanNumber].city,
                state: knownBanks[cleanNumber].state,
                zip: '00000'
            };
            ROUTING_CACHE.set(cleanNumber, fallback);
            return fallback;
        }
        
        return null;
    }
};
