
import { CustomerGroup, Transaction } from '../types';

interface NotificationResult {
    success: boolean;
    error?: string;
}

// Simulated Gateway Transmission (Client-Side Only)
// In a real production app, this would hit a backend endpoint.
const transmitToGateway = async (endpoint: string, payload: any, label: string): Promise<NotificationResult> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Log the transmission for debugging purposes instead of failing a fetch
    console.log(`[SIM-COMM] ${label} | Payload delivered to virtual endpoint: ${endpoint}`, payload);
    
    // Always return success in this demo environment to prevent UI errors
    return { success: true };
};

export const triggerIdentityVerification = async (phoneNumber: string, email: string, name: string): Promise<NotificationResult> => {
    const message = "Premium Reserved Bank: Your session verification code is 903414. Do not share this code. Expires in 10 minutes.";
    
    await Promise.all([
        transmitToGateway('/api/v1/sms', { to: phoneNumber, body: message }, 'SMS_OTP'),
        transmitToGateway('/api/v1/email', { to: email, subject: 'Security: Identity Verification', body: message }, 'EMAIL_OTP')
    ]);

    window.dispatchEvent(new CustomEvent('COMM_ALERT_TRIGGERED', { 
        detail: { type: 'SECURITY', channel: 'MULTI', code: '903414' }
    }));

    return { success: true };
};

export const triggerTransactionAlert = async (phoneNumber: string, transaction: Transaction): Promise<NotificationResult> => {
    const formattedAmount = transaction.sendAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const message = `PRB Alert: ${transaction.type === 'credit' ? 'Deposit' : 'Payment'} of ${formattedAmount} recorded. Ref: ${transaction.id.slice(-6).toUpperCase()}.`;
    return transmitToGateway('/api/v1/sms', { to: phoneNumber, body: message }, 'SMS_ALERT');
};

export const transmitElectronicAdvice = async (email: string, transactionId: string): Promise<NotificationResult> => {
    return transmitToGateway('/api/v1/email', { to: email, subject: `Payment Advice: ${transactionId}`, template: 'transaction_receipt' }, 'EMAIL_ADVICE');
};
