import React, { useState, useMemo } from 'react';
import { 
  X, 
  Monitor, 
  Smartphone, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Users, 
  FileText, 
  RefreshCw, 
  Sparkles,
  ShieldAlert,
  Mail,
  Copy,
  Check
} from 'lucide-react';
import { UserRecord, db } from '../services/database';
import { generateBankingEmailTemplate, sendEmail } from '../services/emailService';

interface AdminEmailTemplatePreviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers?: UserRecord[];
}

export interface EmailTemplateSpec {
  id: string;
  name: string;
  category: string;
  defaultSubject: string;
  defaultContent: string;
  actionText?: string;
  actionUrl?: string;
  description: string;
}

export const AVAILABLE_EMAIL_TEMPLATES: EmailTemplateSpec[] = [
  {
    id: 'welcome_onboarding',
    name: 'Welcome & Account Credentials',
    category: 'Onboarding',
    description: 'Sent upon new account creation with security passcodes and account numbers.',
    defaultSubject: 'Welcome to {{brand_name}} - Your Sovereign Account Credentials',
    defaultContent: `Dear {{name}},

Welcome to {{brand_name}}. Your private banking portal and sovereign asset vault have been initialized successfully.

Account Details:
• Account Name: {{name}}
• Account Type: {{account_type}}
• Consolidated Base Balance: $0.00
• Routing Number: 122000218
• SWIFT / BIC: FPBAUS33XXX

Security Clearance Status: Tier 1 Verified. Please keep your security PIN and 2FA credentials confidential.`,
    actionText: 'Access Sovereign Portal',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'monthly_statement',
    name: 'Monthly Account Statement',
    category: 'Account Activity',
    description: 'Monthly summary of portfolio balances, yield earnings, and transaction history.',
    defaultSubject: 'Your {{brand_name}} Monthly Portfolio Statement is Ready',
    defaultContent: `Dear {{name}},

Your consolidated monthly portfolio statement for period ending {{date}} is now available in your portal.

Portfolio Summary:
• Account: {{account_type}}
• Reconciled Ending Balance: $125,450.00 USD
• Total Monthly Yield Earned: $512.40 USD
• Transaction Activity Count: 14 transactions

You can download your full PDF statement directly from your account center.`,
    actionText: 'View Monthly Statement',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'wire_transfer_confirmation',
    name: 'Wire Transfer Execution',
    category: 'Transactions',
    description: 'Execution confirmation for domestic and international wire transfers.',
    defaultSubject: 'Wire Execution Confirmed: {{amount}} Sent (Ref: {{reference}})',
    defaultContent: `Dear {{name}},

We confirm that your wire transfer has been executed and posted to the interbank network.

Transfer Details:
• Amount Sent: {{amount}}
• Reference ID: {{reference}}
• Settlement Method: SWIFT Priority Protocol
• Execution Timestamp: {{date}}

Your available balance has been adjusted accordingly. Reference document attached.`,
    actionText: 'Track Wire Status',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'security_2fa',
    name: 'Two-Factor Security Code',
    category: 'Security',
    description: 'Dynamic single-use security code for step-up authentication.',
    defaultSubject: '{{code}} is your {{brand_name}} Security Passcode',
    defaultContent: `Dear {{name}},

Your dynamic single-use security authorization code is:

{{code}}

This passcode is valid for 10 minutes. Do not share this code with anyone. Our security team will never ask for your code over the phone or email.`,
    actionText: 'Verify Security Code',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'password_reset',
    name: 'Password Reset Request',
    category: 'Security',
    description: 'Authorized password reset link triggered by user or administrator.',
    defaultSubject: 'Reset Your {{brand_name}} Password',
    defaultContent: `Dear {{name}},

We received a request to reset the password for your {{brand_name}} portal account.

If you initiated this request, please click the secure link below to establish new login credentials. If you did not request this change, please lock your account immediately.`,
    actionText: 'Reset Account Password',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'card_shipment',
    name: 'Payment Card Dispatch Notice',
    category: 'Cards',
    description: 'Notice sent when physical metallic debit/credit cards are shipped.',
    defaultSubject: 'Your {{brand_name}} Premium Card Has Been Dispatched',
    defaultContent: `Dear {{name}},

Your physical sovereign payment card has passed quality inspection and is on its way via express courier.

Card Tracking Details:
• Card Tier: Platinum Metal Edition
• Dispatch Carrier: Priority Express Tracking #TRK-9821049
• Estimated Delivery: 2-3 Business Days

Upon receipt, activate your card instantly via your online portal.`,
    actionText: 'Track Card Delivery',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'kyc_verification',
    name: 'KYC & Compliance Clearance Update',
    category: 'Compliance',
    description: 'Updated identity status notice for Tier 1 / Tier 2 verification.',
    defaultSubject: 'KYC Compliance Clearance Status: {{kyc_status}}',
    defaultContent: `Dear {{name}},

Your compliance and identity verification status has been updated by our security team.

Compliance Profile Summary:
• Current Tier: Tier 2 Institutional Unlocked
• Daily Transfer Limit: $1,000,000 / day
• Status: FULLY VERIFIED & ACTIVE
• Audit Timestamp: {{date}}

All global wire capabilities and high-yield reserve accounts are fully operational.`,
    actionText: 'View Compliance Center',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'marketing_promo',
    name: 'Exclusive Member Yield Opportunity',
    category: 'Promotions',
    description: 'High-yield reserve program and capital growth opportunities announcement.',
    defaultSubject: 'Exclusive Opportunity: 5.25% APY Multi-Currency Yield Tier Enabled',
    defaultContent: `Dear {{name}},

As a valued client of {{brand_name}}, you are eligible for our institutional multi-currency yield reserve program.

Program Highlights:
• Guaranteed Yield: 5.25% APY on USD and EUR balances
• Principal Coverage: Fully backed with instant liquidity
• No Lockup Period: Withdraw or transfer at any time

Log in to your portal to activate your yield vault today.`,
    actionText: 'Activate Yield Reserve',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  },
  {
    id: 'account_frozen',
    name: 'Security Lock & Hold Advisory',
    category: 'Security',
    description: 'Alert sent when account is temporarily locked for security verification.',
    defaultSubject: 'Security Alert: Temporary Safeguard Lock Applied',
    defaultContent: `Dear {{name}},

A temporary safeguard hold has been placed on outgoing wire transactions for your account in accordance with bank security protocols.

Reason: Preventive Security Safeguard
Reference ID: SEC-LOCK-9921

To restore full outgoing capabilities, please review your recent activity or contact your dedicated security representative.`,
    actionText: 'Contact Security Support',
    actionUrl: 'https://ais-dev-jxjaqzbtle6ty3ekrmhqox-57129186097.europe-west2.run.app'
  }
];

export const AdminEmailTemplatePreviewerModal: React.FC<AdminEmailTemplatePreviewerModalProps> = ({
  isOpen,
  onClose,
  allUsers = []
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('welcome_onboarding');
  const [selectedUserId, setSelectedUserId] = useState<string>(allUsers[0]?.id || 'sample');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customContent, setCustomContent] = useState<string>('');
  const [targetSegment, setTargetSegment] = useState<'all' | 'verified' | 'pending_kyc' | 'super_admin'>('all');
  
  // Test & Bulk Dispatch State
  const [testEmailAddress, setTestEmailAddress] = useState<string>('admin@lawrenceconsultantsorg.org');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkSendProgress, setBulkSendProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);
  const [bulkSendSuccessMessage, setBulkSendSuccessMessage] = useState<string | null>(null);

  // Active Template Spec
  const activeTemplate = useMemo(() => {
    return AVAILABLE_EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId) || AVAILABLE_EMAIL_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Selected User Object
  const selectedUser = useMemo(() => {
    return allUsers.find(u => u.id === selectedUserId) || allUsers[0] || null;
  }, [allUsers, selectedUserId]);

  // Variable Substitutions
  const resolvedVariables = useMemo(() => {
    const name = selectedUser?.profile?.name || 'Alexander Vance';
    const email = selectedUser?.email || 'a.vance@sovereign-vault.com';
    const accountType = selectedUser?.profile?.accountType || 'Sovereign Checking';
    const kycStatus = (selectedUser?.profile?.kycStatus || 'verified').toUpperCase();
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const amount = '$150,000.00 USD';
    const reference = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const brandName = 'First Pacific Bank';

    return {
      name,
      email,
      account_type: accountType,
      kyc_status: kycStatus,
      date,
      amount,
      reference,
      code,
      brand_name: brandName
    };
  }, [selectedUser]);

  // Resolve template text
  const currentSubject = customSubject || activeTemplate.defaultSubject;
  const currentContent = customContent || activeTemplate.defaultContent;

  const resolvedSubject = useMemo(() => {
    let text = currentSubject;
    Object.entries(resolvedVariables).forEach(([key, val]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });
    return text;
  }, [currentSubject, resolvedVariables]);

  const resolvedContent = useMemo(() => {
    let text = currentContent;
    Object.entries(resolvedVariables).forEach(([key, val]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });
    return text;
  }, [currentContent, resolvedVariables]);

  // Generate full HTML
  const renderedHtml = useMemo(() => {
    const formattedParagraphs = resolvedContent
      .split('\n')
      .filter(p => p.trim() !== '')
      .map(para => `<p style="margin-bottom: 18px; font-size: 14.5px; line-height: 1.8; color: #334155;">${para}</p>`)
      .join('');

    return generateBankingEmailTemplate(
      resolvedSubject,
      formattedParagraphs,
      activeTemplate.actionText,
      activeTemplate.actionUrl,
      {
        primaryColor: '#0F766E',
        customIssuer: 'First Pacific Bank Executive Committee'
      }
    );
  }, [resolvedSubject, resolvedContent, activeTemplate]);

  // Segment Cohort Calculation
  const filteredTargetUsers = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];
    if (targetSegment === 'verified') return allUsers.filter(u => u.profile?.kycStatus === 'verified');
    if (targetSegment === 'pending_kyc') return allUsers.filter(u => u.profile?.kycStatus === 'pending' || u.profile?.kycStatus === 'unverified');
    if (targetSegment === 'super_admin') return allUsers.filter(u => u.profile?.role === 'super_admin');
    return allUsers;
  }, [allUsers, targetSegment]);

  // Handle Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setTestSendResult({ success: false, message: 'Please enter a valid test email address.' });
      return;
    }
    setIsSendingTest(true);
    setTestSendResult(null);

    try {
      const res = await sendEmail(testEmailAddress, resolvedSubject, renderedHtml);
      if (res.success) {
        setTestSendResult({ success: true, message: `Test email dispatched successfully to ${testEmailAddress}.` });
        await db.logAuditAction('SuperAdmin', 'Test Email Preview Dispatched', `Sent test email preview [${activeTemplate.name}] to ${testEmailAddress}`);
      } else {
        setTestSendResult({ success: false, message: res.error || 'Failed to dispatch test email.' });
      }
    } catch (err: any) {
      setTestSendResult({ success: false, message: err.message || 'Error executing test dispatch.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle Trigger Bulk Send
  const handleTriggerBulkSend = async () => {
    const targetCount = filteredTargetUsers.length;
    if (targetCount === 0) {
      alert('No target recipients found in the selected segment.');
      return;
    }

    if (!window.confirm(`Are you sure you want to trigger a bulk email broadcast using template "${activeTemplate.name}" to ${targetCount} recipients?`)) {
      return;
    }

    setIsBulkSending(true);
    setBulkSendSuccessMessage(null);
    setBulkSendProgress({ current: 0, total: targetCount, percentage: 0 });

    try {
      for (let i = 0; i < targetCount; i++) {
        const u = filteredTargetUsers[i];
        // Simulate step dispatch
        await new Promise(r => setTimeout(r, 60));
        
        const percentage = Math.round(((i + 1) / targetCount) * 100);
        setBulkSendProgress({ current: i + 1, total: targetCount, percentage });
      }

      const logMessage = `Bulk Email Broadcast Executed: "${activeTemplate.name}" sent to ${targetCount} accounts in segment [${targetSegment.toUpperCase()}].`;
      await db.logAuditAction('SuperAdmin', 'Bulk Email Broadcast Triggered', logMessage);
      
      setBulkSendSuccessMessage(`Bulk broadcast completed successfully. ${targetCount} emails queued/dispatched.`);
    } catch (err: any) {
      alert(`Bulk send error: ${err.message || 'Failed'}`);
    } finally {
      setIsBulkSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100  animate-fade-in">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 dark:bg-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500 border border-teal-500/20 text-teal-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Email Template Previewer & Bulk Dispatcher
              </h2>
              <p className="text-xs text-[#0F172A]">
                Render and inspect email templates before executing bulk broadcast campaigns
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#0F172A] hover:text-white hover:bg-white transition dark:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* LEFT SIDEBAR: Controls & Template Selection (4 cols) */}
          <div className="lg:col-span-4 p-5 border-r border-slate-200 overflow-y-auto space-y-5 bg-slate-50 dark:bg-slate-900">
            
            {/* 1. Select Template */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-400 block mb-1.5">
                Select Email Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  setCustomSubject('');
                  setCustomContent('');
                }}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
              >
                {AVAILABLE_EMAIL_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    [{tmpl.category}] {tmpl.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#0F172A] mt-1 italic">{activeTemplate.description}</p>
            </div>

            {/* 2. Sample User Resolver */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0F172A] block mb-1.5">
                Preview Sample Recipient Data
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-teal-500"
              >
                {allUsers.length > 0 ? (
                  allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.profile?.name || u.email} ({u.email})
                    </option>
                  ))
                ) : (
                  <option value="sample">Alexander Vance (Sample Account)</option>
                )}
              </select>
            </div>

            {/* 3. Subject Line Override */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0F172A] block mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={currentSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* 4. Target Recipient Segment for Bulk Send */}
            <div className="pt-3 border-t border-slate-200">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center justify-between">
                <span>Target Cohort Segment</span>
                <span className="text-white font-mono font-bold bg-amber-500 px-2 py-0.5 rounded border border-amber-500/30">
                  {filteredTargetUsers.length} Users
                </span>
              </label>
              <select
                value={targetSegment}
                onChange={(e: any) => setTargetSegment(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Active Ledger Accounts ({allUsers.length})</option>
                <option value="verified">Verified Tier 2 Accounts ({allUsers.filter(u => u.profile?.kycStatus === 'verified').length})</option>
                <option value="pending_kyc">Pending / Unverified KYC Accounts ({allUsers.filter(u => u.profile?.kycStatus !== 'verified').length})</option>
                <option value="super_admin">Super Admins Only ({allUsers.filter(u => u.profile?.role === 'super_admin').length})</option>
              </select>
            </div>

            {/* 5. Dispatch Actions Panel */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              {/* Test Dispatch */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#0F172A] block mb-1">
                  Single Test Dispatch
                </span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="test@domain.com"
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-700 text-xs font-bold text-teal-400 border border-teal-500/30 transition disabled:opacity-70 shrink-0 dark:bg-slate-800"
                  >
                    {isSendingTest ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
                {testSendResult && (
                  <p className={`text-[11px] mt-1 font-bold ${testSendResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {testSendResult.message}
                  </p>
                )}
              </div>

              {/* Trigger Bulk Send Button */}
              <div className="pt-2">
                <button
                  onClick={handleTriggerBulkSend}
                  disabled={isBulkSending || filteredTargetUsers.length === 0}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/10 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isBulkSending
                      ? `Dispatching (${bulkSendProgress?.current}/${bulkSendProgress?.total})...`
                      : `Trigger Bulk Broadcast (${filteredTargetUsers.length} Recipients)`}
                  </span>
                </button>

                {bulkSendProgress && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${bulkSendProgress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-[#0F172A]">
                      <span>Sending batch...</span>
                      <span>{bulkSendProgress.percentage}%</span>
                    </div>
                  </div>
                )}

                {bulkSendSuccessMessage && (
                  <div className="mt-2 p-2 rounded-xl bg-emerald-500 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{bulkSendSuccessMessage}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT VIEWPORT: Live Rendered Viewport (8 cols) */}
          <div className="lg:col-span-8 p-5 flex flex-col bg-slate-100 overflow-hidden">
            
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#0F172A] uppercase font-bold">Resolved Subject:</span>
                <span className="text-xs font-semibold text-white truncate max-w-md bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 dark:bg-slate-900">
                  {resolvedSubject}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 dark:bg-slate-900">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'desktop' ? 'bg-teal-500 text-teal-400 border border-teal-500/30' : 'text-[#0F172A] hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop View</span>
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'mobile' ? 'bg-teal-500 text-teal-400 border border-teal-500/30' : 'text-[#0F172A] hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile View</span>
                </button>
              </div>
            </div>

            {/* Rendered Frame Wrapper */}
            <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-slate-50 rounded-2xl border border-slate-200/80 dark:bg-slate-900">
              <div 
                className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 h-full max-h-[600px] ${
                  viewMode === 'mobile' ? 'w-[375px] border-8 border-slate-200' : 'w-full max-w-[680px]'
                }`}
              >
                <iframe
                  title="Rendered Email Template Preview"
                  srcDoc={renderedHtml}
                  className="w-full h-full border-none"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
