import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, subject, htmlBody, attachments } = req.body;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.warn('[VERCEL] Email Warning: RESEND_API_KEY is not configured. Email will not be delivered.');
        return res.status(200).json({ success: true, messageId: 'simulated_id', status: 'simulated' });
    }

    try {
        console.log(`[VERCEL] Sending Email to ${to}`);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: (() => {
                    const rawFrom = process.env.RESEND_FROM_EMAIL || "info@firstpaba.com";
                    if (rawFrom.includes('<')) {
                        const match = rawFrom.match(/<([^>]+)>/);
                        if (match && match[1]) {
                            return `First Pacific Bank <${match[1]}>`;
                        }
                        const emailOnly = rawFrom.substring(rawFrom.indexOf('<') + 1).replace('>', '').trim();
                        return `First Pacific Bank <${emailOnly}>`;
                    }
                    return `First Pacific Bank <${rawFrom.trim()}>`;
                })(),
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: htmlBody,
                attachments: attachments
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('[VERCEL] Email API Error:', response.status, errorText);
            
            // if unverified domain:
            if (errorText.includes('validation_error')) {
                return res.status(response.status).json({ 
                    success: false, 
                    error: `Resend Error: Domain not verified. You must verify firstpaba.com in your Resend account, or use onboarding@resend.dev.`, 
                    details: errorText 
                });
            }
            
            return res.status(response.status).json({ success: false, error: `Email Error: ${response.statusText}`, details: errorText });
        }

        const data = await response.json();
        console.log(`[VERCEL] Email Sent Successfully. ID: ${data.id}`);
        return res.status(200).json({ success: true, messageId: data.id });
    } catch (error: any) {
        console.error('[VERCEL] Email Exception:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
    }
}
