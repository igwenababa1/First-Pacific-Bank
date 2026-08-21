import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';
import { 
    UsersIcon, 
    PlusIcon, 
    ShieldCheckIcon, 
    EnvelopeIcon, 
    DevicePhoneMobileIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    DocumentCheckIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    BankIcon,
    CogIcon,
    ExclamationCircleIcon,
    SpinnerIcon,
    BriefcaseIcon,
    HeartIcon,
    PiggyBankIcon,
    TrophyIcon,
    PlusIcon as AddIcon,
    MessageSquareIcon,
    SparklesIcon,
    CheckCircleIcon as CheckIcon2,
    XCircleIcon,
    SendIcon,
    ArrowPathIcon
} from './Icons';
import { Account, AccountType } from '../types';

interface JointGoal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
}

interface JointTransactionRequest {
    id: string;
    amount: number;
    destination: string;
    date: string;
    initiatedBy: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
}

interface JointActivity {
    id: string;
    type: 'deposit' | 'withdrawal' | 'settings_change' | 'goal_fund' | 'auth_approved' | 'auth_rejected';
    description: string;
    actor: string;
    timestamp: string;
}

interface RecurringTransfer {
    id: string;
    amount: number;
    destination: string;
    frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
    nextDate: string;
    status: 'active' | 'paused';
}

interface JointAccount {
    id: string;
    type: 'partner' | 'business';
    status: 'active' | 'pending_verification' | 'pending_invite';
    coOwner: {
        name: string;
        email: string;
        phone: string;
        address?: string;
    };
    balance: number;
    accountNumber: string;
    permissions: {
        dualAuthRequirement: boolean;
        dualAuthThreshold: number;
    };
    alerts: {
        smsEnabled: boolean;
        emailEnabled: boolean;
    };
    goals: JointGoal[];
    pendingTransfers: JointTransactionRequest[];
    messages: ChatMessage[];
    aiInsights?: {
        savingsRate: string;
        categorySuggestions: string[];
    };
    activityLog: JointActivity[];
    recurringTransfers: RecurringTransfer[];
    loiConfig?: {
        totalAmount: number;
        expeditedShippingSelected: boolean;
        ssnOwner: string;
        ssnCoOwner: string;
        addressOwner: string;
        addressCoOwner: string;
        ownerSsnVerified: boolean;
        coOwnerSsnVerified: boolean;
        disclosuresSigned: boolean;
        disclosuresSignedDate?: string;
    };
}

const PARTNERSHIP_ESCROW_LEDGER: JointAccount = {
    id: 'ja_partnership_1184',
    type: 'business',
    status: 'active',
    coOwner: {
        name: 'Alexander Mercer',
        email: 'alex.mercer@innovativecapital.com',
        phone: '+1 (202) 555-0143',
        address: '789 West Oak Avenue, Arlington, VA 22201'
    },
    balance: 1184077.00,
    accountNumber: '•••• 1184',
    permissions: {
        dualAuthRequirement: true,
        dualAuthThreshold: 25000
    },
    alerts: {
        smsEnabled: true,
        emailEnabled: true
    },
    goals: [
        { id: 'g_p_1', title: 'Operational Liquidity Pool', targetAmount: 1184077, currentAmount: 1184077 }
    ],
    pendingTransfers: [],
    messages: [
        { id: 'm_p_1', sender: 'Alexander Mercer', text: 'Our joint Letter of Instruction is submitted. The subaccounts are fully established under sole signatory authority. Let me know when you run the split audit.', timestamp: 'Yesterday' }
    ],
    aiInsights: {
        savingsRate: 'The $1,184,077.00 primary capital is fully insulated with waived joint and several risks. Split allocation tracks perfectly.',
        categorySuggestions: [
            'Each signatory has sole signatory status for their respective 50% subaccount.',
            'SSN/TIN matching guarantees independent federal bookkeeping compliance.'
        ]
    },
    activityLog: [
        { id: 'al_p_1', type: 'settings_change', description: 'Federal Route Code & Compliance Audit Complete', actor: 'Compliance Desk', timestamp: 'Today, 10:30 AM' },
        { id: 'al_p_2', type: 'auth_approved', description: 'Waived Joint & Several Liability Protocol Signed and Deployed', actor: 'System Gatekeeper', timestamp: 'Yesterday, 14:22 PM' }
    ],
    recurringTransfers: [],
    loiConfig: {
        totalAmount: 1184077.00,
        expeditedShippingSelected: false,
        ssnOwner: '332-90-1184',
        ssnCoOwner: '419-22-5678',
        addressOwner: '124 Primrose Lane, Charlotte, NC 28202 (Primary Address)',
        addressCoOwner: '789 West Oak Avenue, Arlington, VA 22201',
        ownerSsnVerified: true,
        coOwnerSsnVerified: true,
        disclosuresSigned: true,
        disclosuresSignedDate: '2026-06-09'
    }
};

const MOCK_JOINT_ACCOUNT: JointAccount = {
    id: 'ja_101',
    type: 'partner',
    status: 'active',
    coOwner: {
        name: 'Sarah Marshall',
        email: 'sarah.m@example.com',
        phone: '+1 (555) 019-2034'
    },
    balance: 45200.00,
    accountNumber: '•••• 4492',
    permissions: {
        dualAuthRequirement: true,
        dualAuthThreshold: 5000
    },
    alerts: {
        smsEnabled: true,
        emailEnabled: true
    },
    goals: [
        { id: 'g_1', title: 'Maldives Vacation', targetAmount: 15000, currentAmount: 8400 },
        { id: 'g_2', title: 'Emergency Fund', targetAmount: 20000, currentAmount: 12500 }
    ],
    pendingTransfers: [
        {
            id: 'tx_req_1',
            amount: 8500,
            destination: 'Vanguard Group (Brokerage)',
            date: 'Today, 10:45 AM',
            initiatedBy: 'Sarah Marshall',
            status: 'pending'
        }
    ],
    messages: [
        { id: 'm_1', sender: 'Sarah Marshall', text: 'Hey! I initiated a transfer to our Vanguard account for the index fund auto-invest. Can you approve?', timestamp: '10:46 AM' }
    ],
    aiInsights: {
        savingsRate: 'Recommended: $1,250/mo based on combined cash flow trends to reach the Maldives goal by Nov 2026.',
        categorySuggestions: ['Optimize Dining Out (currently 15% of combined spend)', 'Consider moving $5,000 from checking to High-Yield Savings']
    },
    activityLog: [
        { id: 'al_1', type: 'deposit', description: 'Direct Deposit: Tech Corp', actor: 'Sarah Marshall', timestamp: 'Today, 09:00 AM' },
        { id: 'al_2', type: 'settings_change', description: 'Updated dual auth threshold to $5,000', actor: 'You', timestamp: 'Yesterday, 14:30 PM' },
        { id: 'al_3', type: 'goal_fund', description: 'Funded goal "Maldives Vacation" with $400', actor: 'Sarah Marshall', timestamp: 'Jun 2, 2026' }
    ],
    recurringTransfers: [
        { id: 'rt_1', amount: 1500, destination: 'Vanguard Group (Brokerage)', frequency: 'Monthly', nextDate: 'Jul 1, 2026', status: 'active' }
    ]
};

export const JointAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<JointAccount[]>([PARTNERSHIP_ESCROW_LEDGER, MOCK_JOINT_ACCOUNT]);
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    
    // Letter of Instruction Compliance Modal States
    const [selectedLoiAccount, setSelectedLoiAccount] = useState<string | null>(null);
    const [loiExpedited, setLoiExpedited] = useState<boolean>(false);
    const [loiOwnerSsn, setLoiOwnerSsn] = useState<string>('332-90-1184');
    const [loiCoOwnerSsn, setLoiCoOwnerSsn] = useState<string>('419-22-5678');
    const [ownerSsnVerified, setOwnerSsnVerified] = useState<boolean>(true);
    const [coOwnerSsnVerified, setCoOwnerSsnVerified] = useState<boolean>(true);
    const [viewServicesCard, setViewServicesCard] = useState<string | null>(null);
    const [openedDisclosures, setOpenedDisclosures] = useState<Record<string, boolean>>({
        agreement: true,
        eft: true,
        fees: true,
        dispute: true,
        communication: true,
        fdic: true
    });

    // Form State
    const [jointType, setJointType] = useState<'partner' | 'business'>('partner');
    const [coOwnerName, setCoOwnerName] = useState('');
    const [coOwnerEmail, setCoOwnerEmail] = useState('');
    const [coOwnerPhone, setCoOwnerPhone] = useState('');
    const [dualAuth, setDualAuth] = useState(true);
    const [dualAuthThreshold, setDualAuthThreshold] = useState('5000');
    const [smsAlerts, setSmsAlerts] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Edit Settings State
    const [editingAccount, setEditingAccount] = useState<string | null>(null);

    // WIMC-Protocol Compliance Code Generator States
    const [wimcCode, setWimcCode] = useState<string>('WIMC-AR-060826');
    const [wimcAccount, setWimcAccount] = useState<string>('Joint Capital Reserve');
    const [wimcPurpose, setWimcPurpose] = useState<string>('Sovereign Inflow Clearance Bypass');
    const [wimcHistory, setWimcHistory] = useState<Array<{code: string; account: string; purpose: string; date: string}>>([
        { code: 'WIMC-AR-060826', account: 'Joint Capital Reserve', purpose: 'Sovereign Inflow Clearance Bypass', date: '2026-06-08' },
        { code: 'WIMC-JA-060921-88', account: 'Partnership Escrow Ledger', purpose: 'Dual-Signatory Liability Waiver', date: '2026-06-09' }
    ]);
    const [showWimcRegistry, setShowWimcRegistry] = useState<boolean>(true); // Default show for usability
    const [justCopiedCode, setJustCopiedCode] = useState<string | null>(null);

    const handleGenerateWimc = () => {
        const today = new Date();
        const yy = today.getFullYear().toString().slice(-2);
        const mm = (today.getMonth() + 1).toString().padStart(2, '0');
        const dd = today.getDate().toString().padStart(2, '0');
        const rand = Math.floor(1000 + Math.random() * 9000);
        const suffix = today.getHours().toString().padStart(2, '0') + today.getMinutes().toString().padStart(2, '0');
        const prefix = wimcAccount.toLowerCase().includes('joint') ? 'JA' : 'AR';
        const newCode = `WIMC-${prefix}-${yy}${mm}${dd}-${rand}`;
        setWimcCode(newCode);
        setWimcHistory(prev => [
            { code: newCode, account: wimcAccount, purpose: wimcPurpose, date: today.toISOString().split('T')[0] },
            ...prev
        ]);
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setJustCopiedCode(code);
        setTimeout(() => setJustCopiedCode(null), 2000);
    };

    // Statements Modal State
    const [showStatementsFor, setShowStatementsFor] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    // Goals State
    const [fundingGoal, setFundingGoal] = useState<{accountId: string, goalId: string} | null>(null);
    const [fundAmount, setFundAmount] = useState('');
    const [creatingGoalFor, setCreatingGoalFor] = useState<string | null>(null);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');

    // Chat and AI Insights State
    const [showChatFor, setShowChatFor] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');

    const [projectionGoal, setProjectionGoal] = useState<string | null>(null);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [showActivityLogFor, setShowActivityLogFor] = useState<string | null>(null);

    // Recurring Automation State
    const [schedulingTransferFor, setSchedulingTransferFor] = useState<string | null>(null);
    const [newTransferAmount, setNewTransferAmount] = useState('');
    const [newTransferDest, setNewTransferDest] = useState('');
    const [newTransferFreq, setNewTransferFreq] = useState<'Weekly'|'Bi-Weekly'|'Monthly'|'Quarterly'>('Monthly');

    const handleCreateRecurringTransfer = (accountId: string) => {
        if (!newTransferAmount || !newTransferDest) return;
        setAccounts(prev => prev.map(a => {
            if (a.id === accountId) {
                const rt: RecurringTransfer = {
                    id: `rt_${Date.now()}`,
                    amount: parseFloat(newTransferAmount),
                    destination: newTransferDest,
                    frequency: newTransferFreq,
                    nextDate: 'Tomorrow', 
                    status: 'active'
                };
                const log: JointActivity = {
                    id: `al_${Date.now()}`,
                    type: 'settings_change',
                    description: `Scheduled recurring transfer of $${rt.amount} to ${rt.destination}`,
                    actor: 'You',
                    timestamp: 'Just now'
                };
                return {
                    ...a,
                    recurringTransfers: [...(a.recurringTransfers || []), rt],
                    activityLog: [log, ...(a.activityLog || [])]
                };
            }
            return a;
        }));
        setSchedulingTransferFor(null);
        setNewTransferAmount('');
        setNewTransferDest('');
        setNewTransferFreq('Monthly');
    };

    const handleSendMessage = (accountId: string) => {
        if (!chatInput.trim()) return;
        setAccounts(prev => prev.map(a => {
            if (a.id === accountId) {
                return {
                    ...a,
                    messages: [...(a.messages || []), {
                        id: `m_${Date.now()}`,
                        sender: 'You',
                        text: chatInput,
                        timestamp: 'Just now'
                    }]
                };
            }
            return a;
        }));
        setChatInput('');
    };

    const handleAuthAction = (accountId: string, txId: string, action: 'approved' | 'rejected') => {
        setAccounts(prev => prev.map(a => {
            if (a.id === accountId) {
                return {
                    ...a,
                    pendingTransfers: a.pendingTransfers.map(t => t.id === txId ? { ...t, status: action } : t)
                };
            }
            return a;
        }));
    };

    const MOCK_STATEMENTS = [
        { id: 'stmt_5', month: 'May 2026', size: '1.2 MB', date: 'Jun 1, 2026' },
        { id: 'stmt_4', month: 'Apr 2026', size: '1.4 MB', date: 'May 1, 2026' },
        { id: 'stmt_3', month: 'Mar 2026', size: '1.1 MB', date: 'Apr 1, 2026' },
        { id: 'stmt_2', month: 'Feb 2026', size: '1.3 MB', date: 'Mar 1, 2026' },
        { id: 'stmt_1', month: 'Jan 2026', size: '1.5 MB', date: 'Feb 1, 2026' },
    ];

    const handleDownloadStatement = (id: string) => {
        setIsDownloading(id);
        setTimeout(() => {
            setIsDownloading(null);
        }, 1500); // Simulate download delay
    };

    const handleCreateSubmit = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const newAccount: JointAccount = {
                id: `ja_${Date.now()}`,
                type: jointType,
                status: 'pending_invite',
                coOwner: {
                    name: coOwnerName,
                    email: coOwnerEmail,
                    phone: coOwnerPhone
                },
                balance: 0,
                accountNumber: '•••• ' + Math.floor(1000 + Math.random() * 9000).toString(),
                permissions: {
                    dualAuthRequirement: dualAuth,
                    dualAuthThreshold: parseFloat(dualAuthThreshold) || 0
                },
                alerts: {
                    smsEnabled: smsAlerts,
                    emailEnabled: emailAlerts
                },
                goals: [],
                pendingTransfers: [],
                messages: [],
                activityLog: [],
                recurringTransfers: []
            };
            setAccounts([...accounts, newAccount]);
            setIsProcessing(false);
            setCurrentStep(4); // Success step
        }, 2000);
    };

    const resetForm = () => {
        setIsCreating(false);
        setCurrentStep(1);
        setCoOwnerName('');
        setCoOwnerEmail('');
        setCoOwnerPhone('');
    };

    const handleAddGoal = (accountId: string) => {
        if (!newGoalTitle || !newGoalTarget) return;
        setAccounts(prev => prev.map(a => {
            if (a.id === accountId) {
                return {
                    ...a,
                    goals: [...(a.goals || []), {
                        id: `g_${Date.now()}`,
                        title: newGoalTitle,
                        targetAmount: parseFloat(newGoalTarget),
                        currentAmount: 0
                    }]
                };
            }
            return a;
        }));
        setCreatingGoalFor(null);
        setNewGoalTitle('');
        setNewGoalTarget('');
    };

    const handleFundGoal = () => {
        if (!fundingGoal || !fundAmount) return;
        const amt = parseFloat(fundAmount);
        if (isNaN(amt) || amt <= 0) return;

        setAccounts(prev => prev.map(a => {
            if (a.id === fundingGoal.accountId) {
                return {
                    ...a,
                    balance: a.balance - amt, // Ideally deduct from main balance
                    goals: a.goals.map(g => g.id === fundingGoal.goalId ? { ...g, currentAmount: g.currentAmount + amt } : g)
                };
            }
            return a;
        }));
        setFundingGoal(null);
        setFundAmount('');
    };
    
    const updateAccountSettings = (id: string, updates: Partial<JointAccount>) => {
        setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">Joint Reserves</h2>
                    <p className="text-[#0F172A] dark:text-white font-bold">Manage shared liquidity securely with real-time multi-party synchronization.</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Initiate Joint Account
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="flex border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                         <div className={`flex-1 p-4 md:p-6 text-center border-r border-slate-100 dark:border-white/10 transition-colors ${currentStep === 1 ? 'bg-primary/5 text-primary' : 'text-[#0F172A]'} font-bold text-xs uppercase tracking-widest`}>
                             1. Structure
                         </div>
                         <div className={`flex-1 p-4 md:p-6 text-center border-r border-slate-100 dark:border-white/10 transition-colors ${currentStep === 2 ? 'bg-primary/5 text-primary' : 'text-[#0F172A]'} font-bold text-xs uppercase tracking-widest`}>
                             2. Co-Owner KYC
                         </div>
                         <div className={`flex-1 p-4 md:p-6 text-center transition-colors ${currentStep === 3 ? 'bg-primary/5 text-primary' : 'text-[#0F172A]'} font-bold text-xs uppercase tracking-widest`}>
                             3. Governance
                         </div>
                    </div>

                    <div className="p-8 md:p-12">
                        {currentStep === 1 && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Establish Shared Ledger</h3>
                                    <p className="text-[#0F172A] font-bold">Select the mandate for your new joint entity.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div 
                                        onClick={() => setJointType('partner')}
                                        className={`cursor-pointer p-6 rounded-3xl border-2 transition-all ${jointType === 'partner' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-rose-500 mb-4">
                                            <HeartIcon className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Spouse / Partner</h4>
                                        <p className="text-xs text-[#0F172A] font-bold leading-relaxed">Shared domestic liquidity with equal rights and real-time sync.</p>
                                    </div>
                                    <div 
                                        onClick={() => setJointType('business')}
                                        className={`cursor-pointer p-6 rounded-3xl border-2 transition-all ${jointType === 'business' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full primary- flex items-center justify-center primary- mb-4">
                                            <BriefcaseIcon className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Business Partnership</h4>
                                        <p className="text-xs text-[#0F172A] font-bold leading-relaxed">Multi-signature compliant corporate ledger with advanced auditing.</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-12">
                                     <button onClick={() => setIsCreating(false)} className="text-xs font-bold uppercase tracking-widest text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white transition-colors">Cancel</button>
                                     <button onClick={() => setCurrentStep(2)} className="bg-slate-50 dark:bg-slate-900 text-white dark:text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-100 transition-all shadow-xl">Proceed to KYC</button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Co-Owner Identification (CIP)</h3>
                                    <p className="text-[#0F172A] font-bold">To comply with the US PATRIOT Act, your co-owner must complete a secure Customer Identification Program (CIP).</p>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-6">
                                    <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheckIcon className="w-4 h-4 text-primary" />
                                        Requirements for Co-Owner
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-emerald-500 text-emerald-500 rounded-lg"><CheckCircleIcon className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">Government ID</p>
                                                <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed mt-0.5">Physical scan of Driver's License or Passport.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-emerald-500 text-emerald-500 rounded-lg"><CheckCircleIcon className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">Biometric Liveness</p>
                                                <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed mt-0.5">Real-time facial scan matched against ID via their device.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-emerald-500 text-emerald-500 rounded-lg"><CheckCircleIcon className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">SSN & DOB</p>
                                                <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed mt-0.5">Required for federal tax reporting and credit agency verification.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 bg-emerald-500 text-emerald-500 rounded-lg"><CheckCircleIcon className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">Physical Address</p>
                                                <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed mt-0.5">Residential address matching utility or lease (No PO Boxes).</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                     <div>
                                         <label className="block text-[10px] uppercase font-bold tracking-widest text-[#0F172A] mb-2 pl-1">Their Legal Full Name</label>
                                         <input type="text" value={coOwnerName} onChange={e => setCoOwnerName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white" placeholder="John Doe" />
                                     </div>
                                     <div>
                                         <label className="block text-[10px] uppercase font-bold tracking-widest text-[#0F172A] mb-2 pl-1">Secure Email Node</label>
                                         <div className="relative">
                                             <EnvelopeIcon className="w-5 h-5 text-[#0F172A] absolute left-4 top-1/2 -translate-y-1/2" />
                                             <input type="email" value={coOwnerEmail} onChange={e => setCoOwnerEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 pl-12 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white" placeholder="partner@domain.com" />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="block text-[10px] uppercase font-bold tracking-widest text-[#0F172A] mb-2 pl-1">Mobile Telemetry (Required for SMS Alerts)</label>
                                        <div className="relative">
                                             <DevicePhoneMobileIcon className="w-5 h-5 text-[#0F172A] absolute left-4 top-1/2 -translate-y-1/2" />
                                             <input type="tel" value={coOwnerPhone} onChange={e => setCoOwnerPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 pl-12 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white" placeholder="+1 (555) 000-0000" />
                                         </div>
                                     </div>
                                </div>
                                <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100 dark:border-white/10">
                                     <button onClick={() => setCurrentStep(1)} className="text-xs font-bold uppercase tracking-widest text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white transition-colors">Back</button>
                                     <button onClick={() => setCurrentStep(3)} disabled={!coOwnerName || !coOwnerEmail || !coOwnerPhone} className="bg-slate-50 dark:bg-slate-900 text-white dark:text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-100 transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed">Define Governance</button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Access & Alert Governance</h3>
                                    <p className="text-[#0F172A] font-bold">Configure authorization thresholds and real-time notification routing.</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Require Dual Authorization</h4>
                                            <p className="text-xs text-[#0F172A] font-bold mt-0.5">Transfers above threshold require co-owner approval.</p>
                                        </div>
                                        <button 
                                            onClick={() => setDualAuth(!dualAuth)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dualAuth ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dualAuth ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {dualAuth && (
                                        <div className="pl-4 border-l-2 border-primary/20 pt-2">
                                            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#0F172A] mb-2">Threshold Amount (USD)</label>
                                            <div className="relative w-48">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-bold">$</span>
                                                <input type="number" value={dualAuthThreshold} onChange={e => setDualAuthThreshold(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 pl-10 text-sm font-bold focus:border-primary outline-none transition-all dark:text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-900" />

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                                                <EnvelopeIcon className="w-4 h-4 text-emerald-500" /> Real-time Email Alerts
                                            </h4>
                                            <p className="text-xs text-[#0F172A] font-bold mt-0.5">Send transaction receipts to both parties instantly.</p>
                                        </div>
                                        <button 
                                            onClick={() => setEmailAlerts(!emailAlerts)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                                                <DevicePhoneMobileIcon className="w-4 h-4 primary-" /> Push SMS Notifications
                                            </h4>
                                            <p className="text-xs text-[#0F172A] font-bold mt-0.5">Instant ledger updates sent to registered mobile nodes.</p>
                                        </div>
                                        <button 
                                            onClick={() => setSmsAlerts(!smsAlerts)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsAlerts ? 'primary-' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100 dark:border-white/10">
                                     <button onClick={() => setCurrentStep(2)} className="text-xs font-bold uppercase tracking-widest text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white transition-colors">Back</button>
                                     <button onClick={handleCreateSubmit} disabled={isProcessing} className="bg-primary text-[#0F172A] px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 disabled:opacity-70 flex items-center gap-2">
                                        {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
                                        Finalize Protocol
                                     </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="text-center py-12 animate-fade-in text-left">
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white mb-4 tracking-tighter text-center">Protocol Initiated.</h3>
                                <p className="text-[#0F172A] font-bold max-w-md mx-auto mb-6 text-center">
                                    A secure onboarding vector has been dispatched to <strong>{coOwnerEmail}</strong> and via SMS to <strong>{coOwnerPhone}</strong>. The ledger will activate upon their KYC verification.
                                </p>

                                {/* WIMC Generated code output inside success screen */}
                                <div className="max-w-md mx-auto bg-amber-500 border border-amber-500/30 rounded-2xl p-5 mb-8">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-widest">Sovereign Compliance Bypass Code</span>
                                        <span className="text-[8px] bg-amber-500 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black">SECURE-REGISTERED</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                                        <span className="text-base font-mono font-black text-amber-500 flex-1 tracking-wider">WIMC-JA-060826-{(Math.floor(1000 + Math.random() * 9000))}</span>
                                        <button 
                                            onClick={() => {
                                                const code = `WIMC-JA-060826-${(Math.floor(1000 + Math.random() * 9000))}`;
                                                navigator.clipboard.writeText(code);
                                            }}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-[9.5px] text-[#0F172A] mt-2 leading-relaxed font-semibold">
                                        Use this master clearance code to instantly coordinate assets, sign signed Letter of Intent configurations, and bypass potential compliance sweeps.
                                    </p>
                                </div>

                                <div className="text-center">
                                    <button onClick={resetForm} className="bg-slate-50 dark:bg-slate-900 text-white dark:text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-100 transition-all shadow-xl cursor-pointer">
                                        Return to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* WIMC Compliance & Clearance Code Registry (WIMC-Protocol) */}
                    <div className="bg-gradient-to-r from-amber-500/5 to-amber-600/5 dark:from-amber-500/10 dark:to-amber-600/10 border border-amber-500/20 rounded-3xl p-6 shadow-md relative overflow-hidden" id="wimc-compliance-registry-card">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <ShieldCheckIcon className="w-40 h-40 text-amber-500" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <span className="text-[9px] font-mono font-black uppercase text-amber-500 tracking-[0.25em] px-2.5 py-1 bg-amber-500 border border-amber-500/20 rounded-full inline-block mb-2">WIMC-Protocol Compliance Hub</span>
                                    <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">Sovereign Compliance & Clearance Registry</h3>
                                    <p className="text-xs text-slate-550 dark:text-white font-bold">Generate fully-validated clearance certificate codes (such as <strong className="text-amber-500 font-bold">WIMC-AR-060826</strong>) to instantly clear compliance holds, sign signed Letter of Intent configurations, and bypass regulatory audits on joint transfers.</p>
                                </div>
                                <button
                                    onClick={() => setShowWimcRegistry(!showWimcRegistry)}
                                    className="px-4 py-2 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-700 text-white dark:text-amber-400 border border-transparent dark:border-amber-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                                    id="toggle-wimc-registry-btn"
                                >
                                    {showWimcRegistry ? 'Hide Registry' : 'Reveal Registry'}
                                </button>
                            </div>

                            {showWimcRegistry && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-amber-500/10 animate-fade-in text-left">
                                    {/* Generator Form */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-mono font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1.5 animate-pulse">Target Account / Sub-Ledger</label>
                                            <select
                                                value={wimcAccount}
                                                onChange={(e) => setWimcAccount(e.target.value)}
                                                className="w-full text-xs p-3 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white border border-slate-205 dark:border-white/10 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold outline-none"
                                            >
                                                <option value="Joint Capital Reserve">Joint Capital Reserve (acc_joint_1)</option>
                                                <option value="Joint Living Expenses">Joint Living Expenses (acc_joint_2)</option>
                                                <option value="Partnership Escrow Ledger">Partnership Escrow Ledger (ja_escrow)</option>
                                                <option value="Custom Sub-Ledger">Standard Sub-Account Node</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-mono font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1.5 animate-pulse">Clearance Purpose / Scope</label>
                                            <select
                                                value={wimcPurpose}
                                                onChange={(e) => setWimcPurpose(e.target.value)}
                                                className="w-full text-xs p-3 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white border border-slate-205 dark:border-white/10 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold outline-none"
                                            >
                                                <option value="Sovereign Inflow Clearance Bypass">Sovereign Inflow Clearance Bypass (WIMC-AR-060826)</option>
                                                <option value="Dual-Signatory Liability Waiver">Dual-Signatory Liability Waiver (WIMC-JA)</option>
                                                <option value="ITCC Premium Allocation Release">ITCC Premium Allocation Release</option>
                                                <option value="Asset Relocation Compliance Bypass">Asset Relocation Compliance Bypass</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={handleGenerateWimc}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-extrabold"
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            Generate Clearance-Key
                                        </button>
                                    </div>

                                    {/* Display Box */}
                                    <div className="lg:col-span-7 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-800 border border-amber-500/10 rounded-[1.5rem] p-5">
                                        <div>
                                            <span className="text-[8px] font-mono text-[#0F172A] uppercase tracking-widest block mb-1">Active Cryptographic Clearance Node</span>
                                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                                                <span className="text-lg font-mono font-black text-amber-500 flex-1 tracking-wider">{wimcCode}</span>
                                                <button
                                                    onClick={() => handleCopyCode(wimcCode)}
                                                    className="px-4 py-2 bg-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-amber-500/20 cursor-pointer"
                                                >
                                                    {justCopiedCode === wimcCode ? 'Copied!' : 'Copy Code'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-[#0F172A] mt-2 leading-relaxed italic">
                                                * This code has been cryptographically registered across global strategic clearance desks. Enter it in transaction holds or system verification forms to instantly unlock ledgers.
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-amber-500/10">
                                            <span className="text-[9px] font-mono font-black text-[#0F172A] dark:text-white uppercase tracking-widest block mb-2">Registered Ledger History</span>
                                            <div className="max-h-[85px] overflow-y-auto space-y-2 pr-1 select-none">
                                                {wimcHistory.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100 dark:border-white/10 last:border-b-0">
                                                        <div className="font-mono text-[#0F172A] dark:text-white">
                                                            <strong className="text-amber-500 font-bold mr-2 hover:underline cursor-pointer" onClick={() => handleCopyCode(item.code)}>{item.code}</strong> 
                                                            <span className="text-[#0F172A]">({item.account})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#0F172A] text-[9px]">{item.date}</span>
                                                            <span className="font-extrabold text-emerald-500 uppercase tracking-normal">ACTIVE</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {accounts.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-white/10 shadow-inner flex flex-col items-center">
                            <UsersIcon className="w-16 h-16 text-[#0F172A] dark:text-white mb-4" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">No Active Joint Accounts</h3>
                            <p className="text-sm text-[#0F172A] max-w-sm">Establish a shared financial node with a partner or business associate to manage liquidity collectively.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {accounts.map(acc => (
                                <div key={acc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
                                    {/* Account Header */}
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${acc.type === 'business' ? 'primary- primary-' : 'bg-rose-500 text-rose-500'}`}>
                                                {acc.type === 'business' ? <BriefcaseIcon className="w-6 h-6" /> : <HeartIcon className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-widest text-[#0F172A] dark:text-white">Joint Reserve</h4>
                                                <p className="text-xs font-mono text-[#0F172A] mt-0.5">{acc.accountNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setShowChatFor(acc.id)}
                                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                            >
                                                <MessageSquareIcon className="w-3.5 h-3.5" />
                                                Discuss
                                            </button>
                                            <button 
                                                onClick={() => setShowStatementsFor(acc.id)}
                                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                            >
                                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                                Statements
                                            </button>
                                            <button 
                                                onClick={() => setShowActivityLogFor(acc.id)}
                                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                                Activity Log
                                            </button>
                                            <button 
                                                onClick={() => setEditingAccount(editingAccount === acc.id ? null : acc.id)}
                                                className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white bg-slate-50 dark:bg-slate-900 rounded-full transition-colors"
                                            >
                                                <CogIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Balance / Status */}
                                    <div className="mb-8 relative z-10">
                                        {acc.status === 'pending_invite' || acc.status === 'pending_verification' ? (
                                            <div className="bg-amber-500 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                                                <ExclamationCircleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Pending Activation</p>
                                                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">Awaiting KYC verification from {acc.coOwner.name}. Reminders are dispatched automatically.</p>
                                                    <button className="text-[10px] bg-amber-500 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg mt-3 hover:bg-amber-500 transition-colors">Resend Invite</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-1">Available Liquidity</p>
                                                <h3 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter">
                                                    ${acc.balance.toLocaleString('en-US', {minimumFractionDigits:2})}
                                                </h3>
                                            </div>
                                        )}
                                    </div>

                                    {/* Letter of Instruction Compliance Banner */}
                                    {acc.loiConfig && (
                                        <div className="mb-5 bg-emerald-500 dark:bg-emerald-500 border border-emerald-500/20 p-4 rounded-3xl relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-shadow-sm">Sovereign LOI Approved</span>
                                                </div>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white font-bold leading-relaxed mt-1">Joint liability waived. Partitioned into 50/50 sole signatory sub-ledgers. SSD Clear.</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setLoiExpedited(acc.loiConfig?.expeditedShippingSelected ?? false);
                                                    setSelectedLoiAccount(acc.id);
                                                }}
                                                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap self-start sm:self-center"
                                            >
                                                Compliance Hub
                                            </button>
                                        </div>
                                    )}

                                    {!acc.loiConfig && (
                                        <div className="mb-5 bg-amber-500 border border-dashed border-amber-500/20 p-4 rounded-3xl relative z-10">
                                            <p className="text-[9px] text-[#0F172A] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                Traditional Joint Liability Active
                                            </p>
                                            <p className="text-[10px] text-[#0F172A] mb-3 leading-tight">Default rules apply: each co-owner is 100% liable for overdrafts.</p>
                                            <button 
                                                onClick={() => {
                                                    setAccounts(prev => prev.map(a => a.id === acc.id ? {
                                                        ...a,
                                                        loiConfig: {
                                                            totalAmount: acc.balance,
                                                            expeditedShippingSelected: false,
                                                            ssnOwner: '332-90-XXXX',
                                                            ssnCoOwner: '419-22-XXXX',
                                                            addressOwner: '124 Primrose Lane, Charlotte, NC (Primary)',
                                                            addressCoOwner: 'Separate Address on File',
                                                            ownerSsnVerified: false,
                                                            coOwnerSsnVerified: false,
                                                            disclosuresSigned: false
                                                        }
                                                    } : a));
                                                }}
                                                className="w-full py-2 bg-amber-500 hover:bg-amber-500 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm border border-amber-500/10"
                                            >
                                                Attach US Bank LOI Waiver
                                            </button>
                                        </div>
                                    )}

                                    {/* Co-owner details */}
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 relative z-10">
                                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-[#0F172A] uppercase">
                                            {acc.coOwner.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#0F172A] dark:text-white leading-none mb-1">{acc.coOwner.name}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-[#0F172A]">
                                                <span className="flex items-center gap-1"><EnvelopeIcon className="w-3 h-3" /> {acc.coOwner.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dual Auth Pending Requests */}
                                    {acc.status === 'active' && acc.pendingTransfers && acc.pendingTransfers.length > 0 && (
                                        <div className="mt-6 relative z-10 border-t border-slate-100 dark:border-white/10 pt-6">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-4 flex items-center gap-1.5">
                                                <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />
                                                Pending Authorizations (Dual Auth)
                                            </h5>
                                            <div className="space-y-3">
                                                {acc.pendingTransfers.filter(t => t.status === 'pending').map(request => (
                                                    <div key={request.id} className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Action Required</span>
                                                                <span className="text-[10px] font-bold text-[#0F172A]">{request.date}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                                                                ${request.amount.toLocaleString('en-US', {minimumFractionDigits: 2})} to {request.destination}
                                                            </p>
                                                            <p className="text-[10px] text-[#0F172A] font-bold mt-0.5">Initiated by {request.initiatedBy}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleAuthAction(acc.id, request.id, 'rejected')}
                                                                className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center justify-center gap-1.5"
                                                            >
                                                                <XCircleIcon className="w-3.5 h-3.5" /> Reject
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAuthAction(acc.id, request.id, 'approved')}
                                                                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                                                            >
                                                                <CheckIcon2 className="w-3.5 h-3.5" /> Approve
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {acc.pendingTransfers.filter(t => t.status === 'pending').length === 0 && (
                                                    <p className="text-xs text-[#0F172A] italic">No pending transactions requiring your approval.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Shared Financial Goals */}
                                    {acc.status === 'active' && (
                                        <div className="mt-6 relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                                                    <TrophyIcon className="w-3 h-3 text-amber-500" />
                                                    Shared Goals
                                                </h5>
                                                <button 
                                                    onClick={() => setCreatingGoalFor(acc.id)}
                                                    className="text-[10px] font-bold text-primary hover:text-primary-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                                                >
                                                    <AddIcon className="w-3 h-3" /> Add
                                                </button>
                                            </div>

                                            {creatingGoalFor === acc.id && (
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 mb-4 animate-fade-in shadow-sm">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Goal Objective</label>
                                                            <input type="text" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} placeholder="e.g. Wedding Fund" className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 outline-none focus:border-primary dark:text-white" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Target Amount</label>
                                                            <input type="number" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} placeholder="e.g. 50000" className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 outline-none focus:border-primary dark:text-white" />
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={() => setCreatingGoalFor(null)} className="flex-1 py-2 text-xs font-bold text-[#0F172A] bg-slate-100 dark:bg-slate-900 rounded-lg uppercase tracking-widest">Cancel</button>
                                                            <button onClick={() => handleAddGoal(acc.id)} className="flex-1 py-2 text-xs font-bold text-white bg-primary rounded-lg uppercase tracking-widest">Create</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(!acc.goals || acc.goals.length === 0) && creatingGoalFor !== acc.id ? (
                                                <div className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-white/10 p-4 rounded-2xl text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-50 transition-colors" onClick={() => setCreatingGoalFor(acc.id)}>
                                                    <p className="text-xs font-bold text-[#0F172A] dark:text-white">No Shared Goals</p>
                                                    <p className="text-[10px] font-bold text-[#0F172A] mt-0.5">Click to establish a collaborative target.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {(acc.goals || []).map(goal => {
                                                        const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                                                        return (
                                                            <div key={goal.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white transition-colors group">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5 mb-1">
                                                                            <PiggyBankIcon className="w-3.5 h-3.5 text-[#0F172A] group-hover:text-primary transition-colors" />
                                                                            {goal.title}
                                                                        </p>
                                                                        <p className="text-[10px] font-bold text-[#0F172A]">
                                                                            ${goal.currentAmount.toLocaleString()} <span className="text-[#0F172A]">/ ${goal.targetAmount.toLocaleString()}</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-2">
                                                                        <span className="text-[10px] font-black text-[#0F172A] dark:text-white">
                                                                            {progress}%
                                                                        </span>
                                                                        <div className="flex gap-1.5">
                                                                            <button 
                                                                                onClick={() => setProjectionGoal(projectionGoal === goal.id ? null : goal.id)}
                                                                                className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-500 hover:bg-indigo-500 px-2 py-1 rounded transition-colors"
                                                                            >
                                                                                Project
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setFundingGoal({accountId: acc.id, goalId: goal.id})}
                                                                                className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500 hover:bg-emerald-500 px-2 py-1 rounded transition-colors"
                                                                            >
                                                                                Fund
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden mb-2">
                                                                    <div 
                                                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                {projectionGoal === goal.id && (
                                                                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 animate-fade-in">
                                                                        <h6 className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-3 flex items-center gap-1.5">
                                                                            <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                                                                            Joint Savings Projection
                                                                        </h6>
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <div className="flex justify-between mb-1">
                                                                                    <label className="text-xs font-bold text-[#0F172A] dark:text-white">Monthly Contribution</label>
                                                                                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">${monthlyContribution}</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="range" 
                                                                                    min="100" 
                                                                                    max="5000" 
                                                                                    step="50" 
                                                                                    value={monthlyContribution} 
                                                                                    onChange={e => setMonthlyContribution(Number(e.target.value))}
                                                                                    className="w-full accent-indigo-500"
                                                                                />
                                                                            </div>
                                                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                                                                                <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest mb-1">Estimated Completion</p>
                                                                                <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                                                                                    {Math.ceil((goal.targetAmount - goal.currentAmount) / monthlyContribution)} Months
                                                                                    <span className="text-xs font-bold text-[#0F172A] ml-2">
                                                                                        (By {new Date(new Date().setMonth(new Date().getMonth() + Math.ceil((goal.targetAmount - goal.currentAmount) / monthlyContribution))).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* AI Smart Budgeting Insights */}
                                            {acc.aiInsights && (
                                                <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                                                        <SparklesIcon className="w-3.5 h-3.5" />
                                                        Smart Budgeting Insights
                                                    </h5>
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white">
                                                            <strong className="font-bold text-indigo-700 dark:text-indigo-300">Forecast:</strong> {acc.aiInsights.savingsRate}
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {acc.aiInsights.categorySuggestions.map((suggestion, idx) => (
                                                                <p key={idx} className="text-[10px] text-[#0F172A] dark:text-white flex items-start gap-1.5">
                                                                    <span className="text-indigo-400 mt-0.5">•</span>
                                                                    {suggestion}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Recurring Automated Transfers */}
                                    {acc.status === 'active' && (
                                        <div className="mt-6 relative z-10 border-t border-slate-100 dark:border-white/10 pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                                                    <ArrowPathIcon className="w-3 h-3 primary-" />
                                                    Automated Transfers
                                                </h5>
                                                <button 
                                                    onClick={() => setSchedulingTransferFor(acc.id)}
                                                    className="text-[10px] font-bold text-primary hover:text-primary-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                                                >
                                                    <AddIcon className="w-3 h-3" /> Schedule
                                                </button>
                                            </div>

                                            {schedulingTransferFor === acc.id && (
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 mb-4 animate-fade-in shadow-sm">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Dest Account</label>
                                                            <input type="text" value={newTransferDest} onChange={e => setNewTransferDest(e.target.value)} placeholder="e.g. Personal Checking" className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 outline-none focus:border-primary dark:text-white" />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Amount</label>
                                                                <input type="number" value={newTransferAmount} onChange={e => setNewTransferAmount(e.target.value)} placeholder="0" className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 outline-none focus:border-primary dark:text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Frequency</label>
                                                                <select 
                                                                    value={newTransferFreq} 
                                                                    onChange={e => setNewTransferFreq(e.target.value as any)}
                                                                    className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 outline-none focus:border-primary dark:text-white"
                                                                >
                                                                    <option value="Weekly">Weekly</option>
                                                                    <option value="Bi-Weekly">Bi-Weekly</option>
                                                                    <option value="Monthly">Monthly</option>
                                                                    <option value="Quarterly">Quarterly</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={() => setSchedulingTransferFor(null)} className="flex-1 py-2 text-xs font-bold text-[#0F172A] bg-slate-100 dark:bg-slate-900 rounded-lg uppercase tracking-widest">Cancel</button>
                                                            <button onClick={() => handleCreateRecurringTransfer(acc.id)} className="flex-1 py-2 text-xs font-bold text-white bg-primary rounded-lg uppercase tracking-widest">Schedule</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(!acc.recurringTransfers || acc.recurringTransfers.length === 0) && schedulingTransferFor !== acc.id ? (
                                                <div className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-white/10 p-4 rounded-2xl text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-50 transition-colors" onClick={() => setSchedulingTransferFor(acc.id)}>
                                                    <p className="text-xs font-bold text-[#0F172A] dark:text-white">No Scheduled Transfers</p>
                                                    <p className="text-[10px] font-bold text-[#0F172A] mt-0.5">Automate your distributions.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {(acc.recurringTransfers || []).map(transfer => (
                                                        <div key={transfer.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white transition-colors group flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg primary- primary-">
                                                                    <ArrowPathIcon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5 mb-0.5">
                                                                        To {transfer.destination}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-[10px] font-bold text-[#0F172A]">
                                                                            ${transfer.amount.toLocaleString()} <span className="text-[#0F172A]">&bull; {transfer.frequency}</span>
                                                                        </p>
                                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${transfer.status === 'active' ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-200 dark:bg-slate-700 text-[#0F172A]'}`}>
                                                                            {transfer.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Next</p>
                                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">{transfer.nextDate}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Settings Panel (Expandable) */}
                                    {editingAccount === acc.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 animate-fade-in space-y-4 relative z-10">
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Dual Auth Required</p>
                                                    <p className="text-[9px] text-[#0F172A] mt-0.5">Threshold: ${acc.permissions.dualAuthThreshold.toLocaleString()}</p>
                                                </div>
                                                <button 
                                                    onClick={() => updateAccountSettings(acc.id, { permissions: { ...acc.permissions, dualAuthRequirement: !acc.permissions.dualAuthRequirement }})}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${acc.permissions.dualAuthRequirement ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${acc.permissions.dualAuthRequirement ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <div 
                                                    onClick={() => updateAccountSettings(acc.id, { alerts: { ...acc.alerts, emailEnabled: !acc.alerts.emailEnabled }})}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors border ${acc.alerts.emailEnabled ? 'bg-emerald-500 text-emerald-500 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900 text-[#0F172A] border-slate-200 dark:border-white/10'}`}
                                                >
                                                    <EnvelopeIcon className="w-3.5 h-3.5" /> Email Sync
                                                </div>
                                                <div 
                                                    onClick={() => updateAccountSettings(acc.id, { alerts: { ...acc.alerts, smsEnabled: !acc.alerts.smsEnabled }})}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors border ${acc.alerts.smsEnabled ? 'primary- primary- primary-' : 'bg-slate-50 dark:bg-slate-900 text-[#0F172A] border-slate-200 dark:border-white/10'}`}
                                                >
                                                    <DevicePhoneMobileIcon className="w-3.5 h-3.5" /> SMS Alerts
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Abstract shapes */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Statements Modal */}
            {showStatementsFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 " onClick={() => setShowStatementsFor(null)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-fade-in-up border border-slate-200 dark:border-white/10">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Joint Statements</h3>
                                    <p className="text-[#0F172A] font-bold text-sm">Combined monthly activity records.</p>
                                </div>
                                <button 
                                    onClick={() => setShowStatementsFor(null)}
                                    className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white bg-slate-50 dark:bg-slate-900 rounded-full transition-colors"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {MOCK_STATEMENTS.map(stmt => (
                                    <div key={stmt.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <DocumentTextIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#0F172A] dark:text-white">{stmt.month} Statement</p>
                                                <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">Generated: {stmt.date} • {stmt.size}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDownloadStatement(stmt.id)}
                                            disabled={isDownloading === stmt.id}
                                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white hover:text-primary dark:hover:text-primary hover:border-primary/50 shadow-sm transition-all disabled:opacity-70"
                                        >
                                            {isDownloading === stmt.id ? (
                                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowDownTrayIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 border-t border-slate-100 dark:border-white/10 text-center">
                            <p className="text-xs text-[#0F172A] font-bold flex items-center justify-center gap-2">
                                <DocumentCheckIcon className="w-4 h-4 text-emerald-500" />
                                Electronically signed and verified. PDF format required.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Fund Goal Modal */}
            {fundingGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 " onClick={() => setFundingGoal(null)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-fade-in-up border border-slate-200 dark:border-white/10 p-8">
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Fund Goal</h3>
                            <p className="text-[#0F172A] font-bold text-xs">Transfer liquidity from your joint balance to this target.</p>
                        </div>
                        <div className="mb-8">
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Amount (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={fundAmount} 
                                    onChange={e => setFundAmount(e.target.value)} 
                                    placeholder="0.00" 
                                    className="w-full text-2xl font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 pl-8 outline-none focus:border-primary dark:text-white" 
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setFundingGoal(null)} className="flex-1 py-4 text-xs font-bold text-[#0F172A] bg-slate-100 dark:bg-slate-900 rounded-xl uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button onClick={handleFundGoal} disabled={!fundAmount || parseFloat(fundAmount) <= 0} className="flex-1 py-4 text-xs font-bold text-white bg-primary rounded-xl uppercase tracking-widest disabled:opacity-70 hover:bg-primary-600 transition-colors">Transfer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Log Modal */}
            {showActivityLogFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 " onClick={() => setShowActivityLogFor(null)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-fade-in-up border border-slate-200 dark:border-white/10 flex flex-col" style={{ maxHeight: '80vh' }}>
                        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500 text-indigo-500 rounded-xl">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Joint Activity Log</h3>
                                    <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-0.5">Live Feed</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowActivityLogFor(null)}
                                className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white bg-white dark:bg-slate-900 rounded-full transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
                            >
                                <span className="sr-only">Close</span>
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {accounts.find(a => a.id === showActivityLogFor)?.activityLog?.map(log => (
                                <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10">
                                    <div className={`mt-1 w-2 h-2 rounded-full ${
                                        log.type === 'deposit' ? 'bg-emerald-500' :
                                        log.type === 'withdrawal' ? 'bg-rose-500' :
                                        log.type === 'goal_fund' ? 'bg-indigo-500' :
                                        log.type === 'settings_change' ? 'bg-slate-500' : 'bg-primary'
                                    }`} />
                                    <div>
                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">{log.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">{log.actor}</span>
                                            <span className="text-[#0F172A] dark:text-white">•</span>
                                            <span className="text-[10px] text-[#0F172A] font-bold">{log.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!accounts.find(a => a.id === showActivityLogFor)?.activityLog || accounts.find(a => a.id === showActivityLogFor)?.activityLog?.length === 0) && (
                                <p className="text-center text-sm font-bold text-[#0F172A] py-8">No activity recorded yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat/Discussion Modal */}
            {showChatFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 " onClick={() => setShowChatFor(null)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-fade-in-up border border-slate-200 dark:border-white/10 flex flex-col" style={{ maxHeight: '80vh' }}>
                        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                    <MessageSquareIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Co-Owner Chat</h3>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5 flex flex-row items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Real-time Secure Node
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowChatFor(null)}
                                className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white bg-white dark:bg-slate-900 rounded-full transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
                            >
                                <span className="sr-only">Close</span>
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-800">
                            {accounts.find(a => a.id === showChatFor)?.messages?.map(msg => {
                                const isSelf = msg.sender === 'You';
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-4 ${isSelf ? 'bg-primary text-[#0F172A] rounded-tr-sm' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white rounded-tl-sm'}`}>
                                            <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                            <span className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">{msg.sender}</span>
                                            <span className="text-[9px] text-[#0F172A] dark:text-white">•</span>
                                            <span className="text-[9px] font-bold text-[#0F172A]">{msg.timestamp}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!accounts.find(a => a.id === showChatFor)?.messages || accounts.find(a => a.id === showChatFor)?.messages?.length === 0) && (
                                <div className="text-center py-10 opacity-70">
                                    <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 text-[#0F172A]" />
                                    <p className="text-xs font-bold text-[#0F172A]">No messages yet. Start the conversation.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(showChatFor!); }}
                                className="relative flex items-center"
                            >
                                <input 
                                    type="text" 
                                    value={chatInput} 
                                    onChange={e => setChatInput(e.target.value)} 
                                    placeholder="Type a secure message..." 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm font-bold outline-none focus:border-primary dark:text-white transition-colors" 
                                />
                                <button 
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="absolute right-2 p-2 bg-primary text-[#0F172A] rounded-lg hover:bg-primary-600 disabled:opacity-70 disabled:hover:bg-primary transition-colors shadow-sm"
                                >
                                    <SendIcon className="w-4 h-4" />
                                </button>
                             </form>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPLIANCE LETTER OF INSTRUCTION MODAL */}
            {selectedLoiAccount && (() => {
                const activeAcc = accounts.find(a => a.id === selectedLoiAccount);
                if (!activeAcc) return null;

                const baseAmount = activeAcc.loiConfig?.totalAmount ?? activeAcc.balance;
                const shippingCost = loiExpedited ? 250 : 0;
                const finalAmount = baseAmount - shippingCost;
                const splitAmount = finalAmount / 2;

                const handleGeneratePDF = async () => {
                    const doc = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    applyBankPdfBackgroundAndWatermark(doc, { title: 'LEGAL LETTER OF INSTRUCTION', documentRef: `REF: FPB-LOI-${new Date().getFullYear()}` });

                    // Certificate border
                    doc.setDrawColor(226, 232, 240);
                    doc.rect(10, 45, 190, 238);

                    // Metadata table
                    doc.setTextColor(100, 116, 139);
                    doc.setFontSize(8);
                    const fileDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    doc.text(`DATE OF DEPOSIT: ${fileDate}`, 15, 54);
                    doc.text(`ESCROW LEDGER REF: FPB-1184-LOI-SECURE`, 15, 59);
                    doc.text(`ROUTING HANDSHAKE: FIRST Pacific Fed-Node #0421`, 120, 54);
                    doc.text(`BENEFICIARIES: Lawrence Consultants Org & Alexander Mercer`, 120, 59);

                    // Separator line
                    doc.setDrawColor(203, 213, 225);
                    doc.line(15, 63, 195, 63);

                    // Agreement Body
                    doc.setTextColor(15, 23, 42);
                    doc.setFont('Helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.text('CERTIFIED MEMORANDUM OF STRUCTURAL COMPLIANCE', 15, 71);

                    doc.setFont('Helvetica', 'normal');
                    doc.setFontSize(8.5);
                    const leadText = `This legal instrument serves as the binding directive and governing letter of instruction issued jointly by the undersigned co-owners to First Pacific Premium Reserved Bank for the administration of Master Capital account ${activeAcc.accountNumber}. Both parties confirm their complete intent under US banking structures:`;
                    
                    const splitLeadText = doc.splitTextToSize(leadText, 175);
                    doc.text(splitLeadText, 15, 77);

                    let y = 89;

                    // Clause 1
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 1: CAPITAL DEPOSITS & COURIER LOGISTICS CHARGES', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c1Text = `The total capital amount of $${baseAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} shall be partitioned into individual sole-signatory ledger accounts. Any unavoidable physical courier, manufacturing, or service costs totaling $${shippingCost.toLocaleString('en-US', {minimumFractionDigits: 2})} (Expedited Delivery: ${loiExpedited ? 'ACTIVE' : 'INACTIVE'}) shall be fully deducted from the joint total before the final partition. Net split asset distribution remains $${splitAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} each for Sub-account A (You) and Sub-account B (Alexander Mercer), as agreed under Agreement Clause 5. Neither personal subaccount is charged for shared expenses.`;
                    const sC1 = doc.splitTextToSize(c1Text, 175);
                    doc.text(sC1, 15, y);
                    y += sC1.length * 3.8 + 2;

                    // Clause 2
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 2: EMBOSSED MASTER BUSINESS CARD PROTOCOLS', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c2Text = `Each signatory is hereby issued an individual Master Business Card linked exclusively to their respective 50% sub-account node. Direct POS clearing, local ATM access, electronic swipe nodes, and online payments are registered with the bank prior to issuance. Spending actions on Card A shall never tap Sub-account B assets, and Card B is restricted strictly to Sub-account B bounds.`;
                    const sC2 = doc.splitTextToSize(c2Text, 175);
                    doc.text(sC2, 15, y);
                    y += sC2.length * 3.8 + 2;

                    // Clause 3
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 3: EXPLICIT WAIVER OF JOINT & SEVERAL LIABILITY', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c3Text = `By executing this decree, both co-owners and First Pacific Bank explicitly waive federal and state joint and several liability structures on other partitions. Under compliance Agreement Clause 4, no cross-collateral Power of Attorney is established. Each partner is sole signatory with exclusive governance and responsibility over their respective portion.`;
                    const sC3 = doc.splitTextToSize(c3Text, 175);
                    doc.text(sC3, 15, y);
                    y += sC3.length * 3.8 + 2;

                    // Clause 4
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 4: REGULATORY DISCLOSURES AND ELECTRONIC SHIELDS', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c4Text = `Both owners acknowledge receipt of the Electronic Fund Transfer (EFT) Act Regulation E advisory, Truth in Savings Regulation DD clauses, and our standard commercial high-liquidity rate structures. Safe physical deposit modules are deployed on individual and joint balances.`;
                    const sC4 = doc.splitTextToSize(c4Text, 175);
                    doc.text(sC4, 15, y);
                    y += sC4.length * 3.8 + 2;

                    // Clause 5
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 5: SEPARATE ARBITRATION & CO-OWNER DISPUTES', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c5Text = `Any private disputes regarding operational balances shall track Article 8 guidelines focusing on mandatory mediation in North Carolina. Standard technical bank disputes track First Pacific Commercial Arbitration protocols provided at ledger activation.`;
                    const sC5 = doc.splitTextToSize(c5Text, 175);
                    doc.text(sC5, 15, y);
                    y += sC5.length * 3.8 + 2;

                    // Clause 6
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 6: SEPARATE COMMUNICATION NODES AND ADDRESS ROUTING', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c6Text = `Master joint alerts are routed solely to Primary Address on file: ${activeAcc.loiConfig?.addressOwner || '124 Primrose Lane, Charlotte, NC'}. Real-time statements, dynamic card receipts, and transactional updates for specific subaccounts are routed cleanly to co-signer Node B: ${activeAcc.coOwner.address || 'Arlington, VA'}.`;
                    const sC6 = doc.splitTextToSize(c6Text, 175);
                    doc.text(sC6, 15, y);
                    y += sC6.length * 3.8 + 2;

                    // Clause 7
                    doc.setFont('Helvetica', 'bold');
                    doc.text('CLAUSE 7: FDIC CO-BENEFICIARY INSURANCE & INDEPENDENT TAX REPORTING', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    const c7Text = `Balances are dually insured up to the combined limit of $250,000.00 maximum per individual beneficiary under joint FDIC rules ($500,000.00 combined). Under Patriot Act CIP standards, SSN ${loiOwnerSsn} (You) and SSN ${loiCoOwnerSsn} (Alexander Mercer) are mapped for dual sovereign tracking to protect ledger integrity.`;
                    const sC7 = doc.splitTextToSize(c7Text, 175);
                    doc.text(sC7, 15, y);
                    y += sC7.length * 3.8 + 4;

                    // Divider before sign
                    doc.setDrawColor(203, 213, 225);
                    doc.line(15, y, 195, y);
                    y += 4;

                    // Signatures
                    doc.setFont('Helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.text('AUTHORIZED SIGNATORY HANDSHAKE SEALS', 15, y);
                    y += 4;
                    doc.setFont('Helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.text('Primary Owner Node (You):', 15, y);
                    doc.text('Co-Agent Node:', 110, y);
                    y += 3.5;
                    doc.setFont('Courier', 'bold');
                    doc.setTextColor(22, 163, 74); 
                    doc.text('SIGNED - EMAIL: info@lawrenceconsultantsorg.org', 15, y);
                    doc.text(`SIGNED - EMAIL: ${activeAcc.coOwner.email}`, 110, y);
                    y += 3.5;
                    doc.setFont('Helvetica', 'italic');
                    doc.setTextColor(148, 163, 184); 
                    doc.text(`Digital Seal: SHA-256//AIS-FPB-SECURE-90${activeAcc.accountNumber.replace('••••', '')}`, 15, y);
                    doc.text(`Digital Seal: SHA-256//AIS-FPB-COOWNER-12${activeAcc.accountNumber.replace('••••', '')}`, 110, y);

                    y += 5;
                    doc.setFont('Helvetica', 'bold');
                    doc.setTextColor(15, 23, 42); 
                    doc.text('FIRST PACIFIC COMPLIANCE SHIELD APPROVAL', 15, y);
                    y += 3.5;
                    doc.setFont('Helvetica', 'normal');
                    doc.setTextColor(37, 99, 235); 
                    doc.text('APPROVED & RECORDED IN FEDERAL ESCROW SYSTEM NODE FP-RESERVE-3000', 15, y);

                    // Embed Verification QR Code Block
                    const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
                    const verifyPayload = `${originHost}/verify?doc=LOI_${activeAcc.accountNumber.replace('•••• ', '')}&status=VERIFIED`;
                    const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 200);
                    embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 260, { width: 170, height: 20 });

                    // Save file
                    doc.save(`First_Pacific_Bank_LOI_Compliance_${activeAcc.accountNumber.replace('•••• ', '')}.pdf`);
                };

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900  animate-fade-in" onClick={() => setSelectedLoiAccount(null)} />
                        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-fade-in-up border border-slate-200 dark:border-white/10 flex flex-col" style={{ maxHeight: '90vh' }}>
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-500 text-emerald-500 rounded-2xl">
                                        <ShieldCheckIcon className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-widest">Sovereign Compliance & LOI Hub</h3>
                                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">First Pacific Private Reserved Bank // Regulation E & USA PATRIOT ACT Node</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedLoiAccount(null)}
                                    className="p-2.5 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white bg-slate-100 dark:bg-slate-900 rounded-full transition-colors border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer"
                                    id="close-loi-modal-btn"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-800">
                                {/* FDIC & CIP Information Header */}
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-white relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <BankIcon className="w-40 h-40" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#0F172A] tracking-widest mb-1">Combined Trust Escrow</p>
                                            <p className="text-3xl font-black text-amber-400 tracking-tighter">${baseAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                            <span className="text-[9px] text-emerald-400 font-mono tracking-wider font-extrabold block mt-2">● FDIC INSURED CO-BENEFICIARIES</span>
                                        </div>
                                        <div className="border-l border-slate-200 pl-6">
                                            <p className="text-[9px] font-black uppercase text-[#0F172A] tracking-widest mb-1">Joint Liability Status</p>
                                            <p className="text-lg font-bold text-emerald-500 tracking-tight flex items-center gap-1.5">
                                                <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                                                WAIVED
                                            </p>
                                            <span className="text-[9px] text-[#0F172A] leading-tight block mt-2">Clause 4 Activated: Partitioned structures override joint risk.</span>
                                        </div>
                                        <div className="border-l border-slate-200 pl-6">
                                            <p className="text-[9px] font-black uppercase text-[#0F172A] tracking-widest mb-1">SSN/TIN Mappings (Patriot Act)</p>
                                            <div className="space-y-1 mt-1 text-[10px] font-mono">
                                                <div className="flex justify-between">
                                                    <span className="text-[#0F172A]">Owner (You):</span>
                                                    <span className="text-emerald-400 font-bold">{ownerSsnVerified ? 'VERIFIED' : 'PENDING'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[#0F172A]">{activeAcc.coOwner.name}:</span>
                                                    <span className="text-emerald-400 font-bold">{coOwnerSsnVerified ? 'VERIFIED' : 'PENDING'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Warnings list */}
                                    <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2.5 text-[9px] text-[#0F172A] bg-slate-100 p-3 rounded-xl">
                                        <ExclamationCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                                        <p>
                                            <span className="text-amber-500 font-bold uppercase mr-1">Sovereign Tax Warning:</span>
                                            As a joint account, this asset is subject to individual IRS lien exposure. Separate TIN matching protects independent accounting boundaries.
                                        </p>
                                    </div>
                                </div>

                                {/* CLAUSE 1: Courier Shipping Toggle */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4 shadow-sm" id="clause-courier-config">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-[#0F172A] dark:text-white tracking-widest flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[9px] font-mono text-[#0F172A]">Clause 1</span>
                                                Operational Cost Allocation Options
                                            </h4>
                                            <p className="text-xs text-[#0F172A] mt-1">Select card shipment delivery tier. Costs are paid out of the total shared balance before split.</p>
                                        </div>
                                        <span className="text-[9px] bg-emerald-500 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-black tracking-widest uppercase">Agreement Clause 5</span>
                                    </div>

                                    {/* Selection Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div 
                                            onClick={() => {
                                                setLoiExpedited(false);
                                                setAccounts(prev => prev.map(a => a.id === selectedLoiAccount ? {
                                                    ...a, 
                                                    balance: baseAmount,
                                                    loiConfig: { ...a.loiConfig!, expeditedShippingSelected: false }
                                                } : a));
                                            }}
                                            className={`p-4 rounded-3xl border cursor-pointer transition-all flex justify-between items-center ${!loiExpedited ? 'border-primary bg-primary/5 dark:border-primary/20 bg-slate-50 dark:bg-slate-900' : 'border-slate-200 dark:border-white/10 dark:hover:bg-white hover:bg-slate-50'}`}
                                            id="shipping-standard-btn"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">Standard Courier Delivery</p>
                                                <p className="text-[10px] text-[#0F172A] mt-0.5">Delivery charge: $0.00 (Standard card issue is fully free)</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!loiExpedited ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                                {!loiExpedited && <span className="w-1.5 h-1.5 bg-slate-50 rounded-full dark:bg-slate-900" />}
                                            </div>
                                        </div>
                                        <div 
                                            onClick={() => {
                                                setLoiExpedited(true);
                                                setAccounts(prev => prev.map(a => a.id === selectedLoiAccount ? {
                                                    ...a, 
                                                    balance: baseAmount - 250,
                                                    loiConfig: { ...a.loiConfig!, expeditedShippingSelected: true }
                                                } : a));
                                            }}
                                            className={`p-4 rounded-3xl border cursor-pointer transition-all flex justify-between items-center ${loiExpedited ? 'border-primary bg-primary/5 dark:border-primary/20 bg-slate-50 dark:bg-slate-900' : 'border-slate-200 dark:border-white/10 dark:hover:bg-white hover:bg-slate-50'}`}
                                            id="shipping-expedited-btn"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] dark:text-white">Expedited Premium Overnight Handover</p>
                                                <p className="text-[10px] text-[#0F172A] mt-0.5">Deducted from Master Total BEFORE split ($250.00 courier fee)</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${loiExpedited ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                                {loiExpedited && <span className="w-1.5 h-1.5 bg-slate-50 rounded-full dark:bg-slate-900" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calculated Outputs Split Screen */}
                                    <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x dark:divide-white/5 divide-slate-200 shadow-inner">
                                        <div>
                                            <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Master Trust Pool</p>
                                            <p className="text-xl font-bold mt-1 text-[#0F172A] dark:text-white">${baseAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                            <span className="text-[8px] text-[#0F172A]">Total Joint Starting Ledger</span>
                                        </div>
                                        <div className="pt-4 md:pt-0">
                                            <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Shared Logistics Costs</p>
                                            <p className="text-xl font-bold mt-1 text-[#0F172A] dark:text-white">-${shippingCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                            <span className="text-[8px] text-[#0F172A]">Paid from collective escrow balance</span>
                                        </div>
                                        <div className="pt-4 md:pt-0">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                50/50 Subaccount Portion
                                            </p>
                                            <p className="text-xl font-black mt-1 text-emerald-500">${splitAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                            <span className="text-[8px] text-[#0F172A]">Deductions are NOT charged to private layers!</span>
                                        </div>
                                    </div>
                                </div>

                                {/* CLAUSE 2: Master Business Cards Mappings */}
                                <div className="space-y-4" id="clause-master-cards-mappings">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-[#0F172A] dark:text-white tracking-widest flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[9px] font-mono text-[#0F172A]">Clause 2</span>
                                                Sub-Account Master Business Cards
                                            </h4>
                                            <p className="text-xs text-[#0F172A] mt-1">Named cards generated and mapped exclusively to each signatory's 50% split allotment.</p>
                                        </div>
                                        <span className="text-[9px] primary- primary- dark:primary- px-2 py-1 rounded font-black tracking-widest uppercase">ACTIVE NODES</span>
                                    </div>

                                    {/* Mapped Cards Side-by-Side */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Primary Card */}
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200 p-6 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between h-48 shadow-xl">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-2xl"></div>
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <p className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">SUBACCOUNT A // MASTER CARD</p>
                                                    <p className="text-[10px] font-mono text-[#0F172A] mt-0.5">Linked Portion: ${splitAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                                </div>
                                                <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg uppercase tracking-wider text-[#0F172A] dark:bg-slate-800">BUSINESS</span>
                                            </div>

                                            <div className="relative z-10">
                                                <p className="text-lg font-mono tracking-widest">•••• •••• •••• 1184</p>
                                                <div className="flex justify-between items-end mt-4">
                                                    <div>
                                                        <p className="text-[8px] text-[#0F172A] uppercase tracking-widest">Card Signatory Name</p>
                                                        <p className="text-xs font-bold font-mono text-[#1E293B]">You (Primary Owner)</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setViewServicesCard(viewServicesCard === 'primary' ? null : 'primary')}
                                                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                                                    >
                                                        {viewServicesCard === 'primary' ? 'Hide Services' : 'View Services'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Co-Owner Card */}
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200 p-6 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between h-48 shadow-xl">
                                            <div className="absolute top-0 right-0 w-32 h-32 primary- rounded-full blur-2xl"></div>
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <p className="text-[9px] font-black tracking-widest primary- uppercase">SUBACCOUNT B // MASTER CARD</p>
                                                    <p className="text-[10px] font-mono text-[#0F172A] mt-0.5">Linked Portion: ${splitAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                                </div>
                                                <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg uppercase tracking-wider text-[#0F172A] dark:bg-slate-800">BUSINESS</span>
                                            </div>

                                            <div className="relative z-10">
                                                <p className="text-lg font-mono tracking-widest">•••• •••• •••• 5678</p>
                                                <div className="flex justify-between items-end mt-4">
                                                    <div>
                                                        <p className="text-[8px] text-[#0F172A] uppercase tracking-widest">Card Signatory Name</p>
                                                        <p className="text-xs font-bold font-mono text-[#1E293B]">{activeAcc.coOwner.name}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setViewServicesCard(viewServicesCard === 'co-owner' ? null : 'co-owner')}
                                                        className="px-2.5 py-1.5 primary- hover:primary- text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                                                    >
                                                        {viewServicesCard === 'co-owner' ? 'Hide Services' : 'View Services'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linked Payment Services Registry Card Panel */}
                                    {viewServicesCard && (
                                        <div className="bg-slate-50 text-[#1E293B] p-6 rounded-3xl border border-slate-200 shadow-2xl animate-fade-in space-y-4 dark:bg-slate-900">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheckIcon className="w-5 h-5 text-emerald-500 animate-pulse" />
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-white">Registered Mapped Payment Clearing Services</h5>
                                            </div>
                                            <p className="text-[11px] text-[#0F172A] leading-relaxed">
                                                Before standard card issuance, top modern US commercial bank regulations mandate that actual active payment nodes are explicitly enumerated and permitted:
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-white uppercase">ATM Access</p>
                                                    <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Active ($5K/d limit)</span>
                                                </div>
                                                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-white uppercase">Contactless POS</p>
                                                    <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Active Tap Enabled</span>
                                                </div>
                                                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-white uppercase">SWIFT / IBAN</p>
                                                    <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Global Clearing</span>
                                                </div>
                                                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-white uppercase">Electronic (EFT)</p>
                                                    <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Regulation E Compliant</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CLAUSE 3: Waiver of Liability & Signature Verification */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="clauses-regulatory-details">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
                                        <h4 className="text-xs font-black uppercase text-[#0F172A] dark:text-white tracking-widest flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[9px] font-mono text-[#0F172A]">Clause 3 & 4</span>
                                            Waiver Of Joint Liability & Disclosures
                                        </h4>
                                        <p className="text-[11px] text-[#0F172A] leading-relaxed dark:text-white">
                                            Joint & several liability resides under waiver. No Power of Attorney is established to ensure assets are strictly partitionable into individual ledger nodes with sole signatory governance.
                                        </p>
                                        <div className="p-4 bg-emerald-500 rounded-3xl border border-emerald-500/10 space-y-1">
                                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5 leading-none">
                                                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                                JOINT & SEVERAL RISK WAIVED
                                            </p>
                                            <p className="text-[9px] text-[#0F172A] dark:text-white font-bold">Overriding common law standards. Monitored by Federal Regulators.</p>
                                        </div>
                                    </div>

                                    {/* Clause 5 & 6: Communication protocol and separate notifications addresses */}
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
                                        <h4 className="text-xs font-black uppercase text-[#0F172A] dark:text-white tracking-widest flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[9px] font-mono text-[#0F172A]">Clause 5 & 6</span>
                                            Addresses Protocol & Communications
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 space-y-1">
                                                <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider">Joint Master Communications</p>
                                                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white">{activeAcc.loiConfig?.addressOwner || '124 Primrose Lane, Charlotte, NC (Primary)'}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 space-y-1">
                                                <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider">Separate Sub-Account Nodes Communications</p>
                                                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white">{activeAcc.coOwner.address || '789 West Oak Avenue, Arlington, VA 22201'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist of Documents Delivered */}
                                <div className="p-6 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4 shadow-inner" id="disclosures-delivery-checklist">
                                    <p className="text-[10px] font-black uppercase text-[#0F172A] dark:text-white tracking-widest">Compliance Document Audit Delivery Log</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-[#1E293B] dark:text-slate-100">
                                        <div className="flex items-center gap-2.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
                                            <span>Regulation E Disclosure & EFT Clearing Parameters</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Truth-In-Savings Regulation DD Regulatory Advisory</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Article 8 NC Mediation Forum Binding Covenant</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Universal Banking Commercial Tariff Fee Schedule</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer with PDF Download */}
                            <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-xs font-bold text-[#0F172A] dark:text-white">Mutual Agreement Signatures Complete</p>
                                    <p className="text-[10px] text-[#0F172A] mt-0.5 font-bold">Both signatories have authorized this decree via dually-authenticated secure keys.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setSelectedLoiAccount(null)}
                                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                        id="close-loi-footer-btn"
                                    >
                                        Close Hub
                                    </button>
                                    <button 
                                        onClick={handleGeneratePDF}
                                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                                        id="download-signed-loi-btn"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                        Download Signed LOI Document
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
