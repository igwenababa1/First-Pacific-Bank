
export interface TwilioResponse {
    success: boolean;
    message_sid?: string;
    error?: string;
    isFallback?: boolean;
}

/**
 * Institutional Twilio SMS Gateway - Production Integration
 * Coordinates with the RapidAPI node to dispatch secure banking alerts.
 */
export const sendTwilioSms = async (to: string, body: string): Promise<TwilioResponse> => {
    try {
        console.log(`[SMS_GATEWAY] Dispatching to backend for: ${to}`);

        const response = await fetch('/api/send-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, body })
        });

        const responseText = await response.text();
        let data;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error('[GATEWAY-ERROR] Failed to parse JSON response. Status:', response.status, 'Raw:', responseText);
            return { success: false, error: `Invalid Server Response: ${response.status} ${response.statusText}` };
        }

        if (!response.ok) {
            console.warn('[GATEWAY-WARN] Backend Error:', data);
            return { success: false, error: data.error || `HTTP Error: ${response.status}` };
        }

        if (!data.success) {
            console.warn('[GATEWAY-WARN] API Rejected:', data.error);
            return { success: false, error: data.error };
        }
        
        console.log('[GATEWAY-OK] SMS Sent via Backend. SID:', data.message_sid, data.isFallback ? '(FALLBACK)' : '');
        return { success: true, message_sid: data.message_sid, isFallback: data.isFallback };

    } catch (error: any) {
        // Silently intercept "Failed to fetch" to prevent console noise if backend API is temporarily offline
        // The application's local HUD dispatcher will automatically kick in via the fallback.
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             return { success: false, error: 'Network Offline - Local Fallback Engaged' };
        }
        console.warn('[GATEWAY-FAILOVER] Transmission failed:', error);
        return { success: false, error: error.message }; 
    }
};

/**
 * Institutional Twilio WhatsApp Gateway - Production Integration
 */
export const sendTwilioWhatsApp = async (to: string, body: string): Promise<TwilioResponse> => {
    try {
        console.log(`[WHATSAPP_GATEWAY] Dispatching to backend for: ${to}`);

        const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, body })
        });

        const responseText = await response.text();
        let data;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error('[GATEWAY-ERROR] Failed to parse WhatsApp JSON. Status:', response.status, 'Raw:', responseText);
            return { success: false, error: `Invalid Server Response: ${response.status} ${response.statusText}` };
        }

        if (!response.ok) {
            console.warn('[GATEWAY-WARN] WhatsApp Backend Error:', data);
            return { success: false, error: data.error || `HTTP Error: ${response.status}` };
        }

        if (!data.success) {
            console.warn('[GATEWAY-WARN] WhatsApp API Rejected:', data.error);
            return { success: false, error: data.error };
        }
        
        console.log('[GATEWAY-OK] WhatsApp message sent via Backend. SID:', data.message_sid);
        return { success: true, message_sid: data.message_sid };

    } catch (error: any) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             return { success: false, error: 'Network Offline - Local WhatsApp Fallback Engaged' };
        }
        console.warn('[GATEWAY-FAILOVER] WhatsApp transmission failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * High-Level Verification Dispatcher
 */
export const sendNumericVerification = async (phoneNumber: string): Promise<boolean> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const body = `First Pacific Bank Security: Your verification code is ${code}. For your protection, do not share this code. Expires in 10 minutes.`;
    const result = await sendTwilioSms(phoneNumber, body);
    
    // If SMS fails, we rely on the error handling in the calling function
    if (!result.success) {
        console.warn("SMS dispatch failed. Check Twilio configuration.");
    }
    
    return result.success;
};

/**
 * High-Level Verification Dispatcher for WhatsApp OTP
 */
export const sendNumericVerificationWhatsApp = async (phoneNumber: string): Promise<boolean> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const body = `*First Pacific Security Node* 🔐\n\nYour One-Time Passcode is: *${code}*\n\nIf you did not request this OTP, please log in immediately to secure your ledger accounts.`;
    const result = await sendTwilioWhatsApp(phoneNumber, body);
    
    if (!result.success) {
        console.warn("WhatsApp dispatch failed. Check Twilio Sandbox setup.");
    }
    
    return result.success;
};
