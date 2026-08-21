
import { BRANDING_CONFIG } from '../components/constants';

// --- SECURE CDN-HOSTED ASSET LIBRARY FOR HIGH-RESOLUTION LOGOS AND SEALS ---
export const SECURE_CDN_ASSETS = {
    BANK_LOGO: 'https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons@v2.0.18/src/24/solid/academic-cap.svg',
    OFFICIAL_SEAL: 'https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons@v2.0.18/src/24/solid/shield-check.svg',
    SECURITY_WATERMARK: 'https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons@v2.0.18/src/24/solid/lock-closed.svg',
    LETTERHEAD_CREST: 'https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons@v2.0.18/src/24/solid/globe-alt.svg'
};

const cdnAssetCache: Record<string, string> = {};

export const fetchCdnAsset = async (key: keyof typeof SECURE_CDN_ASSETS, fallbackSvg: string): Promise<string> => {
    const url = SECURE_CDN_ASSETS[key];
    if (cdnAssetCache[url]) {
        return cdnAssetCache[url];
    }
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout && AbortSignal.timeout(1500) });
        if (response.ok) {
            const text = await response.text();
            if (text && text.includes('<svg')) {
                // Style and cleanse the SVG
                const cleanedSvg = text
                    .replace(/class="[^"]*"/g, '')
                    .replace(/width="[^"]*"/g, '')
                    .replace(/height="[^"]*"/g, '')
                    .replace(/fill="[^"]*"/g, 'fill="currentColor"');
                cdnAssetCache[url] = cleanedSvg;
                return cleanedSvg;
            }
        }
    } catch (error) {
        console.warn(`[CDN_ASSET] Failed to fetch CDN asset [${key}]. Falling back silently`, error);
    }
    return fallbackSvg;
};

export const getCdnAssetSync = (key: keyof typeof SECURE_CDN_ASSETS, fallbackSvg: string): string => {
    const url = SECURE_CDN_ASSETS[key];
    return cdnAssetCache[url] || fallbackSvg;
};

// Start background asset fetching triggers immediately at module load time
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
    Object.keys(SECURE_CDN_ASSETS).forEach(key => {
        fetchCdnAsset(key as any, '').catch(() => {});
    });
}

export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

const RAPID_API_KEY = process.env.RAPID_API_KEY || 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46';
const EMAIL_API_HOST = 'hoolia-apps.p.rapidapi.com'; // Using a reliable email gateway from RapidAPI ecosystem

const recentlySentEmails = new Map<string, number>();
const COOLDOWN_MS = 15000; // 15 seconds cooldown

/**
 * Sends a secure, HTML-formatted email via the institutional gateway.
 */
export const sendEmail = async (to: string, subject: string, htmlBody: string, attachments?: {filename: string, content: string}[]): Promise<EmailResponse> => {
    const emailKey = `${to}:${subject}`;
    const now = Date.now();
    const lastSent = recentlySentEmails.get(emailKey);
    
    if (lastSent && now - lastSent < COOLDOWN_MS) {
        console.warn(`[EMAIL_GATEWAY] Cooldown active for ${to} on "${subject}". Preventing duplicate dispatch.`);
        return { success: true, messageId: 'cooldown-skipped', error: 'Skipped due to cooldown to prevent spam.' };
    }
    
    recentlySentEmails.set(emailKey, now);

    try {
        console.log(`[EMAIL_GATEWAY] Dispatching to backend for: ${to}`);

        let preferredLanguage = 'en';
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
            if (match) {
                preferredLanguage = match[2].split('/')[2] || 'en';
            }
        }

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, subject, htmlBody, attachments, preferredLanguage })
        });

        const responseText = await response.text();
        let data;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error('[EMAIL-GATEWAY] Failed to parse JSON response. Status:', response.status, 'Raw:', responseText);
            return { success: false, error: `Invalid Server Response: ${response.status} ${response.statusText}` };
        }

        if (!response.ok) {
            console.warn('[EMAIL-GATEWAY] Backend Error:', data);
            return { success: false, error: data.error || `HTTP Error: ${response.status}` };
        }

        if (!data.success) {
            console.warn('[EMAIL-GATEWAY] API Rejected:', data.error);
            return { success: false, error: data.error };
        }

        console.log('[EMAIL-GATEWAY] Email Sent via Backend. ID:', data.messageId);
        return { success: true, messageId: data.messageId };

    } catch (error: any) {
        console.warn('[EMAIL-GATEWAY] Network transport failed:', error);
        return { success: false, error: error.message };
    }
};

// Helper to generate dynamic cryptographic checksums to establish trust
export const generateSecurityHash = (length: number): string => {
    let result = '';
    const chars = 'abcdef0123456789';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Central logo generation function returning official First Pacific Bank logo (dynamic SVG code)
export const getLogoSvgMark = (size = 52): string => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
    <defs>
        <radialGradient id="navyBG-receipt" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="#0B1528" />
            <stop offset="70%" stop-color="#060B16" />
            <stop offset="100%" stop-color="#03060E" />
        </radialGradient>
        <linearGradient id="goldLeft-receipt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#BE9648" />
            <stop offset="30%" stop-color="#F3E5AB" />
            <stop offset="70%" stop-color="#9A7A35" />
            <stop offset="100%" stop-color="#5E481D" />
        </linearGradient>
        <linearGradient id="goldRight-receipt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF4D0" />
            <stop offset="35%" stop-color="#D4AF37" />
            <stop offset="70%" stop-color="#AA7C11" />
            <stop offset="100%" stop-color="#896008" />
        </linearGradient>
        <linearGradient id="goldCore-receipt" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#AA7C11" />
            <stop offset="50%" stop-color="#FFF4D0" />
            <stop offset="100%" stop-color="#FFFFFF" />
        </linearGradient>
        <linearGradient id="waveGold-receipt" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#AA7C11" stop-opacity="0.1" />
            <stop offset="50%" stop-color="#FFF4D0" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#AA7C11" stop-opacity="0.1" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#navyBG-receipt)" stroke="url(#goldRight-receipt)" stroke-width="1.5" />
    <circle cx="50" cy="50" r="44" stroke="url(#goldLeft-receipt)" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4" />
    <line x1="50" y1="15" x2="50" y2="85" stroke="url(#goldRight-receipt)" stroke-width="0.5" opacity="0.35" />
    <line x1="15" y1="50" x2="85" y2="50" stroke="url(#goldRight-receipt)" stroke-width="0.5" opacity="0.35" />
    <circle cx="50" cy="50" r="38" stroke="url(#goldLeft-receipt)" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.4" />
    <circle cx="50" cy="50" r="30" stroke="url(#goldRight-receipt)" stroke-width="0.75" opacity="0.25" />
    <path d="M50 20 L22 82 L50 67 Z" fill="url(#goldLeft-receipt)" />
    <path d="M50 20 L78 82 L50 67 Z" fill="url(#goldRight-receipt)" />
    <path d="M50 20 L50 67" stroke="#FFF4D0" stroke-width="1" stroke-linecap="round" opacity="0.55" />
    <path d="M50 32 L53 38 L50 44 L47 38 Z" fill="url(#goldCore-receipt)" />
    <path d="M28 78 Q39 74 50 78 T72 78" stroke="url(#waveGold-receipt)" stroke-width="1.2" fill="none" opacity="0.5" />
    <path d="M34 82 Q42 79 50 82 T66 82" stroke="url(#waveGold-receipt)" stroke-width="0.8" fill="none" opacity="0.3" />
</svg>
`;

export const getLogoModern = (size = 52): string => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
    <defs>
        <radialGradient id="modBG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1E293B" />
            <stop offset="100%" stop-color="#0F172A" />
        </radialGradient>
        <linearGradient id="goldMod" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF4D0" />
            <stop offset="100%" stop-color="#BE9648" />
        </linearGradient>
    </defs>
    <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="url(#modBG)" stroke="url(#goldMod)" stroke-width="2" />
    <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" stroke="url(#goldMod)" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.5" />
    <circle cx="50" cy="50" r="16" stroke="url(#goldMod)" stroke-width="1" />
    <path d="M50,22 L50,78 M24,50 L76,50" stroke="url(#goldMod)" stroke-width="0.5" opacity="0.3" />
    <polygon points="50,38 56,50 50,62 44,50" fill="url(#goldMod)" />
</svg>
`;

export const getLogoMinimal = (size = 52): string => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
    <circle cx="50" cy="50" r="42" stroke="#475569" stroke-width="1" />
    <circle cx="50" cy="50" r="36" stroke="#D4AF37" stroke-width="1.5" />
    <path d="M50,14 C60,14 70,25 70,50 C70,75 60,86 50,86 C40,86 30,75 30,50 C30,25 40,14 50,14 Z" stroke="#D4AF37" stroke-width="1" stroke-dasharray="3 3" opacity="0.7" />
    <line x1="18" y1="50" x2="82" y2="50" stroke="#475569" stroke-width="1" opacity="0.5" />
    <circle cx="50" cy="50" r="6" fill="#D4AF37" />
</svg>
`;

export const getLogoSvgByStyle = (style: 'classic' | 'modern' | 'minimal' = 'classic', size = 52): string => {
    // Return a pristine, 100% email-client-compatible HTML CSS Gold Emblem badge
    const mainColor = '#0b1122';
    const goldColor = '#D4AF37';
    
    if (style === 'modern') {
        return `
        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
          <tr>
            <td align="center" valign="middle">
              <div style="width: ${size}px; height: ${size}px; background-color: #0c1a30; border: 2px solid #10b981; border-radius: 8px; text-align: center; display: inline-block;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">
                  <tr>
                    <td align="center" valign="middle" style="font-family: 'Courier New', monospace; font-size: ${size * 0.38}px; font-weight: bold; color: #10b981; padding: 0; line-height: ${size}px; text-transform: uppercase;">
                      FPB
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
        `;
    }
    
    if (style === 'minimal') {
        return `
        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
          <tr>
            <td align="center" valign="middle">
              <div style="width: ${size}px; height: ${size}px; background-color: #020617; border: 1.5px solid #475569; border-radius: 50%; text-align: center; display: inline-block;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">
                  <tr>
                    <td align="center" valign="middle" style="font-family: sans-serif; font-size: ${size * 0.35}px; font-weight: bold; color: #94a3b8; padding: 0; line-height: ${size}px; text-transform: uppercase; letter-spacing: 1px;">
                      F
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
        `;
    }
    
    // Classic (Default Deep Navy Gold Crest Emblem)
    return `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
      <tr>
        <td align="center" valign="middle">
          <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background-color: ${mainColor}; border: 2px solid ${goldColor}; text-align: center; box-shadow: 0 4px 12px rgba(212,175,55,0.3); display: inline-block;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">
              <tr>
                <td align="center" valign="middle" style="font-family: 'Times New Roman', Times, serif; font-size: ${size * 0.42}px; font-weight: bold; font-style: italic; color: #FFF4D0; letter-spacing: 0.5px; padding: 0; line-height: ${size}px; text-transform: uppercase;">
                  FPB
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
    `;
};

export interface BrandOptions {
    logoStyle?: 'classic' | 'modern' | 'minimal';
    primaryColor?: string;
    borderColor?: string;
    securityBadges?: string[];
    customDisclaimer?: string;
    customIssuer?: string;
    bannerUrl?: string;
    emailTheme?: 'classic' | 'chase' | 'bofa' | 'boe';
}

/**
 * Core Standardized CSS Style Guide & Email Skeleton
 */
export interface SkeletonOptions extends BrandOptions {
    referenceId?: string;
    signHash?: string;
    checkHash?: string;
    actionText?: string;
    actionUrl?: string;
    subtitle?: string;
    isReceipt?: boolean;
}

export const resolveBankingBannerUrl = (bannerUrl?: string, theme?: string, contextText?: string): string => {
    // If a valid absolute HTTP/HTTPS URL is provided and not a placeholder or relative path, return it
    if (bannerUrl && bannerUrl.startsWith('http') && !bannerUrl.includes('placeholder')) {
        return bannerUrl;
    }

    const searchCtx = (contextText || '').toLowerCase();
    const activeTheme = (theme || 'classic').toLowerCase();

    // Specific context overrides with new high-res banking assets
    if (searchCtx.includes('atm') || searchCtx.includes('cash') || searchCtx.includes('dispense')) {
        return 'https://www.housingfinance.co.ug/wp-content/uploads/2022/11/hfb-Safety-precautions-at-the-ATM-1024x768.jpg';
    }
    if (searchCtx.includes('dubai') || searchCtx.includes('uae') || searchCtx.includes('dirham') || searchCtx.includes('aed') || searchCtx.includes('middle east')) {
        return 'https://smartzone.ae/wp-content/uploads/2026/02/Can-Foreigners-Start-a-Business-in-Dubai.jpg';
    }
    if (searchCtx.includes('corporate') || searchCtx.includes('business') || searchCtx.includes('commercial')) {
        return 'https://www.theforage.com/blog/wp-content/uploads/2023/05/what-explains-the-difference-between-retail-and-commercial-banking-1-1024x768.jpg';
    }
    if (searchCtx.includes('wire') || searchCtx.includes('swift') || searchCtx.includes('fedwire') || searchCtx.includes('interbank')) {
        return 'https://www.temenos.com/wp-content/uploads/2025/04/Temenos-digital-banking-scaled.jpg';
    }
    if (searchCtx.includes('invest') || searchCtx.includes('equity') || searchCtx.includes('security') || searchCtx.includes('portfolio')) {
        return 'https://www.investopedia.com/thmb/jkQJy7DLbDtBqS-odz8YW8vFTq8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/investmentbank-final-1bbd4ca5d3904dbba5b8b8b19d7d65b8.jpg';
    }
    if (searchCtx.includes('safe') || searchCtx.includes('fdic') || searchCtx.includes('vault') || searchCtx.includes('protection')) {
        return 'https://cms-assets.themuse.com/media/lead/is-my-money-safe-in-the-bank.png';
    }
    if (searchCtx.includes('partnership') || searchCtx.includes('joint') || searchCtx.includes('syndicate')) {
        return 'https://personal-finance.bnpparibas/app/uploads/sites/4/2024/11/starting-partnership-2023-11-27-05-27-01-utc-scaled.jpg';
    }

    // Contextual high-resolution real banking images mapping from top financial archives
    if (activeTheme === 'chase') {
        if (searchCtx.includes('credit') || searchCtx.includes('deposit') || searchCtx.includes('received') || searchCtx.includes('funding')) {
            return 'https://www.chase.com/content/services/rendition/image.large.png/unified-assets/photography/articles/primary/banking/seo_traditional_vs_online_banking_07222022.png';
        } else if (searchCtx.includes('debit') || searchCtx.includes('transfer') || searchCtx.includes('remit') || searchCtx.includes('wire') || searchCtx.includes('withdrawal')) {
            return 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop';
        } else if (searchCtx.includes('security') || searchCtx.includes('kyc') || searchCtx.includes('alert') || searchCtx.includes('login')) {
            return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop';
        }
        return 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1200&auto=format&fit=crop';
    }

    if (activeTheme === 'bofa') {
        if (searchCtx.includes('credit') || searchCtx.includes('deposit') || searchCtx.includes('received') || searchCtx.includes('funding')) {
            return 'https://images.unsplash.com/photo-1601597111158-2fceff270190?q=80&w=1200&auto=format&fit=crop';
        } else if (searchCtx.includes('debit') || searchCtx.includes('transfer') || searchCtx.includes('remit') || searchCtx.includes('wire') || searchCtx.includes('withdrawal')) {
            return 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=1200&auto=format&fit=crop';
        } else if (searchCtx.includes('security') || searchCtx.includes('kyc') || searchCtx.includes('alert')) {
            return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop';
        }
        return 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?q=80&w=1200&auto=format&fit=crop';
    }

    if (activeTheme === 'boe') {
        if (searchCtx.includes('credit') || searchCtx.includes('deposit') || searchCtx.includes('received') || searchCtx.includes('funding')) {
            return 'https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=1200&auto=format&fit=crop';
        } else if (searchCtx.includes('debit') || searchCtx.includes('transfer') || searchCtx.includes('remit') || searchCtx.includes('wire')) {
            return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop';
        }
        return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop';
    }

    // Default / Classic / Sovereign Wealth Banners by context:
    if (searchCtx.includes('cert') || searchCtx.includes('cd') || searchCtx.includes('solvency')) {
        return 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=1200&auto=format&fit=crop';
    } else if (searchCtx.includes('credit') || searchCtx.includes('deposit') || searchCtx.includes('received') || searchCtx.includes('funding')) {
        return 'https://www.chase.com/content/services/rendition/image.large.png/unified-assets/photography/articles/primary/banking/seo_traditional_vs_online_banking_07222022.png';
    } else if (searchCtx.includes('debit') || searchCtx.includes('transfer') || searchCtx.includes('remit') || searchCtx.includes('wire') || searchCtx.includes('withdrawal')) {
        return 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop';
    } else if (searchCtx.includes('loan') || searchCtx.includes('mortgage') || searchCtx.includes('facility')) {
        return 'https://www.hiscox.com/sites/default/files/styles/blog_main_image/public/images/hero/2024/banks-for-small-business.png.webp?itok=k5otwAkk';
    } else if (searchCtx.includes('security') || searchCtx.includes('kyc') || searchCtx.includes('verification') || searchCtx.includes('alert')) {
        return 'https://cms-assets.themuse.com/media/lead/is-my-money-safe-in-the-bank.png';
    } else if (searchCtx.includes('welcome') || searchCtx.includes('onboarding') || searchCtx.includes('activated')) {
        return 'https://www.datocms-assets.com/163939/1760200402-titelbild-mas-banking-finance-hwz.jpg?w=1920';
    }

    return 'https://www.datocms-assets.com/163939/1760200402-titelbild-mas-banking-finance-hwz.jpg?w=1920';
};

export const getPremiumBrandedBannerHtml = (bannerUrl: string, options?: any, maxWidth = 536, noPadding = false) => {
    const primaryColor = options?.primaryColor || '#D4AF37';
    const theme = options?.emailTheme || 'classic';
    const resolvedUrl = resolveBankingBannerUrl(bannerUrl, theme);

    const paddingStyle = noPadding ? 'padding: 0; text-align: center;' : 'padding: 20px 32px 0 32px; text-align: center; background-color: #ffffff;';
    const radiusStyle = noPadding ? 'border-top-left-radius: 24px; border-top-right-radius: 24px;' : 'border-radius: 12px;';
    const borderStyle = noPadding ? `border-bottom: 1.5px solid ${primaryColor};` : `border: 1.5px solid ${primaryColor};`;
    return `
    <div style="${paddingStyle}">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: ${maxWidth}px; margin: 0 auto; ${radiusStyle} overflow: hidden; background-color: #03060E; ${borderStyle} box-shadow: 0 4px 15px rgba(0,0,0,0.15); border-collapse: collapse;">
            <!-- Row 1: Real Inline Image Tag (guaranteed 100% visible across all email clients including Gmail & Outlook) -->
            <tr>
                <td align="center" valign="top" style="padding: 0; margin: 0; line-height: 0; background-color: #03060E;">
                    <img src="${resolvedUrl}" alt="Institutional Banking Banner" width="${maxWidth}" height="170" style="width: 100%; max-width: ${maxWidth}px; height: 170px; object-fit: cover; display: block; border: 0; outline: none;" referrerpolicy="no-referrer" />
                </td>
            </tr>
            <!-- Row 2: Sleek Dark Institutional Emblem & Verification Bar -->
            <tr>
                <td valign="middle" style="background-color: #03060E; padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td valign="middle" width="34">
                                <div style="width: 30px; height: 30px; background-color: #03060E; border-radius: 50%; border: 1.5px solid ${primaryColor}; text-align: center; line-height: 26px;">
                                    <!-- Real gold-accented First Pacific Bank Emblem -->
                                    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
                                        <polygon points="50,15 15,35 15,45 50,25 85,45 85,35" fill="${primaryColor}" />
                                        <rect x="22" y="48" width="8" height="25" fill="${primaryColor}" />
                                        <rect x="36" y="48" width="8" height="25" fill="${primaryColor}" />
                                        <rect x="56" y="48" width="8" height="25" fill="${primaryColor}" />
                                        <rect x="70" y="48" width="8" height="25" fill="${primaryColor}" />
                                        <rect x="15" y="76" width="70" height="8" fill="${primaryColor}" />
                                    </svg>
                                </div>
                            </td>
                            <td valign="middle" style="padding-left: 10px;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 1.2px; text-transform: uppercase; line-height: 1.1;">First Pacific Bank</div>
                                <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 7.5px; font-weight: 700; color: ${primaryColor}; letter-spacing: 2.2px; text-transform: uppercase; margin-top: 1px;">Institutional Asset Dispatch</div>
                            </td>
                            <td valign="middle" align="right">
                                <div style="background-color: rgba(16, 185, 129, 0.9); border: 1px solid rgba(255,255,255,0.25); padding: 4px 8px; border-radius: 5px; display: inline-block;">
                                    <span style="font-family: Arial, sans-serif; font-size: 7px; font-weight: 950; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase;">VERIFIED GENUINE</span>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `;
};

export const getStandardEmailSkeleton = (
    title: string,
    innerHtml: string,
    options?: SkeletonOptions
) => {
    const currentYear = new Date().getFullYear();
    const referenceId = options?.referenceId || 'FPB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const theme = options?.emailTheme || 'classic';

    let accentColor = options?.primaryColor || '#D4AF37';
    if (theme === 'chase') {
        accentColor = '#0060a3';
    } else if (theme === 'bofa') {
        accentColor = '#e31837';
    } else if (theme === 'boe') {
        accentColor = '#00356B';
    }

    const bannerUrl = resolveBankingBannerUrl(options?.bannerUrl, theme, title + ' ' + innerHtml);

    if (theme === 'chase') {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px 10px; -webkit-font-smoothing: antialiased; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); border: 1px solid #d1d5db; }
                .content { padding: 32px; color: #1f2937; background-color: #ffffff; }
                .content p { line-height: 1.6; font-size: 14px; color: #374151; margin-bottom: 18px; }
                .highlight-box { background-color: #f3f4f6; border-left: 4px solid #0060a3; padding: 18px; border-radius: 0 4px 4px 0; margin: 24px 0; }
                .btn { display: inline-block; background-color: #0060a3; color: #ffffff !important; padding: 12px 26px; text-decoration: none !important; border-radius: 4px; font-weight: bold; font-size: 13px; text-align: center; margin-top: 15px; }
                .links-row { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 14px 0; margin-top: 35px; text-align: center; background-color: #f9fafb; }
                .links-row a { color: #0060a3; text-decoration: none; font-size: 11px; font-weight: bold; margin: 0 10px; font-family: Arial, sans-serif; text-transform: none; letter-spacing: 0px; }
                .footer { background-color: #1e293b; padding: 32px; text-align: left; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                .footer p { font-size: 11px; line-height: 1.6; color: #9ca3af; margin: 0 0 12px 0; }
                .footer a { color: #60a5fa; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Chase Top Accent Line -->
                <div style="background-color: #0060a3; height: 6px; font-size: 0; line-height: 0;">&nbsp;</div>
                
                <!-- Chase Classic Logo Header -->
                <div style="padding: 24px 32px; text-align: left; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="left" valign="middle">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td valign="middle">
                                            <svg width="28" height="28" viewBox="0 0 100 100" style="display: block; fill: #117ec9;">
                                                <path d="M50 0 L100 50 L85 65 L50 30 L50 0 Z" fill="#117ec9" />
                                                <path d="M100 50 L50 100 L35 85 L70 50 L100 50 Z" fill="#117ec9" />
                                                <path d="M50 100 L0 50 L15 35 L50 70 L50 100 Z" fill="#117ec9" />
                                                <path d="M0 50 L50 0 L65 15 L30 50 L0 50 Z" fill="#117ec9" />
                                            </svg>
                                        </td>
                                        <td valign="middle" style="padding-left: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 21px; font-weight: bold; color: #117ec9; letter-spacing: -0.5px;">
                                            CHASE &reg;
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td align="right" valign="middle" style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">
                                Account Alert
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Crisp Banner Image -->
                ${getPremiumBrandedBannerHtml(bannerUrl, options)}

                <div class="content">
                    <div style="margin-top: 10px;">
                        ${innerHtml}
                    </div>
                    
                    ${options?.actionText ? `<div style="text-align: center; margin-top: 24px;"><a href="${options.actionUrl || '#'}" class="btn" style="color:#ffffff !important;">${options.actionText}</a></div>` : ''}
                    
                    <div class="links-row">
                        <a href="https://chase.com">Chase Online</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="https://chase.com/security">Security Center</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="https://chase.com/support">Customer Service</a>
                    </div>
                </div>

                <!-- Regulatory Footer -->
                <div class="footer">
                    <p style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #f3f4f6; text-transform: uppercase; margin-bottom: 12px;">ABOUT THIS MESSAGE</p>
                    <p>This service email was securely sent to you as an automated transaction notification in accordance with your account alert preferences. Please do not reply directly to this email.</p>
                    <p>All credit card products, depository accounts, and investment advice of JPMorgan Chase Bank, N.A. are offered subject to OCC oversight and are insured up to standard statutory FDIC limits ($250,000).</p>
                    <p>Corporate Headquarters: 270 Park Avenue, New York, NY 10017. If you suspect fraudulent activity on your account, sign in to Chase Online immediately or call Chase customer support at 1-800-935-9935.</p>
                    <div style="margin-top: 20px; border-top: 1px solid #374151; padding-top: 16px; font-size: 8px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #6b7280; text-align: center;">
                        EQUAL HOUSING LENDER &bull; MEMBER FDIC &bull; REF ID: ${referenceId} &bull; &copy; ${currentYear} JPMorgan Chase & Co.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    if (theme === 'bofa') {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px 10px; -webkit-font-smoothing: antialiased; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 0px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
                .content { padding: 32px; color: #111827; background-color: #ffffff; }
                .content p { line-height: 1.6; font-size: 14px; color: #374151; margin-bottom: 18px; }
                .highlight-box { background-color: #fef2f2; border-left: 4px solid #e31837; padding: 18px; margin: 24px 0; }
                .btn { display: inline-block; background-color: #012169; color: #ffffff !important; padding: 12px 26px; text-decoration: none !important; border-radius: 2px; font-weight: bold; font-size: 13px; text-align: center; margin-top: 15px; }
                .links-row { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 14px 0; margin-top: 35px; text-align: center; background-color: #f9fafb; }
                .links-row a { color: #012169; text-decoration: none; font-size: 11px; font-weight: bold; margin: 0 10px; font-family: Arial, sans-serif; }
                .footer { background-color: #012169; padding: 32px; text-align: left; color: #93c5fd; }
                .footer p { font-size: 11px; line-height: 1.6; color: #93c5fd; margin: 0 0 12px 0; }
                .footer a { color: #ffffff; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Bank of America Header -->
                <div style="padding: 24px 32px; background-color: #ffffff; border-bottom: 3px solid #e31837; text-align: left;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="left" valign="middle">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td valign="middle">
                                            <svg width="34" height="24" viewBox="0 0 40 28" style="display: inline-block; vertical-align: middle;">
                                                <rect x="0" y="2" width="16" height="5" fill="#012169" />
                                                <rect x="19" y="2" width="21" height="5" fill="#012169" />
                                                <rect x="0" y="10" width="16" height="5" fill="#E31837" />
                                                <rect x="19" y="10" width="21" height="5" fill="#E31837" />
                                                <rect x="0" y="18" width="40" height="5" fill="#012169" />
                                            </svg>
                                        </td>
                                        <td valign="middle" style="padding-left: 10px; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #012169; letter-spacing: -0.5px;">
                                            Bank of America
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td align="right" valign="middle" style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                Security Notification
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Crisp Banner Image -->
                ${getPremiumBrandedBannerHtml(bannerUrl, options)}

                <div class="content">
                    <div style="margin-top: 10px;">
                        ${innerHtml}
                    </div>
                    
                    ${options?.actionText ? `<div style="text-align: center; margin-top: 24px;"><a href="${options.actionUrl || '#'}" class="btn" style="color:#ffffff !important;">${options.actionText}</a></div>` : ''}
                    
                    <div class="links-row">
                        <a href="https://bankofamerica.com">BofA Online Banking</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="https://bankofamerica.com/security">Privacy & Security</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="https://bankofamerica.com/contact">Contact Us</a>
                    </div>
                </div>

                <!-- BofA Footnote -->
                <div class="footer">
                    <p style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin-bottom: 12px;">IMPORTANT PRIVACY AND SECURITY MESSAGE</p>
                    <p>This email alert is an automated correspondence dispatched in accordance with your BofA security and transaction preference triggers. To ensure secure mail delivery, we utilize standard TLS encryption protocols.</p>
                    <p>Depository deposits, savings options, and lending products are offered by Bank of America, N.A. Member FDIC. Equal Housing Lender. © 2026 Bank of America Corporation. All rights reserved.</p>
                    <p>Corporate Headquarters: 100 North Tryon Street, Charlotte, NC 28255. If you suspect fraudulent activity, immediately lock your card via our mobile application or call our resolution desk at 1-800-432-1000.</p>
                    <div style="margin-top: 20px; border-top: 1px solid #1e3a8a; padding-top: 16px; font-size: 8px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #60a5fa; text-align: center;">
                        EQUAL HOUSING LENDER &bull; MEMBER FDIC &bull; REF ID: ${referenceId} &bull; &copy; ${currentYear} BANK OF AMERICA CORPORATION
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    if (theme === 'boe') {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: 'Times New Roman', Times, Georgia, serif; background-color: #f3f4f6; margin: 0; padding: 20px 10px; -webkit-font-smoothing: antialiased; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); border: 2px solid #D4AF37; }
                .content { padding: 32px; color: #111827; background-color: #ffffff; }
                .content p { line-height: 1.6; font-size: 14px; color: #374151; margin-bottom: 18px; }
                .highlight-box { background-color: #f4f6f9; border-left: 4px solid #00356B; padding: 18px; margin: 24px 0; }
                .btn { display: inline-block; background-color: #00356B; color: #ffffff !important; padding: 12px 26px; text-decoration: none !important; border-radius: 2px; font-weight: bold; font-size: 13px; text-align: center; margin-top: 15px; border: 1.5px solid #D4AF37; }
                .links-row { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 14px 0; margin-top: 35px; text-align: center; background-color: #f9fafb; }
                .links-row a { color: #00356B; text-decoration: none; font-size: 11px; font-weight: bold; margin: 0 10px; font-family: sans-serif; }
                .footer { background-color: #001f3f; padding: 32px; text-align: left; color: #cbd5e1; border-top: 3px solid #D4AF37; }
                .footer p { font-size: 11px; line-height: 1.6; color: #94a3b8; margin: 0 0 12px 0; }
                .footer a { color: #ffffff; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Bank of England Royal Header -->
                <div style="padding: 24px 32px; background-color: #00356B; border-bottom: 3px solid #D4AF37; text-align: left;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="left" valign="middle">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td valign="middle">
                                            <svg width="36" height="36" viewBox="0 0 100 100" style="display: inline-block; vertical-align: middle;">
                                                <circle cx="50" cy="50" r="48" fill="#00356B" stroke="#D4AF37" stroke-width="2" />
                                                <path d="M35 30 L40 45 L50 35 L60 45 L65 30 L60 25 L50 30 L40 25 Z" fill="#D4AF37" />
                                                <path d="M30 40 L70 40 C70 40 70 70 50 85 C30 70 30 40 30 40 Z" fill="#ffffff" stroke="#D4AF37" stroke-width="1.5" />
                                                <rect x="46" y="40" width="8" height="40" fill="#E31837" />
                                                <rect x="30" y="52" width="40" height="8" fill="#E31837" />
                                                <circle cx="50" cy="20" r="2.5" fill="#D4AF37" />
                                                <circle cx="50" cy="56" r="3" fill="#D4AF37" />
                                            </svg>
                                        </td>
                                        <td valign="middle" style="padding-left: 12px; font-family: 'Times New Roman', Times, serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                                            Bank of England
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td align="right" valign="middle" style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: #a7f3d0; text-transform: uppercase; letter-spacing: 1px;">
                                OFFICIAL MONETARY ADVICE
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Crisp Banner Image -->
                ${getPremiumBrandedBannerHtml(bannerUrl, options)}

                <div class="content">
                    <div style="margin-top: 10px;">
                        ${innerHtml}
                    </div>
                    
                    ${options?.actionText ? `<div style="text-align: center; margin-top: 24px;"><a href="${options.actionUrl || '#'}" class="btn" style="color:#ffffff !important;">${options.actionText}</a></div>` : ''}
                    
                    <div class="links-row">
                        <a href="https://bankofengland.co.uk">Threadneedle Services</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="https://bankofengland.co.uk/monetary-policy">Monetary Policy</a>
                        <span style="color: #cbd5e1;">|</span>
                        <a href="https://bankofengland.co.uk/contact">Registry Desk</a>
                    </div>
                </div>

                <!-- BOE Footnote -->
                <div class="footer">
                    <p style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px;">IMPORTANT MONETARY REGULATION & PRIVACY DISCLOSURE</p>
                    <p>This document constitutes an official transaction advice dispatched by the Bank of England in accordance with sterling interbank clearance directives and state account auditing requirements.</p>
                    <p>Financial Services Compensation Scheme (FSCS) protections apply to eligible sterling deposits up to standard statutory guidelines (£85,000).</p>
                    <p>Corporate Headquarters: Threadneedle Street, London EC2R 8AH, United Kingdom. Authorized by the Prudential Regulation Authority (PRA) and regulated by the Financial Conduct Authority (FCA). Registered Ref: BOE-GB-2026.</p>
                    <div style="margin-top: 20px; border-top: 1px solid #1e3a8a; padding-top: 16px; font-size: 8px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #D4AF37; text-align: center;">
                        REGULATED BY PRA & FCA &bull; FSCS PROTECTED &bull; REF ID: ${referenceId} &bull; &copy; ${currentYear} BANK OF ENGLAND
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Classic / Default Theme (First Pacific Bank but with extreme premium styling matching Chase/BofA)
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px; -webkit-font-smoothing: antialiased; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .content { padding: 32px 32px 40px 32px; color: #1e293b; background-color: #ffffff; }
            .content p { line-height: 1.7; font-size: 14px; color: #334155; margin-bottom: 20px; }
            .highlight-box { background-color: #f8fafc; border-left: 4px solid ${accentColor}; padding: 20px; border-radius: 0 12px 12px 0; margin: 24px 0; }
            .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; padding: 12px 28px; text-decoration: none !important; border-radius: 8px; font-weight: bold; font-size: 13px; text-align: center; margin-top: 24px; }
            .links-row { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 16px 0; margin-top: 40px; text-align: center; background-color: #ffffff; }
            .links-row a { color: #0284c7; text-decoration: none; font-size: 11px; font-weight: bold; margin: 0 12px; text-transform: uppercase; letter-spacing: 1px; }
            .footer { background-color: #0f172a; padding: 36px 32px; text-align: left; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .footer p { font-size: 11px; line-height: 1.6; color: #94a3b8; margin: 0 0 12px 0; }
            .footer a { color: #38bdf8; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Brand Logo & Header -->
            <div style="padding: 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                <div style="margin: 0 auto 8px auto; display: inline-block; vertical-align: middle;">
                    ${getLogoSvgByStyle(options?.logoStyle || 'classic', 44)}
                </div>
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; margin-left: 10px; text-transform: uppercase;">
                    First Pacific Bank
                </div>
            </div>

            <!-- Crisp Contextual Banner Image -->
            ${getPremiumBrandedBannerHtml(bannerUrl, options)}

            <div class="content">
                <!-- If not receipt, render standard header inside content -->
                ${!options?.isReceipt ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                    <tr>
                        <td align="left" valign="middle">
                            <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${title}</h2>
                        </td>
                        <td align="right" valign="middle" style="width: 130px;">
                            <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #10b981; padding: 4px 8px; border-radius: 6px;">
                                <span style="display: inline-block; width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; vertical-align: middle; margin-right: 4px;"></span>
                                <span style="color: #166534; font-size: 9px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">SECURE MATCH</span>
                            </div>
                        </td>
                    </tr>
                </table>
                ` : ''}

                <div style="margin-top: 10px;">
                    ${innerHtml}
                </div>
                
                ${options?.actionText ? `<div style="text-align: center; margin-top: 24px;"><a href="${options.actionUrl || '#'}" class="btn" style="color:#ffffff !important;">${options.actionText}</a></div>` : ''}
                
                <div class="links-row">
                    <a href="${BRANDING_CONFIG.supportUrl}">Client Portal</a>
                    <a href="${BRANDING_CONFIG.supportUrl}">Help Desk</a>
                    <a href="https://firstpaba.com/verify">Security Hub</a>
                </div>
            </div>

            <!-- Professional Regulatory Disclosures Footer -->
            <div class="footer">
                <p style="font-size: 9px; font-weight: bold; letter-spacing: 1.5px; color: #cbd5e1; text-transform: uppercase; margin-bottom: 12px;">Institutional Compliance & Legal Disclosures</p>
                <p>This automated transaction correspondence is securely dispatched in real-time under standard banking notification protocols. All deposit products and services of First Pacific Bank, National Association (FPB N.A.) are subject to OCC oversight and are insured up to the standard statutory FDIC limit of $250,000.</p>
                <p>Corporate Headquarters: ${BRANDING_CONFIG.address}. For security and privacy, never share your account password, PIN, or secure access codes with anyone. If you suspect fraud, notify our customer support team immediately at ${BRANDING_CONFIG.phone}. You can <a href="${BRANDING_CONFIG.unsubscribeUrl}">unsubscribe</a> or manage preferences inside your profile security tab.</p>
                <div style="margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 8px; font-weight: bold; letter-spacing: 1px; color: #64748b; text-transform: uppercase; text-align: center;">
                    EQUAL HOUSING LENDER &bull; MEMBER FDIC &bull; REF ID: ${referenceId} &bull; &copy; ${currentYear} FIRST PACIFIC GROUP
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates a professional HTML email template for banking alerts.
 */
export const generateBankingEmailTemplate = (
    title: string, 
    content: string, 
    actionText?: string, 
    actionUrl?: string,
    options?: BrandOptions
) => {
    return getStandardEmailSkeleton(title, content, {
        ...options,
        actionText,
        actionUrl
    });
};

const generateReceiptTemplate = (params: any, type: 'Credit' | 'Debit', options?: BrandOptions) => {
    const paymentRail = params.paymentRail || (params.description?.includes('SWIFT') ? 'SWIFT' : params.description?.includes('SEPA') ? 'SEPA' : params.description?.includes('FedWire') ? 'FedWire' : 'Sovereign Clearing');
    const borderAccent = options?.primaryColor || (type === 'Credit' ? '#16a34a' : '#1e293b');
    const theme = options?.emailTheme || 'classic';

    const currencySymbol = params.currencySymbol || '$';
    const currencyCode = params.currencyCode || 'USD';

    const localBanner = resolveBankingBannerUrl(options?.bannerUrl, theme, type + ' ' + (params.description || ''));

    const dateToday = params.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeToday = params.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    const rawAmountVal = Math.abs(Number(String(params.amount).replace(/[^0-9.-]+/g, ''))) || 0;
    const rawFeeVal = params.fee ? Math.abs(Number(String(params.fee).replace(/[^0-9.-]+/g, '')) || 0) : 0;
    const rawComplianceFeeVal = params.complianceFee ? Math.abs(Number(String(params.complianceFee).replace(/[^0-9.-]+/g, '')) || 0) : 0;

    let principalVal = 0;
    if (params.principalAmount) {
        principalVal = Math.abs(Number(String(params.principalAmount).replace(/[^0-9.-]+/g, ''))) || 0;
    } else if (rawAmountVal >= (rawFeeVal + rawComplianceFeeVal) && (rawFeeVal > 0 || rawComplianceFeeVal > 0)) {
        principalVal = rawAmountVal - rawFeeVal - rawComplianceFeeVal;
    } else {
        principalVal = rawAmountVal;
    }

    const computedPrincipal = principalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalSettledVal = type === 'Credit' ? rawAmountVal : (principalVal + rawFeeVal + rawComplianceFeeVal);
    const formattedAmount = totalSettledVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedFee = rawFeeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedComplianceFee = rawComplianceFeeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedBalance = Number(String(params.availableBalance).replace(/[^0-9.-]+/g,"")).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let innerHtml = '';

    if (theme === 'chase') {
        innerHtml = `
        <!-- Chase Style Transaction Alert -->
        <div style="font-family: Arial, Helvetica, sans-serif;">
            <!-- Chase Security Zone -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 4px; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
                <tr>
                    <td style="padding: 12px 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="font-size: 11px; font-weight: bold; color: #0060a3; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                                    Chase Security Zone
                                </td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #4b5563; line-height: 1.4;">
                                    To help you identify authentic emails from Chase, we've included this Security Zone.
                                    <br/><strong>Customer:</strong> ${params.fullName} &nbsp;|&nbsp; <strong>Checking Account:</strong> *${params.accountLastFour || '9820'}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <h1 style="font-size: 20px; font-weight: bold; color: #111827; margin-top: 0; margin-bottom: 18px;">
                Chase Alert: Checking account transaction posted
            </h1>
            <p style="font-size: 14px; color: #374151; line-height: 1.5; margin-bottom: 24px;">
                Dear ${params.fullName},<br/><br/>
                We are writing to notify you that a recent ${type.toLowerCase()} activity was posted to your Chase checking account ending in <strong>*${params.accountLastFour || '9820'}</strong> on ${dateToday} at ${timeToday}.
            </p>

            <!-- Advanced Alignment Clean Transaction Details Table -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
                <tr style="background-color: #0060a3; border-bottom: 1px solid #cbd5e1;">
                    <td colspan="2" style="padding: 12px 16px; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                        Transaction Summary & Clearing Details
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;" width="45%">Account ending in</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #111827; text-align: right;">Checking (*${params.accountLastFour || '9820'})</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Date & Time Posted</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #111827; text-align: right;">${dateToday} at ${timeToday}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Merchant / Description</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #111827; text-align: right;">${params.description || 'Verified Interbank Pool'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Principal Amount</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #111827; text-align: right; font-family: monospace;">${currencySymbol}${computedPrincipal} ${currencyCode}</td>
                </tr>
                ${rawFeeVal > 0 ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Processing Fee / Surcharge</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #d97706; text-align: right; font-family: monospace;">${currencySymbol}${formattedFee} ${currencyCode}</td>
                </tr>
                ` : ''}
                ${rawComplianceFeeVal > 0 ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Regulatory Compliance Halt Fee (17%)</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #dc2626; text-align: right; font-family: monospace;">${currencySymbol}${formattedComplianceFee} ${currencyCode}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <td style="padding: 14px 16px; font-size: 13px; font-weight: bold; color: #111827;">Total Settled Value</td>
                    <td style="padding: 14px 16px; font-size: 16px; font-weight: 900; color: ${type === 'Credit' ? '#16a34a' : '#ea580c'}; text-align: right; font-family: monospace;">
                        ${type === 'Credit' ? '+' : '-'}${currencySymbol}${formattedAmount} ${currencyCode}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Available Balance</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0060a3; text-align: right; font-family: monospace;">${currencySymbol}${formattedBalance} ${currencyCode}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Transmission Protocol</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #111827; text-align: right; text-transform: uppercase;">${paymentRail}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-size: 13px; color: #4b5563;">Settlement Status</td>
                    <td style="padding: 12px 16px; font-size: 12px; font-weight: bold; color: #16a34a; text-align: right; text-transform: uppercase;">● Posted & Reconciled</td>
                </tr>
            </table>

            <!-- Chase Buttons -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;">
                <tr>
                    <td align="center">
                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                            <tr>
                                <td style="background-color: #0060a3; border-radius: 4px; text-align: center;">
                                    <a href="https://chase.com" style="display: block; border: 12px solid #0060a3; border-top: 10px solid #0060a3; border-bottom: 10px solid #0060a3; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff !important; text-decoration: none;">
                                        Sign In to Chase
                                    </a>
                                </td>
                                <td style="width: 12px;">&nbsp;</td>
                                <td style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
                                    <a href="https://chase.com" style="display: block; border: 11px solid #ffffff; border-top: 9px solid #ffffff; border-bottom: 9px solid #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #374151 !important; text-decoration: none;">
                                        Dispute Transaction
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Chase Security Notice -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; margin: 24px 0; text-align: left;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" style="width: 24px; padding-right: 12px; font-size: 18px; line-height: 1; color: #0060a3;">
                            🔒
                        </td>
                        <td valign="top">
                            <span style="font-size: 12px; font-weight: bold; color: #111827; display: block; margin-bottom: 4px;">Chase Security Tips</span>
                            <span style="font-size: 12px; line-height: 1.5; color: #4b5563; display: block;">
                                Chase will never ask for your passwords, PINs, or verification codes via text or email. If you did not authorize this transaction, lock your card immediately inside our mobile application or call Chase Fraud Operations.
                            </span>
                        </td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 14px; color: #374151; margin-top: 24px;">
                Thank you for choosing Chase.<br/><br/>
                Sincerely,<br/>
                <strong>Chase Alert Operations</strong>
            </p>
        </div>
        `;
    } else if (theme === 'bofa') {
        innerHtml = `
        <!-- Bank of America Style Transaction Alert -->
        <div style="font-family: Arial, Helvetica, sans-serif;">
            <!-- Bank of America Security Zone -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid #cbd5e1; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
                <tr>
                    <td style="padding: 12px 16px; border-left: 4px solid #e31837;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="font-size: 11px; font-weight: bold; color: #012169; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                                    Customer Security Zone
                                </td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #333333; line-height: 1.4;">
                                    To help protect your security, Bank of America includes this Customer Security Zone in all alerts.
                                    <br/><strong>Customer Name:</strong> ${params.fullName} &nbsp;|&nbsp; <strong>Account Ending In:</strong> *${params.accountLastFour || '9820'}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <h1 style="font-size: 20px; font-weight: bold; color: #012169; margin-top: 0; margin-bottom: 18px;">
                Bank of America Alert: Transaction posted
            </h1>
            <p style="font-size: 14px; color: #333333; line-height: 1.5; margin-bottom: 24px;">
                Hello ${params.fullName},<br/><br/>
                As requested, we are sending this alert to notify you that a ${type.toLowerCase()} of <strong>${currencySymbol}${formattedAmount} ${currencyCode}</strong> was posted to your checking account ending in <strong>*${params.accountLastFour || '9820'}</strong> on ${dateToday} at ${timeToday}.
            </p>

            <!-- Advanced Alignment Clean Transaction Details Table -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px; border-top: 2px solid #012169; border-bottom: 2px solid #012169;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                    <td style="padding: 12px 10px; font-size: 11px; font-weight: bold; color: #012169; text-transform: uppercase;">Transaction Details</td>
                    <td style="padding: 12px 10px; font-size: 11px; font-weight: bold; color: #012169; text-transform: uppercase; text-align: right;">Value</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;" width="40%">Account Type</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #012169; text-align: right;">Checking (*${params.accountLastFour || '9820'})</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Posting Date</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #000000; text-align: right;">${dateToday} at ${timeToday}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Merchant / Description</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #000000; text-align: right;">${params.description || 'Verified Interbank Pool'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Principal Amount</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #000000; text-align: right; font-family: monospace;">${currencySymbol}${computedPrincipal} ${currencyCode}</td>
                </tr>
                ${rawFeeVal > 0 ? `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Wire Transfer Fee</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #b45309; text-align: right; font-family: monospace;">${currencySymbol}${formattedFee} ${currencyCode}</td>
                </tr>
                ` : ''}
                ${rawComplianceFeeVal > 0 ? `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Regulatory Compliance Halt Fee (17%)</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #dc2626; text-align: right; font-family: monospace;">${currencySymbol}${formattedComplianceFee} ${currencyCode}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #cbd5e1; background-color: #f8fafc;">
                    <td style="padding: 14px 10px; font-size: 13px; font-weight: bold; color: #012169;">Total Settled Value</td>
                    <td style="padding: 14px 10px; font-size: 16px; font-weight: 900; color: ${type === 'Credit' ? '#16a34a' : '#e31837'}; text-align: right; font-family: monospace;">
                        ${type === 'Credit' ? '+' : '-'}${currencySymbol}${formattedAmount} ${currencyCode}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Available Balance</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #012169; text-align: right; font-family: monospace;">${currencySymbol}${formattedBalance} ${currencyCode}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Posting Rail</td>
                    <td style="padding: 12px 10px; font-size: 13px; font-weight: bold; color: #012169; text-align: right; text-transform: uppercase;">${paymentRail}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 10px; font-size: 13px; color: #333333;">Status</td>
                    <td style="padding: 12px 10px; font-size: 11px; font-weight: bold; color: #16a34a; text-align: right; text-transform: uppercase;">● Completed / Reconciled</td>
                </tr>
            </table>

            <!-- BofA Buttons -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;">
                <tr>
                    <td align="center">
                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                            <tr>
                                <td style="background-color: #012169; border-radius: 2px; text-align: center;">
                                    <a href="https://bankofamerica.com" style="display: block; border: 12px solid #012169; border-top: 10px solid #012169; border-bottom: 10px solid #012169; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff !important; text-decoration: none;">
                                        Sign In to Online Banking
                                    </a>
                                </td>
                                <td style="width: 12px;">&nbsp;</td>
                                <td style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 2px; text-align: center;">
                                    <a href="https://bankofamerica.com" style="display: block; border: 11px solid #ffffff; border-top: 9px solid #ffffff; border-bottom: 9px solid #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #012169 !important; text-decoration: none;">
                                        Report Suspicious Activity
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- BofA Security Tips -->
            <div style="background-color: #fdf2f2; border: 1px solid #fecaca; padding: 16px; margin: 24px 0; text-align: left;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" style="width: 24px; padding-right: 12px; font-size: 18px; line-height: 1; color: #e31837;">
                            🚨
                        </td>
                        <td valign="top">
                            <span style="font-size: 12px; font-weight: bold; color: #012169; display: block; margin-bottom: 4px;">Security Reminder</span>
                            <span style="font-size: 12px; line-height: 1.5; color: #333333; display: block;">
                                Bank of America will never ask for your passwords, login credentials, or PINs via email or text. If this is an unexpected transaction, lock your card immediately inside the Mobile Banking app.
                            </span>
                        </td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 14px; color: #333333; margin-top: 24px;">
                Thank you for your business.<br/><br/>
                Sincerely,<br/>
                <strong>Bank of America Alert Operations</strong>
            </p>
        </div>
        `;
    } else {
        // Classic FPB Theme but highly structured & styled
        innerHtml = `
        <!-- Beautiful, Clean Hero Card for the Alert -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc; font-family: Arial, sans-serif;">
            <tr>
                <td style="padding: 12px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="font-size: 11px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">
                                First Pacific - Secure Dispatch Node
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size: 11px; color: #475569; line-height: 1.4;">
                                This institutional advice is securely dispatched over standard encrypted routes.
                                <br/><strong>Recipient Portfolio:</strong> ${params.fullName} &nbsp;|&nbsp; <strong>Settlement Endpoint:</strong> Checking (*${params.accountLastFour || '9820'})
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 16px; margin-bottom: 24px; text-align: center; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #f8fafc;">
            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">
                Account Alert: ${type === 'Credit' ? 'Direct Deposit / Credit' : 'Withdrawal / Debit'}
            </span>
            <span style="font-size: 40px; font-weight: 900; color: ${type === 'Credit' ? '#16a34a' : '#1e293b'}; letter-spacing: -1.5px; display: block; margin-bottom: 8px; font-family: monospace;">
                ${type === 'Credit' ? '+' : '-'}${currencySymbol}${formattedAmount} ${currencyCode}
            </span>
            <span style="font-size: 13px; font-weight: 700; color: #334155; display: block; text-transform: uppercase; letter-spacing: 0.5px;">
                ${params.description || 'Electronic Transaction Completed'}
            </span>
        </div>

        <!-- Friendly, Personalized Intro -->
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Dear ${params.fullName},<br/><br/>
            This is an automated notification of recent ${type.toLowerCase()} activity posted to your account checking (*${params.accountLastFour || '9820'}) on ${dateToday} at ${timeToday}. Please find the detailed transaction summary below:
        </p>

        <!-- Clean Transaction Table (advanced alignment) -->
        <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0; background-color: #0f172a;">
                    <td style="padding: 12px 16px; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;" width="50%">Transaction Attribute</td>
                    <td style="padding: 12px 16px; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Posted Value</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Account Number</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right;">Checking (*${params.accountLastFour || '9820'})</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Principal Amount</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">${currencySymbol}${computedPrincipal} ${currencyCode}</td>
                </tr>
                ${rawFeeVal > 0 ? `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Transfer Fee</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #d97706; text-align: right; font-family: monospace;">${currencySymbol}${formattedFee} ${currencyCode}</td>
                </tr>
                ` : ''}
                ${rawComplianceFeeVal > 0 ? `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Regulatory Compliance Halt Fee (17%)</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #dc2626; text-align: right; font-family: monospace;">${currencySymbol}${formattedComplianceFee} ${currencyCode}</td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 14px 16px; font-size: 13px; font-weight: bold; color: #0f172a;">Total Account Sweep</td>
                    <td style="padding: 14px 16px; font-size: 15px; font-weight: 900; color: ${type === 'Credit' ? '#16a34a' : '#0f172a'}; text-align: right; font-family: monospace;">${currencySymbol}${formattedAmount} ${currencyCode}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Merchant / Description</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right;">${params.description || 'Verified Interbank Pool'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Date & Time</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right;">${dateToday} at ${timeToday}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Available Balance</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f766e; text-align: right; font-family: monospace;">${currencySymbol}${formattedBalance} ${currencyCode}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Clearing Rail</td>
                    <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right; text-transform: uppercase;">${paymentRail}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Transaction Status</td>
                    <td style="padding: 12px 16px; font-size: 11px; font-weight: bold; color: #16a34a; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">
                        ● Completed
                    </td>
                </tr>
            </table>
        </div>

        <!-- Fully Functional Centered Action Buttons -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                        <tr>
                            <td style="background-color: #0f172a; border-radius: 8px; text-align: center;">
                                <a href="https://ai.studio/build" style="display: block; border: 12px solid #0f172a; border-top: 10px solid #0f172a; border-bottom: 10px solid #0f172a; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff !important; text-decoration: none;">
                                    Sign In to Dashboard
                                </a>
                            </td>
                            <td style="width: 12px;">&nbsp;</td>
                            <td style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
                                <a href="https://ai.studio/build" style="display: block; border: 11px solid #ffffff; border-top: 9px solid #ffffff; border-bottom: 9px solid #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #0f172a !important; text-decoration: none;">
                                    Dispute Transaction
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Real Bank Security Notice -->
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: left;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td valign="top" style="width: 20px; padding-right: 12px; font-size: 16px; line-height: 1;">
                        🔒
                    </td>
                    <td valign="top">
                        <span style="font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Security Information</span>
                        <span style="font-size: 12px; line-height: 1.5; color: #78350f; display: block;">
                            To protect your account, First Pacific Bank will <strong>NEVER</strong> contact you directly to ask for your passwords, PINs, or full social security number. If you did not make this transaction or notice any suspicious activity, please lock your card and report it immediately.
                        </span>
                    </td>
                </tr>
            </table>
        </div>
        `;
    }

    return getStandardEmailSkeleton(
        type === 'Credit' ? 'CREDIT TRANSACTION ADVICE' : 'DEBIT TRANSACTION ADVICE',
        innerHtml,
        {
            ...options,
            bannerUrl: localBanner,
            primaryColor: borderAccent,
            isReceipt: true,
            emailTheme: theme
        }
    );
};

/**
 * Unified Payload and Template Builder Function
 * Used by all notification services, webhook simulations, and the admin system communication panel
 */
export const buildUnifiedEmailPayload = (
    templateType: 'standard' | 'credit' | 'debit' | 'security_alert' | 'account_summary' | 'certificate',
    subject: string,
    bodyTextOrHtml: string,
    brandOptions?: BrandOptions,
    metaParams?: any
): { subject: string; htmlBody: string } => {
    let finalHtml = '';
    let finalSubject = subject;

    const options: BrandOptions = {
        logoStyle: brandOptions?.logoStyle || 'classic',
        primaryColor: brandOptions?.primaryColor || '#D4AF37',
        customIssuer: brandOptions?.customIssuer || 'Sovereign Elite Portfolios',
        securityBadges: brandOptions?.securityBadges || ['TLS 1.3 SECURED', 'AES 256 ENCRYPTED'],
        bannerUrl: brandOptions?.bannerUrl,
        emailTheme: brandOptions?.emailTheme || 'classic'
    };

    if (templateType === 'credit') {
        finalSubject = finalSubject || `LEDGER ALERT: USD ${metaParams?.amount || '0.00'} Cleared`;
        finalHtml = generateCreditAlertEmail({
            fullName: metaParams?.fullName || 'Client Payer',
            accountLastFour: metaParams?.accountLastFour || '9820',
            date: metaParams?.date || new Date().toISOString().split('T')[0],
            time: metaParams?.time || new Date().toLocaleTimeString(),
            amount: metaParams?.amount || '0.00',
            principalAmount: metaParams?.principalAmount,
            fee: metaParams?.fee,
            complianceFee: metaParams?.complianceFee,
            reference: metaParams?.reference || 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            description: metaParams?.description || 'Institutional Credit Settled',
            availableBalance: metaParams?.availableBalance || '0.00',
            paymentRail: metaParams?.paymentRail || 'Sovereign Clearing ID'
        } as any, options);
    } else if (templateType === 'debit') {
        finalSubject = finalSubject || `LEDGER ALERT: USD ${metaParams?.amount || '0.00'} Swept`;
        finalHtml = generateDebitAlertEmail({
            fullName: metaParams?.fullName || 'Client Payer',
            accountLastFour: metaParams?.accountLastFour || '9820',
            date: metaParams?.date || new Date().toISOString().split('T')[0],
            time: metaParams?.time || new Date().toLocaleTimeString(),
            amount: metaParams?.amount || '0.00',
            principalAmount: metaParams?.principalAmount,
            fee: metaParams?.fee,
            complianceFee: metaParams?.complianceFee,
            reference: metaParams?.reference || 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            description: metaParams?.description || 'Outward Settlement Clearance',
            availableBalance: metaParams?.availableBalance || '0.00',
            paymentRail: metaParams?.paymentRail || 'Sovereign Clearing ID'
        } as any, options);
    } else {
        // Standard template / generic system notifications or security alert
        const formattedContent = bodyTextOrHtml 
            ? bodyTextOrHtml.split('\n').filter((p: string) => p.trim() !== '').map((para: string) => `<p style="margin-bottom: 20px; font-size: 14px; line-height: 1.7; color: #334155;">${para}</p>`).join('')
            : '<p>Direct Institutional Notification</p>';
        
        finalSubject = finalSubject || "Official Direct Notification";
        finalHtml = generateBankingEmailTemplate(
            finalSubject,
            formattedContent,
            undefined,
            undefined,
            options
        );
    }

    return { subject: finalSubject, htmlBody: finalHtml };
};

/**
 * Generates a standard structure credit alert email template matching top-tier institutions.
 */
export const generateCreditAlertEmail = (params: {
    fullName: string;
    accountLastFour: string;
    date: string;
    time: string;
    amount: string;
    principalAmount?: string;
    fee?: string;
    complianceFee?: string;
    reference: string;
    description: string;
    availableBalance: string;
    bankName?: string;
    bankPhone?: string;
    currencySymbol?: string;
    currencyCode?: string;
}, options?: BrandOptions) => {
    return generateReceiptTemplate(params, 'Credit', options);
};

/**
 * Generates a standard structure debit alert email template.
 */
export const generateDebitAlertEmail = (params: {
    fullName: string;
    accountLastFour: string;
    date: string;
    time: string;
    amount: string;
    principalAmount?: string;
    fee?: string;
    complianceFee?: string;
    reference: string;
    description: string;
    availableBalance: string;
    bankName?: string;
    bankPhone?: string;
    currencySymbol?: string;
    currencyCode?: string;
}, options?: BrandOptions) => {
    return generateReceiptTemplate(params, 'Debit', options);
};

/**
 * Generates a high-fidelity Certificate of Deposit (CD) HTML email template.
 */
export const generateCertificateEmail = (params: {
    fullName: string;
    accountLastFour: string;
    accountName: string;
    serialNumber: string;
    amount: string;
    apy: string;
    issueDate: string;
    maturityDate: string;
    hashSignature: string;
    insuranceLimit: string;
}, options?: BrandOptions) => {
    const currentYear = new Date().getFullYear();
    const logoStyle = options?.logoStyle || 'classic';
    const accentColor = options?.primaryColor || '#D4AF37';
    const bannerUrl = resolveBankingBannerUrl(options?.bannerUrl, options?.emailTheme, 'certificate of deposit cd');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Institutional Certificate of Deposit</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060913; margin: 0; padding: 40px 10px; -webkit-font-smoothing: antialiased; }
            .container { max-width: 620px; margin: 0 auto; background-color: #0b1122; border-radius: 24px; overflow: hidden; border: 3px double #D4AF37; box-shadow: 0 35px 70px -15px rgba(0,0,0,0.8); }
            .cert-header { background: linear-gradient(135deg, #090d16 0%, #060a14 100%); padding: 36px 32px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.25); }
            .cert-body { padding: 44px 40px; color: #f1f5f9; background-color: #0b1122; background-image: radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 80%); }
            .cert-title-container { border: 1px solid rgba(212, 175, 55, 0.2); background-color: rgba(212, 175, 55, 0.03); padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center; }
            .cert-badge { display: inline-block; padding: 4px 10px; background-color: rgba(212, 175, 55, 0.1); border: 1.5px solid #D4AF37; border-radius: 30px; margin-bottom: 12px; }
            .cert-badge span { color: #FFF4D0; font-size: 8px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
            .cert-title-main { color: #ffffff !important; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            .cert-sub { color: #D4AF37; margin: 4px 0 0 0; font-size: 8.5px; font-weight: bold; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 4px; }
            .cert-message { text-align: center; font-size: 13.5px; line-height: 1.8; color: #cbd5e1; margin-bottom: 28px; }
            .ledger-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; overflow: hidden; }
            .ledger-tr { border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
            .ledger-label { padding: 14px 18px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; width: 40%; text-align: left; }
            .ledger-value { padding: 14px 18px; font-size: 12px; font-weight: bold; color: #ffffff; text-align: right; }
            .gold-badge-val { color: #10b981; font-family: monospace; font-size: 13px; font-weight: 900; }
            .seal-container { margin-top: 36px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
            .sig-title { font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; }
            .sig-name { font-family: "Brush Script MT", "Great Vibes", cursive, serif; font-size: 19px; color: #FFF4D0; font-weight: bold; font-style: italic; }
            .sig-role { font-size: 8px; color: #64748b; margin-top: 2px; text-transform: uppercase; }
            .comptroller-stamp { border: 2.5px solid #10b981; color: #10b981; border-radius: 10px; padding: 10px 14px; text-align: center; border-style: uppercase; display: inline-block; transform: rotate(-6deg); margin-top: 5px; box-shadow: 0 4px 12px rgba(16,185,129,0.1); }
            .stamp-inner { font-size: 10px; font-weight: 950; letter-spacing: 1px; }
            .stamp-role { font-size: 7px; opacity: 0.8; letter-spacing: 0.5px; font-weight: bold; margin-top: 2px; }
            .links-row { border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 16px 0; margin-top: 36px; text-align: center; background-color: #090d16; }
            .links-row a { color: #38bdf8; text-decoration: none; font-size: 10px; font-weight: bold; margin: 0 12px; text-transform: uppercase; letter-spacing: 1.5px; }
            .footer { background-color: #050810; padding: 36px 40px; text-align: left; color: #475569; border-top: 1px solid rgba(255,255,255,0.05); }
            .footer p { font-size: 10px; line-height: 1.6; color: #475569; margin: 0 0 12px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Brand Banner Image Row (Fully visible inline img) -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding: 0; margin: 0; line-height: 0;">
                        ${getPremiumBrandedBannerHtml(bannerUrl, { primaryColor: accentColor }, 620, true)}
                    </td>
                </tr>
            </table>

            <!-- Brand Title Group Row -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0b1122; border-bottom: 4px solid ${accentColor};">
                <tr>
                    <td align="center" valign="middle" style="padding: 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 34px 30px; border-collapse: collapse;">
                                <tr>
                                    <td align="left" valign="top" style="width: 65%;">
                                        <!-- Brand Title Group -->
                                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0; border-collapse: collapse; background-color: rgba(11, 17, 34, 0.75); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 14px;">
                                            <tr>
                                                <td valign="middle" style="padding: 10px; border-right: 1px solid rgba(255,255,255,0.1);">
                                                    <!-- Real Logo Icon -->
                                                    <div style="width: 44px; height: 44px; border-radius: 50%; background-color: #0b1122; border: 2px solid ${accentColor}; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 0 15px rgba(212,175,55,0.4);">
                                                        <img src="${BRANDING_CONFIG.logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" referrerpolicy="no-referrer" />
                                                    </div>
                                                </td>
                                                <td valign="middle" style="padding: 10px 14px;">
                                                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #ffffff; line-height: 1.2;">
                                                        ${BRANDING_CONFIG.shortName}
                                                    </div>
                                                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 800; letter-spacing: 2px; color: ${accentColor}; text-transform: uppercase; margin-top: 4px;">
                                                        Private Wealth Enclave
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        <br/>
                                        
                                        <!-- Premium Trust Badge Capsule -->
                                        <div style="margin-top: 18px; display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 12px; border-radius: 8px;">
                                            <span style="font-family: sans-serif; font-size: 8px; color: #34d399; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
                                                <span style="display:inline-block; width:6px; height:6px; background-color:#34d399; border-radius:50%; margin-right:4px; vertical-align:middle;"></span> U.S. ACCOUNT SECURITY STANDARDS
                                            </span>
                                        </div>
                                    </td>
                                    <td align="right" valign="top" style="width: 35%;">
                                        <!-- High Resolution Real Human Bank Representative -->
                                        <div style="display: inline-block; width: 85px; height: 85px; border-radius: 50%; border: 3px solid ${accentColor}; overflow: hidden; background-color: #090e17; box-shadow: 0 10px 25px rgba(0,0,0,0.6);">
                                            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=250&auto=format&fit=crop" alt="Trust Partner" style="width: 100%; height: 100%; object-fit: cover; display: block;" referrerpolicy="no-referrer">
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding-top: 36px; text-align: left;">
                                        <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px; display: table; width: 100%;">
                                            <div style="display: table-cell; text-align: left;">
                                                <span style="font-size: 9px; font-weight: bold; color: rgba(255,255,255,0.8); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 1.5px; text-transform: uppercase;">SOVEREIGN DISPATCH PORTID: FPB-OP-8829 | NODE_SYNC: SECURE_STABLE</span>
                                            </div>
                                            <div style="display: table-cell; text-align: right;">
                                                <span style="font-size: 8px; font-weight: bold; color: #FFF4D0; background-color: rgba(11, 17, 34, 0.8); padding: 4px 8px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase;">MEMBER OCC &bull; FDIC INSURED</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            <div class="cert-body">
                <div class="cert-title-container">
                    <div class="cert-badge"><span>SOVEREIGN ESCROW TRUST</span></div>
                    <h2 class="cert-title-main">Certificate of Liquid Deposit</h2>
                    <p class="cert-sub">Certified Deposit Account Dossier</p>
                </div>
                
                <p class="cert-message">
                    This document certifies that <strong>${params.fullName}</strong> has placed on deposit with <strong>${BRANDING_CONFIG.bankName}</strong> secondary liquid asset capital, which is registered on the centralized ledger. The asset volume and yields are verified by corresponding transaction hashes.
                </p>
                
                <table class="ledger-table" width="100%">
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certificate Serial Number</td>
                        <td class="ledger-value" style="color: #38bdf8; font-family: monospace;">${params.serialNumber}</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certified Depositor</td>
                        <td class="ledger-value">${params.fullName}</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certified Ledger Source</td>
                        <td class="ledger-value">${params.accountName} (*${params.accountLastFour})</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certified Liquid Capital</td>
                        <td class="ledger-value"><span class="gold-badge-val">USD $${params.amount}</span></td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Annual Yield Standard (APY)</td>
                        <td class="ledger-value" style="color: #f59e0b;">${params.apy}% APY Interest Rate</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Initial Value Date</td>
                        <td class="ledger-value">${params.issueDate}</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Maturity Date</td>
                        <td class="ledger-value">${params.maturityDate}</td>
                    </tr>
                    <tr class="ledger-tr" style="border-bottom:none;">
                        <td class="ledger-label">FDIC Guard Status</td>
                        <td class="ledger-value" style="color: #10b981;">SECURED (Insured up to ${params.insuranceLimit})</td>
                    </tr>
                </table>
                
                <div class="seal-container">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td width="35%" valign="top" align="left">
                                <p class="sig-title">Attestation</p>
                                <p class="sig-name">Marilyn G. Lawrence</p>
                                <p class="sig-role">Managing Director // Comptroller</p>
                            </td>
                            <td width="35%" valign="top" align="left">
                                <p class="sig-title">Attestation</p>
                                <p class="sig-name">Marcus Finch</p>
                                <p class="sig-role">Director // Chairman of Vaults</p>
                            </td>
                            <td width="30%" valign="top" align="right">
                                <div class="comptroller-stamp">
                                    <div class="stamp-inner">COMPT SEAL</div>
                                    <div class="stamp-role">FDIC RECORD VALID</div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Cryptographic Ledger verification section -->
                <div style="background-color: #070c14; border: 1px solid #1a2638; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 8.5px; color: #475569; margin-top: 30px; word-break: break-all; line-height: 1.4; text-align: left;">
                    <div style="color: #cbd5e1; font-weight: bold; text-transform: uppercase; font-size: 8px; letter-spacing: 1px; margin-bottom: 6px;">Automated Cryptographic Verification Block</div>
                    <strong>SOVEREIGN IMMUTABLE KEY (SHA-512):</strong> <span style="color: #10b981;">${params.hashSignature}</span><br/>
                    <strong>OVERSIGHT STATUS:</strong> LICENSED PURSUANT TO THE FEDERAL RESERVE ACT OFFICE OF OCC // RECONCILIATION NODE CODE FPB-${params.serialNumber.slice(-4)}
                </div>
            </div>
            
            <div class="links-row">
                <a href="https://firstpaba.com/verify?cert=${params.serialNumber}">Verify Live Record</a>
                <a href="https://firstpaba.com/ledger?serial=${params.serialNumber}">Audit Ledger Nodes</a>
                <a href="${BRANDING_CONFIG.supportUrl}">Customer Support</a>
            </div>
            
            <div class="footer">
                <div style="color: #cbd5e1; font-size: 8px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Institutional Auditor Notice</div>
                <p>Private Wealth Investment services under First Pacific Private Group are certified under FDIC rules up to $250,000 regulatory guidelines. All digital ledgers, Certificate of Deposits (CD), and structural solvency certificates are generated dynamically. They represent solid book entries signed with cryptographic standards of the OCC Central Clearance protocols.</p>
                <p>${BRANDING_CONFIG.complianceDisclosure}</p>
                <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px; font-size: 8px; font-weight: bold; letter-spacing: 1.5px; color: #334155; text-transform: uppercase;">
                    SECURE CERT ID: Certificate-${params.serialNumber} // &copy; ${currentYear} FIRST PACIFIC GROUP
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates a high-fidelity Sovereign Credit Certificate (Letter of Credit) HTML email template.
 */
export const generateCreditCertificateEmail = (params: {
    fullName: string;
    accountLastFour: string;
    serialNumber: string;
    creditLimit: string;
    collateralValue: string;
    creditScore: string;
    status: string;
    issueDate: string;
    hashSignature: string;
}, options?: BrandOptions) => {
    const currentYear = new Date().getFullYear();
    const logoStyle = options?.logoStyle || 'classic';
    const accentColor = options?.primaryColor || '#D4AF37';
    const bannerUrl = resolveBankingBannerUrl(options?.bannerUrl, options?.emailTheme, 'credit solvency certificate');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sovereign Credit Solvency Certificate</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060913; margin: 0; padding: 40px 10px; -webkit-font-smoothing: antialiased; }
            .container { max-width: 620px; margin: 0 auto; background-color: #0b1122; border-radius: 24px; overflow: hidden; border: 3px double #10b981; box-shadow: 0 35px 70px -15px rgba(0,0,0,0.8); }
            .cert-header { background: linear-gradient(135deg, #090d16 0%, #060a14 100%); padding: 36px 32px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.25); }
            .cert-body { padding: 44px 40px; color: #f1f5f9; background-color: #0b1122; background-image: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 80%); }
            .cert-title-container { border: 1px solid rgba(16, 185, 129, 0.2); background-color: rgba(16, 185, 129, 0.03); padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center; }
            .cert-badge { display: inline-block; padding: 4px 10px; background-color: rgba(16, 185, 129, 0.1); border: 1.5px solid #10b981; border-radius: 30px; margin-bottom: 12px; }
            .cert-badge span { color: #a7f3d0; font-size: 8px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
            .cert-title-main { color: #ffffff !important; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            .cert-sub { color: #10b981; margin: 4px 0 0 0; font-size: 8.5px; font-weight: bold; letter-spacing: 2.5px; text-transform: uppercase; }
            .cert-message { text-align: center; font-size: 13.5px; line-height: 1.8; color: #cbd5e1; margin-bottom: 28px; }
            .ledger-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; overflow: hidden; }
            .ledger-tr { border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
            .ledger-label { padding: 14px 18px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; width: 40%; text-align: left; }
            .ledger-value { padding: 14px 18px; font-size: 12px; font-weight: bold; color: #ffffff; text-align: right; }
            .gold-badge-val { color: #e11d48; font-family: monospace; font-size: 13px; font-weight: 900; }
            .seal-container { margin-top: 36px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
            .sig-title { font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; }
            .sig-name { font-family: "Brush Script MT", "Great Vibes", cursive, serif; font-size: 19px; color: #a7f3d0; font-weight: bold; font-style: italic; }
            .sig-role { font-size: 8px; color: #64748b; margin-top: 2px; text-transform: uppercase; }
            .comptroller-stamp { border: 2.5px solid #10b981; color: #10b981; border-radius: 10px; padding: 10px 14px; text-align: center; border-style: uppercase; display: inline-block; transform: rotate(-6deg); margin-top: 5px; box-shadow: 0 4px 12px rgba(16,185,129,0.1); }
            .stamp-inner { font-size: 10px; font-weight: 950; letter-spacing: 1px; }
            .stamp-role { font-size: 7px; opacity: 0.8; letter-spacing: 0.5px; font-weight: bold; margin-top: 2px; }
            .links-row { border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 16px 0; margin-top: 36px; text-align: center; background-color: #090d16; }
            .links-row a { color: #38bdf8; text-decoration: none; font-size: 10px; font-weight: bold; margin: 0 12px; text-transform: uppercase; letter-spacing: 1.5px; }
            .footer { background-color: #050810; padding: 36px 40px; text-align: left; color: #475569; border-top: 1px solid rgba(255,255,255,0.05); }
            .footer p { font-size: 10px; line-height: 1.6; color: #475569; margin: 0 0 12px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Brand Banner Image Row (Fully visible inline img) -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding: 0; margin: 0; line-height: 0;">
                        ${getPremiumBrandedBannerHtml(bannerUrl, { primaryColor: '#10b981' }, 620, true)}
                    </td>
                </tr>
            </table>

            <!-- Brand Title Group Row -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0b1122; border-bottom: 4px solid #10b981;">
                <tr>
                    <td align="center" valign="middle" style="padding: 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 24px 30px; border-collapse: collapse;">
                                <tr>
                                    <td align="left" valign="middle" style="width: 65%;">
                                        <!-- Brand Title Group -->
                                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0; border-collapse: collapse;">
                                            <tr>
                                                <td valign="middle" style="padding-right: 12px;">
                                                    <!-- Real Logo Icon -->
                                                    <div style="width: 44px; height: 44px; border-radius: 50%; background-color: #0b1122; border: 2px solid #D4AF37; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 0 15px rgba(212,175,55,0.4);">
                                                        <img src="${BRANDING_CONFIG.logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" referrerpolicy="no-referrer" />
                                                    </div>
                                                </td>
                                                <td valign="middle">
                                                    <div style="font-family: 'Times New Roman', Times, serif; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #fff4d0; line-height: 1.2;">
                                                        First Pacific Bank
                                                    </div>
                                                    <div style="font-family: sans-serif; font-size: 8px; font-weight: bold; letter-spacing: 2.5px; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">
                                                        Private Wealth &amp; Trust
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Premium Trust Badge Capsule -->
                                        <div style="margin-top: 14px; display: inline-block; background-color: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.3); padding: 4px 10px; border-radius: 30px;">
                                            <span style="font-family: sans-serif; font-size: 7.5px; color: #FFF4D0; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                                                🏦 U.S. CERTIFIED BANCSHARES &bull; MEMBER OCC
                                            </span>
                                        </div>
                                    </td>
                                    <td align="right" valign="middle" style="width: 35%;">
                                        <!-- High Resolution Real Human Bank Representative -->
                                        <div style="display: inline-block; width: 85px; height: 85px; border-radius: 50%; border: 2.5px solid #D4AF37; overflow: hidden; background-color: #090e17; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                                            <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=250&auto=format&fit=crop" alt="Client Advisor" style="width: 100%; height: 100%; object-fit: cover; display: block;" referrerpolicy="no-referrer">
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            <div class="cert-body">
                <div class="cert-title-container">
                    <div class="cert-badge"><span>Sovereign Underwriters</span></div>
                    <h2 class="cert-title-main">Credit Line Resolution</h2>
                    <p class="cert-sub">Certified Credit Solvency Dossier</p>
                </div>
                
                <p class="cert-message">
                    This document certifies that <strong>${params.fullName}</strong> is an authorized client under <strong>${BRANDING_CONFIG.bankName}</strong> and possesses certified liquidity backing reserves matching credit guidelines as documented on the central clearance nodes.
                </p>
                
                <table class="ledger-table" width="100%">
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certificate Serial Number</td>
                        <td class="ledger-value" style="color: #10b981; font-family: monospace;">${params.serialNumber}</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certified Payer</td>
                        <td class="ledger-value">${params.fullName}</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Primary Account Group</td>
                        <td class="ledger-value">Private Enclave VIP (*${params.accountLastFour})</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Certified Credit Limit Cap</td>
                        <td class="ledger-value"><span style="color: #10b981; font-family: monospace; font-size: 13px; font-weight: 900;">USD $${params.creditLimit}</span></td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Collateral Asset Vol. Under Custody</td>
                        <td class="ledger-value" style="color: #FFF4D0;">USD $${params.collateralValue}</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Institutional Credit Score</td>
                        <td class="ledger-value" style="color: #10b981; font-family: monospace;">${params.creditScore} (EXCELLENT A+)</td>
                    </tr>
                    <tr class="ledger-tr">
                        <td class="ledger-label">Resolution Value Date</td>
                        <td class="ledger-value">${params.issueDate}</td>
                    </tr>
                    <tr class="ledger-tr" style="border-bottom:none;">
                        <td class="ledger-label">Sanction Node Approval Status</td>
                        <td class="ledger-value" style="color: #10b981; font-family: monospace;">${params.status}</td>
                    </tr>
                </table>
                
                <div class="seal-container">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td width="35%" valign="top" align="left">
                                <p class="sig-title">Attestation</p>
                                <p class="sig-name">Marilyn G. Lawrence</p>
                                <p class="sig-role">Managing Director // Comptroller</p>
                            </td>
                            <td width="35%" valign="top" align="left">
                                <p class="sig-title">Attestation</p>
                                <p class="sig-name">Marcus Finch</p>
                                <p class="sig-role">Director // Chairman of Vaults</p>
                            </td>
                            <td width="30%" valign="top" align="right">
                                <div class="comptroller-stamp" style="border-color: #10b981; color: #10b981;">
                                    <div class="stamp-inner" style="color: #10b981;">CREDIT SEAL</div>
                                    <div class="stamp-role" style="color: #10b981;">RESERVES ADEQUATE</div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Cryptographic Ledger verification section -->
                <div style="background-color: #070c14; border: 1px solid #1a2638; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 8.5px; color: #475569; margin-top: 30px; word-break: break-all; line-height: 1.4; text-align: left;">
                    <div style="color: #cbd5e1; font-weight: bold; text-transform: uppercase; font-size: 8px; letter-spacing: 1px; margin-bottom: 6px;">Automated Cryptographic Verification Block</div>
                    <strong>SOVEREIGN CREDIT HASH SIGNATURE (ED25519):</strong> <span style="color: #38bdf8;">${params.hashSignature}</span><br/>
                    <strong>CLR CODE:</strong> INF-CREDIT-RESOLVE // SYNC NODE STATE: FULLY_STABLE
                </div>
            </div>
            
            <div class="links-row">
                <a href="https://firstpaba.com/verify?cert=${params.serialNumber}">Verify Credit Line</a>
                <a href="https://firstpaba.com/ledger?serial=${params.serialNumber}">Audit Reserves Node</a>
                <a href="${BRANDING_CONFIG.supportUrl}">Customer Support</a>
            </div>
            
            <div class="footer">
                <div style="color: #cbd5e1; font-size: 8px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Institutional Credit Notice</div>
                <p>Private Wealth Credit and Solvency certificates are issued pursuing the Sovereign Enclave under First Pacific Private Group specifications. Securities are verified using ledger checks and are collateral-backed in accordance with regulatory solvency ratios of the Office of the Comptroller of the Currency (OCC).</p>
                <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px; font-size: 8px; font-weight: bold; letter-spacing: 1.5px; color: #334155; text-transform: uppercase;">
                    SECURE CERT ID: Credit-${params.serialNumber} // &copy; ${currentYear} FIRST PACIFIC GROUP
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

export interface ExternalPaymentInstructionParams {
    recipientName: string;
    recipientAccountNumber: string;
    recipientBankName: string;
    routingNumber: string;
    swiftBic: string;
    amount: number;
    referenceCode: string;
    customizationOptions?: {
        brandingStyle?: 'classic-gold' | 'midnight-navy' | 'swiss-minimal';
        institutionName?: string;
        priorityLevel?: string;
        complianceFooter?: string;
        showSeal?: boolean;
    };
}

/**
 * Generates a customizable, high-fidelity external payment instructions email template
 */
export const generateExternalPaymentInstructionsEmail = (params: ExternalPaymentInstructionParams): string => {
    const opts = params.customizationOptions || {};
    const style = opts.brandingStyle || 'classic-gold';
    const instName = opts.institutionName || 'FIRST PACIFIC GLOBAL';
    const priority = opts.priorityLevel || 'IMMEDIATE DIRECT CORRESPONDENT';
    const footerText = opts.complianceFooter || 'This private payment instruction sheet is lock-sealed in compliance with central clearing standards. Audited via ISO-20022 security node directives.';
    const showSeal = opts.showSeal !== false;

    // Styling constants based on style choice
    let bgColors = { bodyBg: '#060913', cardBg: '#0b1122', textColor: '#cbd5e1', accent: '#ca8a04', border: '#dba114', labelColor: '#94a3b8' };
    
    if (style === 'midnight-navy') {
        bgColors = { bodyBg: '#020617', cardBg: '#0f172a', textColor: '#94a3b8', accent: '#3b82f6', border: '#1e3a8a', labelColor: '#64748b' };
    } else if (style === 'swiss-minimal') {
        bgColors = { bodyBg: '#f8fafc', cardBg: '#ffffff', textColor: '#334155', accent: '#ef4444', border: '#cbd5e1', labelColor: '#64748b' };
    }

    const goldSealBase64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="%23ca8a04" stroke-width="3"/><circle cx="60" cy="60" r="50" fill="none" stroke="%23854d0e" stroke-width="1"/><text x="60" y="45" font-family="serif" font-size="20" font-weight="bold" fill="%23ca8a04" text-anchor="middle">★</text><text x="60" y="65" font-family="sans-serif" font-size="8" font-weight="bold" fill="%231e3a8a" text-anchor="middle">AUTHORIZED</text><text x="60" y="75" font-family="sans-serif" font-size="8" font-weight="bold" fill="%231e3a8a" text-anchor="middle">BANK SEAL</text><text x="60" y="90" font-family="monospace" font-size="5" fill="%23ca8a04" text-anchor="middle">• SECURE NODE •</text></svg>`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>External Payment Instructions - ${instName}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${bgColors.bodyBg}; margin: 0; padding: 30px 10px; color: ${bgColors.textColor}; }
            .container { max-width: 600px; margin: 0 auto; background-color: ${bgColors.cardBg}; border-radius: 20px; overflow: hidden; border: 1px solid ${bgColors.border}; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
            .header { padding: 30px 24px; text-align: center; border-bottom: 1px solid ${bgColors.border}; background: rgba(0,0,0,0.1); }
            .content { padding: 35px 30px; }
            .table-container { margin: 24px 0; border: 1px solid ${bgColors.border}; border-radius: 12px; overflow: hidden; }
            .instruction-table { width: 100%; border-collapse: collapse; }
            .instruction-table th, .instruction-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid ${bgColors.border}; }
            .instruction-table th { background-color: rgba(0,0,0,0.2); font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${bgColors.accent}; letter-spacing: 1px; }
            .instruction-table td { font-size: 13px; color: ${style === 'swiss-minimal' ? '#0f172a' : '#ffffff'}; }
            .label { color: ${bgColors.labelColor} !important; font-size: 11px !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .amount-badge { font-size: 18px !important; font-weight: 800; color: ${bgColors.accent} !important; font-family: monospace; }
            .footer { padding: 24px; text-align: center; font-size: 10px; border-top: 1px solid ${bgColors.border}; background-color: rgba(0,0,0,0.05); color: ${bgColors.labelColor}; }
            .seal-wrapper { text-align: center; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size: 20px; font-weight: 950; letter-spacing: 1px; color: ${style === 'swiss-minimal' ? '#0f172a' : '#ffffff'}; font-family: serif; text-transform: uppercase;">
                    ${instName}
                </div>
                <div style="font-size: 9px; font-weight: 800; letter-spacing: 4px; color: ${bgColors.accent}; text-transform: uppercase; margin-top: 6px; font-family: monospace;">
                    EXTERNAL SETTLEMENT DIRECTIVE
                </div>
            </div>
            
            <div class="content">
                <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    An external wire transfer form has been processed. Please find the customizable bank-branded clearing routing instructions below. Deliver these coordinates to your premium advisor or corresponding hub to complete final payment sweep.
                </p>

                <div class="table-container">
                    <table class="instruction-table">
                        <thead>
                            <tr>
                                <th colspan="2">Correspondent Clearance Specifications</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="label">Reference ID</td>
                                <td style="font-family: monospace; font-weight: bold;">${params.referenceCode}</td>
                            </tr>
                            <tr>
                                <td class="label">Amount Sweep</td>
                                <td class="amount-badge">$${Number(params.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</td>
                            </tr>
                            <tr>
                                <td class="label">Intermediary Institution</td>
                                <td>${params.recipientBankName}</td>
                            </tr>
                            <tr>
                                <td class="label">Beneficiary Account</td>
                                <td style="font-family: monospace;">${params.recipientAccountNumber}</td>
                            </tr>
                            <tr>
                                <td class="label">Beneficiary Legal Name</td>
                                <td><strong>${params.recipientName}</strong></td>
                            </tr>
                            <tr>
                                <td class="label">ABA / Routing Number</td>
                                <td style="font-family: monospace;">${params.routingNumber}</td>
                            </tr>
                            <tr>
                                <td class="label">SWIFT / BIC Code</td>
                                <td style="font-family: monospace; font-weight: bold;">${params.swiftBic}</td>
                            </tr>
                            <tr>
                                <td class="label">Clearance Speed Portal</td>
                                <td style="font-weight: bold; color: ${bgColors.accent};">${priority}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                ${showSeal ? `
                <div class="seal-wrapper">
                    <img src="${goldSealBase64}" width="110" height="110" alt="Authorized Treasury Seal" style="display: block; margin: 0 auto; border: none;" />
                    <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: ${bgColors.accent}; text-transform: uppercase; margin-top: 6px;">COMPLIANCE VERIFIED NODE</div>
                </div>
                ` : ''}
            </div>

            <div class="footer">
                <p style="margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; font-size: 8px; letter-spacing: 1px;">Sovereign Clearing Notice</p>
                <p style="margin: 0; line-height: 1.5;">${footerText}</p>
                <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 12px; font-size: 8px; font-weight: bold;">
                    AUTHENTICATED SWIFT LEDGER // SYNC STATUS: SECURED
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Sends a premium US-bank style onboarding email to newly created users in real-time.
 */
export const sendOnboardingEmail = async (
    user: { name: string; email: string; ssn?: string; bankIdNumber?: string },
    accounts: any[],
    password?: string,
    pin?: string,
    initialBalance?: number,
    brandOptions?: BrandOptions,
    pdfAttachmentBase64?: string
): Promise<EmailResponse> => {
    try {
        console.log(`[ONBOARDING_EMAIL] Constructing premium welcome kit for: ${user.email}`);

        const customIssuer = brandOptions?.customIssuer || 'First Pacific Bank';
        const subject = `Welcome to ${customIssuer} – Your Private Premium Banking Credentials`;
        
        // Build accounts representation
        let accountsHtml = '';
        if (accounts && accounts.length > 0) {
            accounts.forEach((acct) => {
                const acctNum = acct.fullAccountNumber || acct.accountNumber || 'Pending Allocation';
                const routingNum = acct.routingNumber || '122000218';
                const bal = acct.balance !== undefined ? acct.balance : (initialBalance || 0);
                const featuresList = (acct.features || []).map((f: string) => `<li>${f}</li>`).join('');

                accountsHtml += `
                <div style="margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #0f172a; padding: 12px 16px; color: #ffffff; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${acct.nickname || acct.type || 'Sovereign Checking Account'}
                    </div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: #ffffff;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px 16px; font-size: 13px; color: #475569;" width="40%">Account Number</td>
                            <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right; font-family: monospace; letter-spacing: 1px;">${acctNum}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px 16px; font-size: 13px; color: #475569;">Routing Transit Number (ABA)</td>
                            <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">${routingNum}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px 16px; font-size: 13px; color: #475569;">SWIFT / BIC Code</td>
                            <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">FPBAUS33XXX</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px 16px; font-size: 13px; color: #475569;">Initial Allocated Balance</td>
                            <td style="padding: 12px 16px; font-size: 14px; font-weight: 850; color: #16a34a; text-align: right; font-family: monospace;">$${Number(bal).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</td>
                        </tr>
                        ${featuresList ? `
                        <tr>
                            <td colspan="2" style="padding: 16px; background-color: #f8fafc;">
                                <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Premium Enabled Features:</div>
                                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.6;">
                                    ${featuresList}
                                </ul>
                            </td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
                `;
            });
        } else {
            accountsHtml = `
            <div style="padding: 16px; background-color: #f1f5f9; border-radius: 8px; text-align: center; color: #475569; font-size: 13px;">
                Your premium banking ledgers are being provisioned by our treasury clearance team in real-time.
            </div>
            `;
        }

        // Credentials section if available
        let credentialsHtml = '';
        if (password || pin) {
            credentialsHtml = `
            <div style="margin: 28px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-size: 12px; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">✅ VERIFIED IDENTITY PROFILE</div>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                    ${user.bankIdNumber ? `
                    <tr>
                        <td style="font-size: 13px; color: #475569; padding: 6px 0;" width="40%">Bank Specific ID</td>
                        <td style="font-size: 13px; font-weight: bold; color: #0f172a; font-family: monospace;">${user.bankIdNumber}</td>
                    </tr>
                    ` : ''}
                    ${user.ssn ? `
                    <tr>
                        <td style="font-size: 13px; color: #475569; padding: 6px 0;">Govt ID / SSN</td>
                        <td style="font-size: 13px; font-weight: bold; color: #0f172a; font-family: monospace;">***-**-${user.ssn.slice(-4)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="font-size: 13px; color: #475569; padding: 6px 0;">KYC Clearance Status</td>
                        <td style="font-size: 13px; font-weight: bold; color: #16a34a; font-family: monospace;">CLEARED & VERIFIED</td>
                    </tr>
                </table>

                <div style="font-size: 12px; font-weight: bold; color: #854d0e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-top: 16px; border-top: 1px solid #e2e8f0;">🔒 SECURE ACCESS CREDENTIALS</div>
                <p style="font-size: 13px; color: #713f12; margin: 0 0 12px 0; line-height: 1.5;">
                    For your security, we have generated temporary secure credentials for your first sign-in. Please change these immediately upon entering the client portal.
                </p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${password ? `
                    <tr>
                        <td style="font-size: 13px; color: #713f12; padding: 6px 0;" width="40%">Temporary Password</td>
                        <td style="font-size: 13px; font-weight: bold; color: #0f172a; font-family: monospace; letter-spacing: 1px;">${password}</td>
                    </tr>
                    ` : ''}
                    ${pin ? `
                    <tr>
                        <td style="font-size: 13px; color: #713f12; padding: 6px 0;">Temporary PIN</td>
                        <td style="font-size: 13px; font-weight: bold; color: #0f172a; font-family: monospace; letter-spacing: 1.5px;">${pin}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            `;
        }

        // Action URLs
        const activeTheme = brandOptions?.emailTheme || 'classic';
        const primaryColor = brandOptions?.primaryColor || '#D4AF37';

        // Check if window is defined to safely construct clientPortalUrl
        const clientPortalUrl = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'https://firstpaba.com';

        const bodyContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 0;">Dear ${user.name || 'Premium Client'},</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                Congratulations and welcome to <strong>${customIssuer}</strong>. We are pleased to inform you that your secure private wealth banking profile and associated depository accounts have been fully created, verified, and activated in real-time.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                As a premier financial institution in the United States, we are dedicated to providing you with institutional-grade clearing, top-tier asset security, and fluid liquidity services. Your new secure coordinates and operational specifications are detailed below.
            </p>

            ${credentialsHtml}

            <div style="font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 12px 0;">🏛️ DEPOSITORY SPECIFICATIONS & LEDGER COORDINATES</div>
            
            ${accountsHtml}

            <div style="margin: 28px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-size: 12px; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">✅ SECURITY & ONBOARDING STEPS</div>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                    <li style="margin-bottom: 8px;"><strong>Access Client Portal:</strong> Click the secure access link below to sign in using your temporary credentials.</li>
                    <li style="margin-bottom: 8px;"><strong>Update Passcode:</strong> Navigate to security settings to set a unique personal passcode and multi-factor authorization.</li>
                    <li style="margin-bottom: 8px;"><strong>Activate Sovereign Debit Card:</strong> Review your debit card options inside the cards hub for digital wallet integration.</li>
                    <li><strong>Link Funding Sources:</strong> Use your ABA routing and account coordinates to authorize incoming ACH/Wire sweeps.</li>
                </ol>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #64748b; font-style: italic; margin-top: 24px;">
                This onboarding kit contains sensitive institutional credentials. Please store this copy in a secure or encrypted archive. If you have any questions, your dedicated private wealth team is available 24/7/365 at ${BRANDING_CONFIG.phone}.
            </p>
        </div>
        `;

        const htmlBody = getStandardEmailSkeleton(`Welcome to ${customIssuer}`, bodyContent, {
            ...brandOptions,
            actionText: 'Sign In to Client Portal',
            actionUrl: clientPortalUrl,
            emailTheme: activeTheme,
            primaryColor: primaryColor
        });

        const attachments = pdfAttachmentBase64 ? [{
            filename: 'Welcome_Kit_Credentials.pdf',
            content: pdfAttachmentBase64
        }] : undefined;

        const response = await sendEmail(user.email, subject, htmlBody, attachments);
        return response;
    } catch (err: any) {
        console.error('[ONBOARDING_EMAIL] Failed to dispatch onboarding welcome kit:', err);
        return { success: false, error: err.message || 'Onboarding email failure' };
    }
};
