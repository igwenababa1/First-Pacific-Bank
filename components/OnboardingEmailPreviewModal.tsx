import React, { useState, useEffect } from 'react';
import { 
    XIcon, 
    MonitorIcon, 
    SmartphoneIcon, 
    SendIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    EyeIcon, 
    ShieldCheckIcon,
    SparklesIcon,
    CopyIcon,
    CheckIcon
} from 'lucide-react';
import { sendOnboardingEmail } from '../services/emailService';

interface OnboardingEmailPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onboardName: string;
    onboardEmail: string;
    onboardPassword?: string;
    onboardPin?: string;
    onboardBalance: string | number;
    onboardAccountType: 'checking' | 'savings' | 'business';
    systemOptions?: any;
}

export const OnboardingEmailPreviewModal: React.FC<OnboardingEmailPreviewModalProps> = ({
    isOpen,
    onClose,
    onboardName,
    onboardEmail,
    onboardPassword = '• • • • • • • •',
    onboardPin = '• • • •',
    onboardBalance,
    onboardAccountType,
    systemOptions
}) => {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'meta'>('preview');
    const [testEmail, setTestEmail] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
    const [copiedHtml, setCopiedHtml] = useState(false);
    const [overrideTheme, setOverrideTheme] = useState<'classic' | 'chase' | 'bofa' | null>(null);

    // Mock generated account details for the preview
    const balanceNum = parseFloat(onboardBalance as string) || 0;
    const mockAccountNumber = '10938472910';
    const mockRoutingNumber = '122000218';
    const mockSwiftCode = 'FPBAUS33XXX';

    const getAccountTypeName = () => {
        if (onboardAccountType === 'savings') return 'Private Savings Ledger';
        if (onboardAccountType === 'business') return 'Corporate / Business Ledger';
        return 'Sovereign Checking Account';
    };

    const getAccountFeatures = () => {
        if (onboardAccountType === 'savings') {
            return [
                'High-Yield Interest (4.85% APY)',
                'Auto-Sweep Security Vault',
                'Institutional Asset Insurance',
                'Unlimited Liquidity Reserves'
            ];
        }
        if (onboardAccountType === 'business') {
            return [
                'Commercial Wire Cleared',
                'Multi-Officer Signatory Panel',
                'Real-time Payroll Batching',
                'Treasury Capital Reserves Access'
            ];
        }
        return [
            'Real-time Instant Settlement',
            'Unlimited Global Wire Permits',
            'Smart Priority Support',
            'Chase QuickPay / Zelle Enabled',
            'Premium Sovereign Debit Card'
        ];
    };

    // Construct preview properties matching sendOnboardingEmail
    const activeTheme = overrideTheme || systemOptions?.emailTheme || 'classic';
    const primaryColor = activeTheme === 'chase' ? '#0060a3' : activeTheme === 'bofa' ? '#e31837' : (systemOptions?.primaryColor || '#D4AF37');
    const customIssuer = systemOptions?.customIssuer || 'First Pacific Bank';

    // Generate simulated HTML body for rendering inside the mock email viewport
    const generateSimulatedHtml = () => {
        const title = `Welcome to ${customIssuer}`;
        
        let bannerImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&h=200&auto=format&fit=crop';
        if (onboardAccountType === 'savings') {
            bannerImage = 'https://images.unsplash.com/photo-1610375461246-83df859d8222?q=80&w=600&h=200&auto=format&fit=crop';
        } else if (onboardAccountType === 'business') {
            bannerImage = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=600&h=200&auto=format&fit=crop';
        }

        const featuresListHtml = getAccountFeatures().map(f => `<li style="margin-bottom: 4px;">${f}</li>`).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
                .wrapper { width: 100%; background-color: #f8fafc; padding: 24px 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .header-banner { background-size: cover; background-position: center; height: 160px; position: relative; }
                .overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%); }
                .header-text { position: absolute; bottom: 20px; left: 24px; color: #ffffff; }
                .header-text h1 { margin: 0; font-size: 22px; font-weight: 850; letter-spacing: -0.5px; }
                .content { padding: 32px 24px; }
                .credentials-box { background-color: #fffbeb; border: 1px solid #fef08a; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 16px; margin: 24px 0; }
                .credentials-title { font-size: 11px; font-weight: bold; color: #854d0e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .credentials-table { width: 100%; font-size: 13px; }
                .credentials-table td { padding: 4px 0; }
                .credentials-val { font-family: monospace; font-weight: bold; color: #0f172a; letter-spacing: 1px; }
                .account-card { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-top: 16px; }
                .account-header { background-color: #0f172a; padding: 12px 16px; color: #ffffff; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
                .account-table { width: 100%; border-collapse: collapse; }
                .account-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
                .btn-cta { display: inline-block; background-color: ${primaryColor}; color: #ffffff; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; text-align: center; font-size: 14px; margin: 24px 0; }
                .footer { background-color: #0f172a; padding: 32px 24px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 4px solid ${primaryColor}; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header-banner" style="position: relative; overflow: hidden; height: 160px; background-color: #0f172a;">
                        <img src="${bannerImage}" alt="Onboarding Banking Banner" style="width: 100%; height: 100%; object-fit: cover; display: block;" referrerpolicy="no-referrer" />
                        <div class="overlay"></div>
                        <div class="header-text">
                            <h1>Welcome to ${customIssuer}</h1>
                        </div>
                    </div>
                    <div class="content">
                        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 0;">Dear ${onboardName || 'Premium Client'},</p>
                        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
                            Congratulations and welcome to <strong>${customIssuer}</strong>. We are pleased to inform you that your secure private wealth banking profile and associated depository accounts have been fully created, verified, and activated in real-time.
                        </p>
                        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
                            As a premier financial institution in the United States, we are dedicated to providing you with institutional-grade clearing, top-tier asset security, and fluid liquidity services.
                        </p>

                        <div class="credentials-box" style="background-color: #f8fafc; border-color: #e2e8f0; border-left: none;">
                            <div class="credentials-title" style="color: #1e293b;">✅ VERIFIED IDENTITY PROFILE</div>
                            <table class="credentials-table" style="margin-bottom: 20px;">
                                <tr>
                                    <td width="40%" style="color: #475569;">Bank Specific ID</td>
                                    <td class="credentials-val">ID-XXXXXXXX</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569;">Govt ID / SSN</td>
                                    <td class="credentials-val">***-**-XXXX</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569;">KYC Clearance Status</td>
                                    <td class="credentials-val" style="color: #16a34a;">CLEARED & VERIFIED</td>
                                </tr>
                            </table>

                            <div class="credentials-title" style="padding-top: 16px; border-top: 1px solid #e2e8f0;">🔒 SECURE ACCESS CREDENTIALS</div>
                            <p style="font-size: 13px; color: #713f12; margin: 0 0 10px 0; line-height: 1.4;">
                                Temporary secure credentials for your first sign-in. Change these immediately upon portal access.
                            </p>
                            <table class="credentials-table">
                                <tr>
                                    <td width="40%" style="color: #713f12;">Temporary Password</td>
                                    <td class="credentials-val">${onboardPassword}</td>
                                </tr>
                                <tr>
                                    <td style="color: #713f12;">Temporary PIN</td>
                                    <td class="credentials-val">${onboardPin}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 8px 0;">🏛️ DEPOSITORY SPECIFICATIONS & LEDGER COORDINATES</div>
                        
                        <div class="account-card">
                            <div class="account-header">
                                ${getAccountTypeName()}
                            </div>
                            <table class="account-table">
                                <tr>
                                    <td style="color: #475569;">Account Number</td>
                                    <td style="font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">${mockAccountNumber}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569;">Routing Transit Number (ABA)</td>
                                    <td style="font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">${mockRoutingNumber}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569;">SWIFT / BIC Code</td>
                                    <td style="font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">${mockSwiftCode}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569;">Initial Allocated Balance</td>
                                    <td style="font-weight: bold; color: #16a34a; text-align: right; font-family: monospace; font-size: 14px;">
                                        $${balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="background-color: #f8fafc; padding: 16px;">
                                        <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Enabled Features:</div>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.5;">
                                            ${featuresListHtml}
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align: center;">
                            <a href="#" class="btn-cta">Sign In to Client Portal</a>
                        </div>

                        <p style="font-size: 13px; line-height: 1.5; color: #64748b; font-style: italic;">
                            This onboarding kit contains sensitive institutional credentials. Please store this copy in a secure or encrypted archive.
                        </p>
                    </div>
                    <div class="footer">
                        <div style="font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 1px; margin-bottom: 4px;">${customIssuer.toUpperCase()}</div>
                        <div style="color: #94a3b8; margin-bottom: 16px;">Sovereign Clearance & Clearing Operations</div>
                        <p style="margin: 0 0 12px 0; color: #64748b; line-height: 1.5;">
                            This message was sent securely on behalf of ${customIssuer} clearing nodes. Operational codes and assets are protected under US Federal depository clearance regulations.
                        </p>
                        <p style="margin: 0; color: #475569;">© 2026 ${customIssuer}. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    };

    const handleCopyHtml = () => {
        navigator.clipboard.writeText(generateSimulatedHtml());
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
    };

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail) return;

        setIsSendingTest(true);
        setSendResult(null);

        try {
            const mockAcct = {
                accountNumber: mockAccountNumber,
                routingNumber: mockRoutingNumber,
                balance: balanceNum,
                nickname: getAccountTypeName(),
                features: getAccountFeatures()
            };

            const response = await sendOnboardingEmail(
                { name: onboardName || 'Test Client', email: testEmail },
                [mockAcct],
                onboardPassword,
                onboardPin,
                balanceNum,
                {
                    ...systemOptions,
                    emailTheme: activeTheme,
                    primaryColor: primaryColor
                }
            );

            if (response.success) {
                setSendResult({
                    success: true,
                    message: `Test onboarding kit dispatched to ${testEmail} in real-time!`
                });
            } else {
                setSendResult({
                    success: false,
                    message: response.error || 'Failed to dispatch test email.'
                });
            }
        } catch (error: any) {
            setSendResult({
                success: false,
                message: error.message || 'An unexpected error occurred.'
            });
        } finally {
            setIsSendingTest(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-50  z-50 flex items-center justify-center p-4 overflow-y-auto dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col my-8 overflow-hidden h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                            <SparklesIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Onboarding Welcome Kit Review</h3>
                            <p className="text-xs text-[#0F172A] dark:text-white font-mono">Dynamic coordinates verification & styling preview</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white transition-all dark:bg-slate-800"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Dashboard Controls Toolbar */}
                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'preview' 
                                    ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-sm' 
                                    : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white'
                            }`}
                        >
                            Visual Review
                        </button>
                        <button 
                            onClick={() => setActiveTab('html')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'html' 
                                    ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-sm' 
                                    : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white'
                            }`}
                        >
                            HTML Code
                        </button>
                        <button 
                            onClick={() => setActiveTab('meta')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'meta' 
                                    ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-sm' 
                                    : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white'
                            }`}
                        >
                            Clearing Metadata
                        </button>
                    </div>

                    {activeTab === 'preview' && (
                        <div className="flex items-center gap-4">
                            {/* Device Mode Switcher */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-white/10">
                                <button 
                                    onClick={() => setViewMode('desktop')}
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === 'desktop' 
                                            ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                                            : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B]'
                                    }`}
                                    title="Desktop View"
                                >
                                    <MonitorIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('mobile')}
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === 'mobile' 
                                            ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                                            : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B]'
                                    }`}
                                    title="Mobile View"
                                >
                                    <SmartphoneIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Theme Preset Toggles */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Aesthetic Style:</span>
                                <div className="flex gap-1.5">
                                    <button 
                                        onClick={() => setOverrideTheme('classic')}
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                            activeTheme === 'classic'
                                                ? 'bg-amber-500 text-amber-500 border-amber-500/30'
                                                : 'bg-transparent text-[#0F172A] border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        Imperial Gold
                                    </button>
                                    <button 
                                        onClick={() => setOverrideTheme('chase')}
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                            activeTheme === 'chase'
                                                ? 'bg-blue-500 text-blue-500 border-blue-500/30'
                                                : 'bg-transparent text-[#0F172A] border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        Chase Royal
                                    </button>
                                    <button 
                                        onClick={() => setOverrideTheme('bofa')}
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                            activeTheme === 'bofa'
                                                ? 'bg-rose-500 text-rose-500 border-rose-500/30'
                                                : 'bg-transparent text-[#0F172A] border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        BofA Red
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Body split in Main Viewport + Quick actions */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-800">
                    
                    {/* Viewport Render Side */}
                    <div className="flex-1 p-6 flex items-center justify-center overflow-y-auto min-h-0">
                        {activeTab === 'preview' && (
                            <div 
                                className={`bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-white/10 transition-all duration-300 rounded-2xl overflow-hidden ${
                                    viewMode === 'mobile' ? 'w-full max-w-[380px] h-[650px]' : 'w-full max-w-[620px] h-[95%]'
                                }`}
                            >
                                {/* Simulated Mail Header */}
                                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-white/10 px-4 py-3 text-xs text-[#0F172A] dark:text-white">
                                    <div className="flex justify-between mb-1">
                                        <span><strong className="text-[#0F172A] dark:text-white">From:</strong> Operations &lt;onboarding@resend.dev&gt;</span>
                                        <span className="font-mono text-[10px]">🔒 US-CLEARING-SSL</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span><strong className="text-[#0F172A] dark:text-white">To:</strong> {onboardEmail || '[New Client Email]'}</span>
                                        <span>Just Now</span>
                                    </div>
                                    <div className="mt-2 text-[#1E293B] dark:text-slate-100 font-bold">
                                        Subject: Welcome to {customIssuer} – Your Private Premium Banking Credentials
                                    </div>
                                </div>

                                {/* Frame containing the compiled HTML preview */}
                                <iframe 
                                    srcDoc={generateSimulatedHtml()} 
                                    className="w-full h-full border-none bg-white dark:bg-slate-800"
                                    title="Email Live Visual Preview"
                                />
                            </div>
                        )}

                        {activeTab === 'html' && (
                            <div className="w-full max-w-3xl h-[95%] bg-slate-50 border border-black/5 rounded-2xl p-5 flex flex-col font-mono text-xs text-emerald-400 overflow-hidden dark:bg-slate-900">
                                <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F172A] font-sans">Compiled Email Template Source Code</span>
                                    <button 
                                        onClick={handleCopyHtml}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-white text-white transition-all text-[11px] font-sans dark:bg-slate-800"
                                    >
                                        {copiedHtml ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                        {copiedHtml ? 'Copied' : 'Copy HTML'}
                                    </button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={generateSimulatedHtml()} 
                                    className="flex-1 w-full bg-slate-100 border border-black/5 p-4 rounded-xl text-emerald-500 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary overflow-y-auto"
                                />
                            </div>
                        )}

                        {activeTab === 'meta' && (
                            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-md overflow-y-auto max-h-[90%] space-y-6">
                                <h4 className="text-base font-black text-[#0F172A] dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-3">
                                    Clearing & Security Coordination Checklist
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
                                        <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">ABA ROUTING NUMBER (US CLEARING)</div>
                                        <div className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">{mockRoutingNumber}</div>
                                        <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                                            <ShieldCheckIcon className="w-3.5 h-3.5" /> Checked & Active
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
                                        <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">SWIFT CODE (GLOBAL INTERMEDIARY)</div>
                                        <div className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">{mockSwiftCode}</div>
                                        <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                                            <ShieldCheckIcon className="w-3.5 h-3.5" /> Cleared (FPBAUS33XXX)
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
                                        <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">REPLICATED LEDGER NUMBER</div>
                                        <div className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">{mockAccountNumber}</div>
                                        <div className="text-[10px] text-[#0F172A] mt-1">Generated dynamically on confirmation</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-white/10">
                                        <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">FEDERAL DEPOSITORY COMPLIANCE</div>
                                        <div className="text-sm font-bold text-emerald-500">Auto-Verified (KYC: PASSED)</div>
                                        <div className="text-[10px] text-[#0F172A] mt-1">Safe harbor sovereign security enabled</div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/10 pt-4">
                                    <h5 className="text-xs font-bold uppercase text-[#0F172A] tracking-wider mb-3">Onboarding Payload JSON</h5>
                                    <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl overflow-x-auto text-[11px] font-mono text-[#0F172A]">
                                        {JSON.stringify({
                                            identity: {
                                                fullName: onboardName || '[Awaiting Name Input]',
                                                emailAddress: onboardEmail || '[Awaiting Email Input]',
                                                assignedLedgers: [{
                                                    type: getAccountTypeName(),
                                                    routing: mockRoutingNumber,
                                                    accountNum: mockAccountNumber,
                                                    swift: mockSwiftCode,
                                                    openingLiquidity: balanceNum
                                                }]
                                            },
                                            portalSecurity: {
                                                hasTemporaryPassword: !!onboardPassword,
                                                hasTemporaryPin: !!onboardPin
                                            },
                                            deliveryMethod: "Resend Secure API // SMTP"
                                        }, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Toolbar Panel: Live Test Dispatches */}
                    <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-100 dark:border-white/10 p-6 flex flex-col justify-between">
                        <div>
                            <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-3">Live Testing Portal</h4>
                            <p className="text-xs text-[#0F172A] dark:text-white mb-6 leading-relaxed">
                                Review how the template looks in a real inbox! Enter your personal testing address below to dispatch a fully configured welcome kit instantly.
                            </p>

                            <form onSubmit={handleSendTest} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#0F172A] tracking-widest mb-2">Test Recipient Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        placeholder="your-email@example.com" 
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSendingTest || !testEmail}
                                    className="w-full bg-primary hover:bg-emerald-400 text-[#0F172A] font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSendingTest ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                            Dispatching...
                                        </>
                                    ) : (
                                        <>
                                            <SendIcon className="w-3.5 h-3.5" />
                                            Send Test Kit
                                        </>
                                    )}
                                </button>
                            </form>

                            {sendResult && (
                                <div className={`mt-5 p-4 rounded-xl border flex items-start gap-2.5 text-xs font-bold ${
                                    sendResult.success 
                                        ? 'bg-emerald-500 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                        : 'bg-rose-500 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                }`}>
                                    {sendResult.success ? (
                                        <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                                    )}
                                    <span className="leading-normal">{sendResult.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-white/10 text-[11px] text-[#0F172A] leading-relaxed">
                            <span className="font-bold uppercase text-[#0F172A] block mb-1">Aesthetic Sync Status</span>
                            Active brand settings ({customIssuer}) and colors will apply exactly to the final welcoming kit dispatched on user creation.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
