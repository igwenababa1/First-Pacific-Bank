import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, body } = req.body || {};
  if (!to || !body) {
    return res.status(400).json({ success: false, error: 'Missing required parameters: to, body' });
  }

  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('[VERCEL] Twilio is not configured. Simulating SMS dispatch.');
    return res.status(200).json({
      success: true,
      simulated: true,
      message: 'Simulated SMS dispatch (Twilio credentials not configured in Vercel environment)'
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', TWILIO_FROM_NUMBER);
    params.append('Body', body);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data.message || 'Twilio Error', details: data });
    }

    return res.status(200).json({ success: true, sid: data.sid, status: data.status });
  } catch (err: any) {
    console.error('[VERCEL] SMS Send Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
  }
}
