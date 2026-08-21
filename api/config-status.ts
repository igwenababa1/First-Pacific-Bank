import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasTwilio = !!(process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_ACCOUNT_SID);
  const hasSimboss = !!process.env.SIMBOSS_API_KEY;
  const hasBankData = !!process.env.BANK_DATA_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  return res.status(200).json({
    hasResendKey: hasResend,
    resendDomain: "resend.dev (Sandbox domain: onboarding@resend.dev)",
    hasTwilioKey: hasTwilio,
    hasSimbossKey: hasSimboss,
    hasBankDataKey: hasBankData,
    hasGeminiKey: hasGemini,
    platform: "vercel"
  });
}
