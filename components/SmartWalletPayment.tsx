
// ... existing imports ...
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/database';
import { 
    SpinnerIcon, 
    CheckCircleIcon, 
    ClockIcon,
    WalletIcon, 
    QrCodeIcon, 
    ClipboardDocumentIcon, 
    ArrowLeftIcon, 
    DocumentCheckIcon, 
    ExclamationTriangleIcon,
    CloudArrowUpIcon,
    ChatBubbleLeftRightIcon,
    PhoneIcon,
    GlobeAmericasIcon, 
    ShieldCheckIcon,
    BankIcon,
    CreditCardIcon,
    ArrowsRightLeftIcon,
    LockClosedIcon,
    ChevronRightIcon,
    UserCircleIcon,
    ArrowPathIcon,
    PaperClipIcon,
    SendIcon,
    XIcon,
    getServiceIcon,
    ExternalLink,
    EnvelopeIcon
} from './Icons';
import { compressImage } from '../utils/imageProcessor';
import { sendTwilioSms } from '../services/smsService';
import { sendEmail, generateBankingEmailTemplate, generateDebitAlertEmail } from '../services/emailService';
import { USER_PROFILE } from './constants';
import { socket } from '../services/socket';
import { UserProfile, Transaction, TransactionStatus, AccountType } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface SmartWalletPaymentProps {
    amount: number;
    onPaymentConfirmed: (generatedCode: string) => void;
    onBack: () => void;
    userProfile?: UserProfile;
}

type Step = 'restriction_notice' | 'payment_details' | 'request_method' | 'upload_receipt' | 'processing' | 'success' | 'stripe_gateway' | 'paypal_cashapp' | 'bank_transfer_support' | 'bank_transfer_request' | 'awaiting_bank_details' | 'awaiting_admin_code';
type SupportType = 'none' | 'chat' | 'voice';
type RailType = 'crypto' | 'wire' | 'sepa' | 'interac' | 'card' | 'paypal' | 'cashapp' | 'zelle' | 'wise';

const STRIPE_PAYMENT_URL = "https://buy.stripe.com/test_4gM5kFaqlgG7a3zbHX1Jm00";

const ALTERNATIVE_RAILS = [
    { id: 'card' as RailType, label: 'Stripe Secure Gateway', icon: CreditCardIcon, availability: 'Instant Clearance', details: { note: 'Mandatory gateway for external fiat settlement.' } },
    { id: 'paypal' as RailType, label: 'PayPal (via Stripe)', icon: getServiceIcon('PayPal'), availability: 'Redirection', details: { email: 'settlements@apexbank.com', note: 'Routing via Stripe Gateway.' } },
];

export const SmartWalletPayment: React.FC<SmartWalletPaymentProps> = ({ amount, onPaymentConfirmed, onBack, userProfile }) => {
    const { formatCurrency, displayCurrency, getCurrencyInfo } = useCurrency();
    const [step, setStep] = useState<Step>('restriction_notice');
    const [activeRail, setActiveRail] = useState<RailType>('crypto');
    const [receiptFile, setReceiptFile] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [activeSupport, setActiveSupport] = useState<SupportType>('none');
    const [chatMessages, setChatMessages] = useState<{ role: 'agent' | 'user'; text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [generatedRef, setGeneratedRef] = useState('');
    const [secureCode, setSecureCode] = useState('');
    const [verificationStage, setVerificationStage] = useState(0);
    const [processingMethod, setProcessingMethod] = useState('');
    
    // PayPal / CashApp state variables
    const [paypalEmail, setPaypalEmail] = useState('info@lawrenceconsultantsorg.org');
    const [cashappTag, setCashappTag] = useState('');
    const [activeSubMethod, setActiveSubMethod] = useState<'paypal' | 'cashapp'>('paypal');
    
    // Interactive VIP support chat state variables
    const [bankMessages, setBankMessages] = useState<{ role: 'agent' | 'user'; text: string; time: string }[]>([]);
    const [bankMessageInput, setBankMessageInput] = useState('');
    const [isBankAgentTyping, setIsBankAgentTyping] = useState(false);
    const [bankRefId, setBankRefId] = useState('');

    // formal Bank Transfer request states
    const [bankDepositorName, setBankDepositorName] = useState(() => {
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.name) return parsed.name;
                if (parsed?.fullName) return parsed.fullName;
            }
        } catch(e){}
        return userProfile?.name || USER_PROFILE.name || 'Lachy McLean';
    });
    const [bankInstitutionCountry, setBankInstitutionCountry] = useState('United States / JPMorgan Chase');
    const [bankTransferTicketId, setBankTransferTicketId] = useState('');
    const [bankTicketProgress, setBankTicketProgress] = useState(0);
    const [bankTicketResolved, setBankTicketResolved] = useState(false);
    const [bankTicketLog, setBankTicketLog] = useState('');
    const [pendingTxId, setPendingTxId] = useState('');
    const [enteredUnlockCode, setEnteredUnlockCode] = useState('');
    const [unlockCodeError, setUnlockCodeError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [cryptoNetwork, setCryptoNetwork] = useState<'btc' | 'eth' | 'trx' | 'bsc'>('btc');
    const [isScanningBlock, setIsScanningBlock] = useState(false);
    const [scanLogs, setScanLogs] = useState<string[]>([]);
    const [scanPercent, setScanPercent] = useState(0);


    const getFormattedAddress = () => {
        const addr = systemOptions?.assetDepositAddress || "1Bis7eVrPxePMqPaVYHqUUy7nzbjAjqVQN";
        if (cryptoNetwork === 'btc') {
            return addr;
        } else if (cryptoNetwork === 'eth' || cryptoNetwork === 'bsc') {
            return `0x${addr.substring(0, 6)}FC2A${addr.substring(6, 14)}7D9218e2E06eB971B`.substring(0, 42);
        } else if (cryptoNetwork === 'trx') {
            return `T${addr.substring(1, 8)}TrxEnclave${addr.substring(8, 16)}Reg3V`.substring(0, 34);
        }
        return addr;
    };

    const handleStartBlockchainScan = () => {
        setIsScanningBlock(true);
        setScanLogs([]);
        setScanPercent(0);

        const logs = [
            "INIT: Starting web3 connection pool and RPC relayers...",
            "RPC: Dialing ultra-premium crypto node clusters...",
            `INFO: Searching ${cryptoNetwork.toUpperCase()} mempools for TX containing ${formatCurrency(actualAmount)} equivalent...`,
            "QUERY: Scanning blockchain blocks for inbound transfers...",
            `TX_FOUND: Live transaction identified on ${cryptoNetwork.toUpperCase()} decentralized network...`,
            "VERIFYING: Awaiting cryptographic hash block confirmations (1/3 approvals)...",
            "VERIFYING: Awaiting cryptographic hash block confirmations (2/3 approvals)...",
            "VERIFYING: Awaiting cryptographic hash block confirmations (3/3 approvals)...",
            `PENDING: Hash identified. Awaiting Secure Node compliance sign-off.`
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < logs.length) {
                setScanLogs(prev => [...prev, logs[index]]);
                setScanPercent(Math.min(100, Math.round(((index + 1) / logs.length) * 100)));
                index++;
            } else {
                clearInterval(interval);
                
                const txIdForCrypto = `CRYPTO-${Math.floor(Math.random() * 90000000)}`;
                let email = 'unknown@example.com';
                let name = 'Client';
                try {
                    const stored = sessionStorage.getItem('active_user_profile');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed && typeof parsed === 'object') {
                            if (parsed.email) email = parsed.email;
                            if (parsed.name) name = parsed.name;
                        }
                    }
                } catch (e) {}

                socket.emit('user:pending_intervention', {
                    txId: txIdForCrypto,
                    type: 'CRYPTO CLEARANCE REVIEW',
                    status: `Verifying Hash on ${cryptoNetwork.toUpperCase()}`,
                    name: name,
                    email: email,
                    recipientName: 'Decentralized Vault',
                    amount: actualAmount,
                    currency: '$'
                });

                socket.on('user:intervention_resolved', function cryptoResolution(data: any) {
                    if (data.txId === txIdForCrypto) {
                        socket.off('user:intervention_resolved', cryptoResolution);
                        setIsScanningBlock(false);
                        if (data.resolution === 'approved') {
                            setScanLogs(prev => [...prev, `SUCCESS: Crypto Deposit validated. Committing blocks...`]);
                            setTimeout(() => {
                                processPaymentSuccess(`Blockchain (${cryptoNetwork.toUpperCase()})`);
                            }, 800);
                        } else {
                            setStep('restriction_notice');
                            alert("Crypto verification denied. Funds untraceable or insufficient confirmations.");
                        }
                    }
                });
            }
        }, 800);
    };

    const [systemOptions, setSystemOptions] = useState<any>(null);
    const [activeUserProfile, setActiveUserProfile] = useState<any>(null);
    const actualAmount = activeUserProfile?.profile?.protocolExternalBankAmount || amount;

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                setActiveUserProfile(JSON.parse(stored));
            }
        } catch (e) {}

        const handleSysOptUpdate = (opts: any) => {
            setSystemOptions(opts);
        };
        socket.on('admin:system_options_updated', handleSysOptUpdate);

        const handleUserUpdate = (users: any[]) => {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email) {
                    const match = users.find(u => u.email === parsed.email);
                    if (match) {
                        setActiveUserProfile(match);
                        sessionStorage.setItem('active_user_profile', JSON.stringify(match));
                    }
                }
            }
        };

        const handleProtocolInstruct = (data: any) => {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email === data.email) {
                    setActiveUserProfile((prev: any) => {
                        const updated = {
                            ...prev,
                            profile: {
                                ...(prev?.profile || {}),
                                protocolStatus: data.protocolStatus,
                                protocolInstructionsNote: data.protocolInstructionsNote,
                                protocolExternalBankName: data.protocolExternalBankName,
                                protocolExternalBankBeneficiary: data.protocolExternalBankBeneficiary,
                                protocolExternalBankIban: data.protocolExternalBankIban,
                                protocolExternalBankSwift: data.protocolExternalBankSwift,
                                protocolExternalBankAmount: data.protocolExternalBankAmount
                            }
                        };
                        sessionStorage.setItem('active_user_profile', JSON.stringify(updated));
                        return updated;
                    });
                }
            }
        };

        socket.on('sync_users', handleUserUpdate);
        socket.on('user:protocol_instruction_received', handleProtocolInstruct);
        socket.emit('admin:request_users');

        const storedSys = localStorage.getItem('prb_system_options_v2');
        if (storedSys) {
            try {
                setSystemOptions(JSON.parse(storedSys));
            } catch (e) {
                console.warn(e);
            }
        }

        return () => {
            socket.off('admin:system_options_updated', handleSysOptUpdate);
            socket.off('sync_users', handleUserUpdate);
            socket.off('user:protocol_instruction_received', handleProtocolInstruct);
        };
    }, []);

    useEffect(() => {
        if (!pendingTxId) return;

        const handleRealTimeCodeValue = (data: any) => {
            if (data && data.txId === pendingTxId) {
                if (data.resolution === 'approved' && data.code) {
                    setEnteredUnlockCode(data.code.toUpperCase());
                    setUnlockCodeError('');
                    processPaymentSuccess(processingMethod || 'Correspondent Bank Handshake', data.code);
                }
            }
        };

        socket.on('user:intervention_resolved', handleRealTimeCodeValue);
        return () => {
            socket.off('user:intervention_resolved', handleRealTimeCodeValue);
        };
    }, [pendingTxId, processingMethod]);

    const handleProtocolSelection = async (methodType: string, setRailAction: () => void) => {
        setRailAction();
        
        let email = 'system@bank.com';
        let name = 'Client';
        let amountStr = 'the required settlement';
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.email) email = parsed.email;
                if (parsed.name) name = parsed.name;
                if (parsed.profile?.protocolExternalBankAmount) {
                    amountStr = formatCurrency(parsed.profile.protocolExternalBankAmount);
                }
            }
        } catch(e) {}
        
        let protocolName = 'Verification Settlement';
        let customInstructions = '';
        
        // Use general DOM state for systemOptions since we can't easily access the React state inside the closure if it's stale,
        // Actually, we're in the component body so we have access to systemOptions.
        
        switch(methodType) {
            case 'crypto': 
                protocolName = 'Instant Crypto Payments'; 
                customInstructions = `
                <div style="background:#f8fafc; padding:20px; border-radius:10px; border: 1px solid #e2e8f0; margin:20px 0;">
                    <h4 style="margin-top:0; color:#0f172a; font-size:16px; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #cbd5e1; padding-bottom:10px;">Crypto Deposit Instructions</h4>
                    <p style="color:#334155; font-size:14px;">Please transmit exactly <strong>${amountStr}</strong> to one of the secure deposit wallets below. Failure to match the exact amount may cause processing delays.</p>
                    <div style="background:#ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Bitcoin (BTC) Network Address</p>
                        <p style="margin: 0; font-family: monospace; font-size: 14px; font-weight: bold; color: #0f172a; word-break: break-all;">${systemOptions?.cryptoDeposits?.btcAddress || 'bc1q_deposit_pending'}</p>
                    </div>
                    <div style="background:#ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Ethereum (ERC-20) / USDT Network Address</p>
                        <p style="margin: 0; font-family: monospace; font-size: 14px; font-weight: bold; color: #0f172a; word-break: break-all;">${systemOptions?.cryptoDeposits?.ethAddress || '0x_deposit_pending'}</p>
                    </div>
                </div>`;
                break;
            case 'p2p': 
                protocolName = 'PayPal or CashApp P2P'; 
                customInstructions = `
                <div style="background:#f8fafc; padding:20px; border-radius:10px; border: 1px solid #e2e8f0; margin:20px 0;">
                    <h4 style="margin-top:0; color:#0f172a; font-size:16px; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #cbd5e1; padding-bottom:10px;">P2P Escrow Deposit</h4>
                    <p style="color:#334155; font-size:14px;">Please resolve your verified node payment through our official handlers for exactly <strong>${amountStr}</strong>.</p>
                    <div style="background:#ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Official PayPal Handler</p>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">${systemOptions?.paypalEmail || 'escrow-clearance@firstpaba.com'}</p>
                    </div>
                    <div style="background:#ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Official CashApp Cashtag</p>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">${systemOptions?.cashappTag || '$EscrowClearance'}</p>
                    </div>
                </div>`;
                break;
            case 'stripe': 
                protocolName = 'Debit/Credit Stripe Gateway'; 
                customInstructions = `
                <div style="background:#f8fafc; padding:20px; border-radius:10px; border: 1px solid #e2e8f0; margin:20px 0;">
                    <h4 style="margin-top:0; color:#0f172a; font-size:16px; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #cbd5e1; padding-bottom:10px;">Credit / Debit Card Terminal</h4>
                    <p style="color:#334155; font-size:14px;">Your instant clearance terminal is ready. Follow the secure payment link via your secure routing portal to process settlement instantly via Stripe.</p>
                </div>`;
                break;
            case 'bank_transfer': 
                protocolName = 'Correspondent Bank Transfer'; 
                customInstructions = `
                <div style="background:#f8fafc; padding:20px; border-radius:10px; border: 1px solid #e2e8f0; margin:20px 0;">
                    <h4 style="margin-top:0; color:#0f172a; font-size:16px; text-transform:uppercase; letter-spacing:1px; border-bottom: 1px solid #cbd5e1; padding-bottom:10px;">Official Wire / Bank Transfer Form</h4>
                    <p style="color:#334155; font-size:14px;">Please authorize a wire transfer of exactly <strong>${amountStr}</strong> to the following receiving bank instructions:</p>
                    <table style="width:100%; border-collapse: collapse; margin-top:15px; font-size:13px;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Bank Name</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; color:#0f172a; text-align:right;">${systemOptions?.adminBankName || 'First Pacific Banking Group'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Account Name</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; color:#0f172a; text-align:right;">${systemOptions?.adminBankBeneficiary || name + ' FBO'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Routing/Sort Code</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; font-family:monospace; color:#0f172a; text-align:right;">${systemOptions?.adminBankRouting || 'PENDING'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Account/IBAN</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; font-family:monospace; color:#0f172a; text-align:right;">${systemOptions?.adminBankIban || 'PENDING ASSIGNMENT'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">SWIFT/BIC</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; font-family:monospace; color:#0f172a; text-align:right;">${systemOptions?.adminBankSwift || 'PENDING'}</td>
                        </tr>
                    </table>
                </div>`;
                break;
            case 'apple_google': protocolName = 'Apple Pay / Google Pay'; break;
            case 'zelle': protocolName = 'Zelle Wire Transfer'; break;
            case 'ach': protocolName = 'ACH Direct Transfer'; break;
        }

        const emailSubject = `External Payment Instruction Form - ${protocolName}`;
        const emailBody = generateBankingEmailTemplate(
            'EXTERNAL PAYMENT INSTRUCTION FORM',
            `
            <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 0;">Dear ${name},</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">You have selected <strong>${protocolName}</strong> for your account funding verification payment protocol.</p>
            ${customInstructions}
            <p style="font-size: 14px; line-height: 1.6; color: #334155; font-weight: 500;">Please process this payment immediately using the details above so your account is fully verified without delay. Copy the wallet ID or address exactly as shown.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">If you have any questions or require alternative wiring routes, reply directly to this notice.</p>
            <br/>
            <p style="font-size: 11px; color:#666;">Generated by Sovereign Core Payment Escrow Manager.</p>
            `,
            'Access Secure Portal',
            'https://firstpaba.com'
        );
        sendEmail(email, emailSubject, emailBody).catch(console.error);
    };

    const hasSentRestrictionEmail = useRef(false);

    useEffect(() => {
        if (step === 'restriction_notice' && !hasSentRestrictionEmail.current) {
            hasSentRestrictionEmail.current = true;
            let email = 'unknown@example.com';
            let name = 'Client';
            try {
                const stored = sessionStorage.getItem('active_user_profile');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && typeof parsed === 'object') {
                        if (parsed.email) email = parsed.email;
                        if (parsed.name) name = parsed.name;
                    }
                }
            } catch (e) {}

            const actualAmount = activeUserProfile?.profile?.protocolExternalBankAmount || amount;

            const emailSubject = "URGENT: Regulatory Clearance Hold & Settlement Instructions";
            const emailBody = generateBankingEmailTemplate(
                "Regulatory Clearance Notice",
                `Greetings ${name},<br/><br/>
System analytics have identified a <strong>Regulatory Clearance Hold</strong> on your account profile.<br/><br/>
After reviewing your account status with our Compliance and Operations Departments, we must respectfully clarify that a mandatory settlement fee of <strong>${formatCurrency(actualAmount)}</strong> is required to generate your unique clearance code. This fee <strong>cannot be deducted from your current balance or subaccount</strong>.<br/><br/>
Per First Pacific Bank security policy, all regulatory clearance and processing fees for internationally operational accounts must be settled from an external source. This requirement is not discretionary; it is a mandatory global compliance measure for the following reasons:<br/><br/>
<strong>1. Anti-Money Laundering (AML) & Source of Funds Verification</strong> – For international accounts, regulatory bodies require us to verify the source of funds. Payment from an external account serves as an essential layer of identity and financial validation, ensuring full transparency to lift the clearance hold.<br/><br/>
<strong>2. Subaccount Structure & Operational Integrity</strong> – Your current balance is designated strictly for operational transfers. Any internal deduction at this stage—prior to receiving your unique clearance code—would compromise the account's audit trail and severely delay the issuance of your full operational capabilities.<br/><br/>
<strong>3. Global Banking Compliance</strong> – International banking regulations mandate that clearance fees for cross-border accounts be paid externally to establish a clear, traceable financial footprint. This is standard practice observed by all major financial institutions to ensure the account's eligibility for unrestricted international wire transfers, ATM withdrawals, and large offshore payments.<br/><br/>
<strong>4. Secure Code Delivery</strong> – Your unique clearance code will be delivered via an encrypted channel directly to you immediately upon confirmation of the external payment.<br/><br/>
We understand this may require an extra step, but this protocol is strictly enforced to protect your financial assets and the integrity of the banking network.<br/><br/>
<strong>Immediate Action Required:</strong> To avoid further delays or potential account suspension, please reply to this email or contact our live 24/7 online support desk immediately to <strong>request an approved payment method of your choice</strong> (such as a secure external wire transfer, accredited cryptocurrency deposit, or partner network portal).<br/><br/>
Once the <strong>${formatCurrency(actualAmount)}</strong> settlement fee is processed, your unique clearance code will be generated and issued to you, fully restoring your account's international operational capabilities without restrictions.<br/><br/>
We appreciate your immediate cooperation and look forward to processing your clearance promptly.<br/><br/>
Yours sincerely,<br/>
<strong>Dr. Lois Martin</strong><br/>
Partnership Liaison & Compliance<br/>
First Pacific Bank`,
                "Contact Live Support"
            );
            
            if (activeUserProfile?.email || email !== 'unknown@example.com') {
                sendEmail(activeUserProfile?.email || email, emailSubject, emailBody).catch(console.error);
            }
        }
    }, [step, amount, activeUserProfile]);

    const walletAddress = systemOptions?.assetDepositAddress || "1Bis7eVrPxePMqPaVYHqUUy7nzbjAjqVQN";
    const paymentUrl = systemOptions?.stripePaymentUrl || "https://buy.stripe.com/test_4gM5kFaqlgG7a3zbHX1Jm00";

    useEffect(() => {
        if (activeSupport === 'chat' && chatMessages.length === 0) {
            setIsAgentTyping(true);
            setTimeout(() => {
                setChatMessages([{ role: 'agent', text: "Welcome to the Apex Concierge. I am Marcus, your dedicated settlement specialist. How can I assist with your ITCC clearance today?" }]);
                setIsAgentTyping(false);
            }, 1500);
        }
    }, [activeSupport]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isAgentTyping]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedDataUrl = await compressImage(file);
                setReceiptFile(compressedDataUrl);
            } catch (err) {
                console.error("Failed to compress image:", err);
                // Fallback to FileReader if compression fails
                const reader = new FileReader();
                reader.onload = () => setReceiptFile(reader.result as string);
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSubmitReceipt = () => {
        if (!receiptFile) return;
        handleVerifyMethod('Manual Audit (Crypto)');
    };

    const handleRailSelect = (rail: RailType) => {
        setActiveRail(rail);
        if (rail === 'card' || rail === 'paypal') {
            setStep('stripe_gateway');
        } else {
            setStep('payment_details');
        }
    };

    const processPaymentSuccess = async (methodName: string, existingCode?: string) => {
        // Generate a RANDOM Dynamic Code (Mandatory Requirement) unless provided by the real-time server
        const dynamicCode = existingCode || `REL-${Math.floor(100000 + Math.random() * 900000)}`;
        setSecureCode(dynamicCode);

        // Generate a reference ID
        const ref = `CLR-${Math.floor(Math.random() * 1000000)}-${methodName.substring(0,3).toUpperCase()}`;
        setGeneratedRef(ref);

        // Simulate Network Processing
        setTimeout(async () => {
            const date = new Date().toLocaleString();
            
            // 1. Construct Messages
            const formattedAmount = formatCurrency(actualAmount);
            const smsMessage = `ApexBank Alert: Payment of ${formattedAmount} verified via ${methodName}. Compliance Halt Lifted. Your Secure Clearance Code is: ${dynamicCode}. Do not share this code.`;
            
            const emailSubject = "Action Required: Compliance Clearance Code";
            const emailBody = generateBankingEmailTemplate(
                "Compliance Halt Lifted",
                `We have successfully processed your settlement fee of <strong>${formattedAmount}</strong> via ${methodName}.<br/><br/>
                 <strong>Transaction Ref:</strong> ${ref}<br/>
                 <strong>Date:</strong> ${date}<br/><br/>
                 Your Secure Clearance Code is:<br/>
                 <h1 style="font-size: 32px; letter-spacing: 4px; color: #0ec5f2;">${dynamicCode}</h1>
                 <br/>Please enter this code in the secure terminal to release your pending transaction.`,
                 "Login to Dashboard"
            );

            // 2. Dispatch Notifications IMMEDIATELY
            let phone = userProfile?.phone || USER_PROFILE.phone || '3159150854';
            let email = userProfile?.email || USER_PROFILE.email;
            let accountId = 'external_clearing';
            let availableBalance = 0;
            try {
                const stored = sessionStorage.getItem('active_user_profile');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && typeof parsed === 'object') {
                        if (parsed.phone) phone = parsed.phone;
                        if (parsed.email) email = parsed.email;
                    }
                }
                
                const accounts = await db.getAccounts(email);
                const checking = accounts.find(a => a.type === AccountType.CHECKING) || accounts[0];
                if (checking) {
                    accountId = checking.id;
                    availableBalance = checking.balance;
                }
            } catch (e) {
                console.warn("Could not read dynamic active user profile inside SmartWalletPayment", e);
            }
            
            // Create the Transaction Record
            const currencyInfo = getCurrencyInfo(displayCurrency);
            const feeTx: Transaction = {
                id: ref,
                accountId: accountId,
                recipient: {
                    id: 'apex_clearing',
                    fullName: 'Apex Clearing Port',
                    bankName: 'Federal Reserve Clearing',
                    accountNumber: '999999',
                    country: { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', phoneCode: '+1' },
                    realDetails: { accountNumber: '999999', routingNumber: '000000', bankName: 'Fed' }
                } as any,
                sendAmount: actualAmount,
                receiveAmount: actualAmount,
                fee: 0,
                exchangeRate: 1,
                status: TransactionStatus.COMPLETED,
                estimatedArrival: new Date(),
                statusTimestamps: {
                    [TransactionStatus.SUBMITTED]: new Date(),
                    [TransactionStatus.COMPLETED]: new Date()
                },
                description: `ITCC Clearance Code Processed - ${methodName}`,
                type: 'debit',
                category: 'Other',
                transferMethod: methodName,
                originalInputAmount: actualAmount,
                originalInputCurrencyCode: currencyInfo?.code || 'USD'
            };
            
            await db.saveTransaction(feeTx);
            
            // Send Debit Receipt with PDF via standard notification service
            import('../utils/notificationService').then(({ sendTransactionNotification }) => {
                sendTransactionNotification(feeTx, false, email, availableBalance, userProfile?.name);
            }).catch(console.error);

            console.log("Dispatching Clearance Code Notifications to: " + email + ", " + phone);
            
            // Send SMS (Fire and forget with UI error feedback)
            sendTwilioSms(phone, smsMessage).then(res => {
                if (!res.success && res.error) {
                    alert("Failure delivering SMS via Twilio:\n" + res.error);
                }
            }).catch(console.error);
            
            // Send Email (Fire and forget)
            sendEmail(email, emailSubject, emailBody).catch(console.error);
            
            // Dispatch Local Event for UI Toast (Fallback visual) - BUT HIDE CODE
            window.dispatchEvent(new CustomEvent('SIMULATED_OTP_SENT', { 
                detail: { 
                    code: undefined, // HIDE CODE FROM TOAST
                    message: "Payment Verified. Clearance Code sent to your registered email & phone." 
                } 
            }));

            // 3. Advance UI
            setStep('success');
            
            // 4. Close Modal after delay and pass the generated code back (shorter delay for beautiful UX)
            setTimeout(() => {
                onPaymentConfirmed(dynamicCode);
            }, 8000);
        }, 2000);
    };

    const handleVerifyMethod = (method: string) => {
        setProcessingMethod(method);
        const isScreenshotPayment = !!receiptFile;
        const txIdForPayment = `CLR-${Math.floor(Math.random() * 900000) + 100000}`;
        
        let phone = '3159150854';
        let email = 'unknown@example.com';
        let name = 'Client';
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.email) email = parsed.email;
                    if (parsed.name) name = parsed.name;
                    if (parsed.phone) phone = parsed.phone;
                }
            }
        } catch (e) {}

        // 1. If it's a screenshot payment, save and emit INSTANTLY without any delays!
        if (isScreenshotPayment) {
            const newTx: any = {
                id: txIdForPayment,
                accountId: 'settlement-clearing',
                senderName: name,
                senderEmail: email,
                recipient: {
                    fullName: 'First Pacific Bank Settlement',
                    bankName: 'First Pacific Bank, N.A.',
                    accountNumber: '••••••••8372',
                    routingNumber: '021000021',
                    bankCountry: 'USD',
                    recipientType: 'service'
                },
                sendAmount: actualAmount,
                sendCurrency: 'USD',
                receiveAmount: actualAmount,
                receiveCurrency: 'USD',
                fee: 0,
                status: TransactionStatus.AWAITING_PAYMENT_VERIFICATION,
                type: 'debit',
                category: 'Regulatory Compliance Fee',
                description: `Sovereign clearance fee settlement proof via ${method}`,
                screenshotProof: receiptFile,
                statusTimestamps: {
                    [TransactionStatus.SUBMITTED]: new Date(),
                    [TransactionStatus.AWAITING_PAYMENT_VERIFICATION]: new Date()
                }
            };

            // Async fire and forget but log success
            db.saveTransaction(newTx as Transaction)
                .then(() => console.log(`[DB] Real-time transaction logged instantly: ${txIdForPayment}`))
                .catch(e => console.error('[DB] Failed to save transaction instantly:', e));

            // Socket emit instantly to Admin Dashboard
            socket.emit('user:pending_intervention', {
                txId: txIdForPayment,
                type: 'FUNDS CLEARANCE',
                status: 'Awaiting Payment Verification',
                name: name,
                email: email,
                recipientName: 'First Pacific Bank Settlement',
                amount: actualAmount,
                currency: '$',
                screenshotProof: receiptFile || undefined
            });

            console.log(`[WS] Emitted pending_intervention instantly to admin for receipt payment ${txIdForPayment}`);
        }

        // Set up the listener instantly
        socket.on('user:intervention_resolved', function resolutionHandler(data: any) {
            if (data.txId === txIdForPayment) {
                socket.off('user:intervention_resolved', resolutionHandler);
                if (data.resolution === 'approved') {
                    processPaymentSuccess(method, data.code);
                } else {
                    setStep('restriction_notice');
                    alert("Payment verification denied by Sovereign Settlement Admin.");
                }
            }
        });

        // 2. Set UI steps
        setStep('processing');
        setVerificationStage(1);

        if (isScreenshotPayment) {
            // Accelerate processing step transitions so user arrives at 'awaiting_admin_code' instantly (e.g. 1.2 seconds total instead of 6.5s)
            setPendingTxId(txIdForPayment);
            setTimeout(() => setVerificationStage(2), 300);
            setTimeout(() => setVerificationStage(3), 600);
            setTimeout(() => setVerificationStage(4), 900);
            setTimeout(() => {
                setStep('awaiting_admin_code');
            }, 1200);
        } else {
            // Traditional flow for other methods
            setTimeout(() => setVerificationStage(2), 1500); // Handshake
            setTimeout(() => setVerificationStage(3), 3200); // Risk Analysis
            setTimeout(() => setVerificationStage(4), 5000); // Token Assembly
            setTimeout(async () => {
                socket.emit('user:pending_intervention', {
                    txId: txIdForPayment,
                    type: 'FUNDS CLEARANCE',
                    status: `Verifying ${method}`,
                    name: name,
                    email: email,
                    recipientName: 'First Pacific Bank Settlement',
                    amount: actualAmount,
                    currency: '$'
                });
            }, 6500);
        }
    };

    const handlePaymentVerified = () => {
        handleVerifyMethod('Stripe Secure Node');
    };

    const handleGenerateBankTicket = async () => {
        const ticketId = `TKT-BF-${Math.floor(100000 + Math.random() * 900000)}`;
        setBankTransferTicketId(ticketId);
        setStep('awaiting_bank_details');
        setBankTicketProgress(0);
        setBankTicketResolved(false);
        setBankTicketLog("Initializing secure handshake tunnel...");

        let phone = userProfile?.phone || USER_PROFILE.phone || '3159150854';
        let email = userProfile?.email || USER_PROFILE.email || 'info@lawrenceconsultantsorg.org';
        let fullName = bankDepositorName || userProfile?.name || USER_PROFILE.name || 'Client';

        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.phone) phone = parsed.phone;
                    if (parsed.email) email = parsed.email;
                }
            }
        } catch (e) {
            console.warn(e);
        }

        const date = new Date().toLocaleString();
        const emailSubject = `[SUPPORT CLEARANCE QUEUE] Bank Transfer Ticket Generated: ${ticketId}`;
        const emailBody = generateBankingEmailTemplate(
            `Secure Wire Settlement Ticket Opened`,
            `A formal bank routing transfer ticket has been generated by the client to settle the regulatory holding.<br/><br/>
             <strong>Ticket ID:</strong> ${ticketId}<br/>
             <strong>Depositor Name:</strong> ${fullName}<br/>
             <strong>Remitting Institution/Country:</strong> ${bankInstitutionCountry}<br/>
             <strong>Amount:</strong> ${formatCurrency(actualAmount)}<br/>
             <strong>Status:</strong> Awaiting Correspondent Routing Details Delivery<br/>
             <strong>Date:</strong> ${date}<br/><br/>
             Our compliance department has been notified. Marcus (Senior Settlement Officer) is preparing offshore correspondent IBAN routing instructions for this jurisdiction.`,
             "View Live Clearance Status"
        );

        sendEmail(email, emailSubject, emailBody).catch(console.error);
        sendEmail('support@apexbank.com', emailSubject, emailBody).catch(console.error);

        const smsMessage = `ApexBank Support Alert: Client ${fullName} opened Bank Settlement Ticket ${ticketId} for ${formatCurrency(actualAmount)}. Lock active. Prepare Private Wire Coordinates.`;
        sendTwilioSms(phone, smsMessage).then(res => {
            console.log("SMS support notification dispatched.", res);
        }).catch(console.error);

        socket.emit('admin:support_ticket_created', { ticketId, amount: actualAmount, fullName, bankInstitutionCountry });

        const logs = [
            "Initializing secure handshake tunnel...",
            "Encrypting wire routing channel with RSA-4096...",
            "Notifying Marcus & support adjusters...",
            "Marcus (Senior Settlement Officer) joined the queue...",
            "Mapping correspondent banking coordinates for US/Europe...",
            "Generating certified VIP Wire Vault address space...",
            "Wire endpoint synchronized successfully. Connection live!"
        ];

        let index = 0;
        const intervalId = setInterval(() => {
            setBankTicketProgress(prev => {
                const nextVal = prev + Math.floor(Math.random() * 12) + 8;
                if (nextVal >= 100) {
                    clearInterval(intervalId);
                    setBankTicketResolved(true);
                    setBankTicketLog(logs[logs.length - 1]);
                    return 100;
                }
                const logIndex = Math.min(logs.length - 2, Math.floor((nextVal / 100) * (logs.length - 1)));
                setBankTicketLog(logs[logIndex]);
                return nextVal;
            });
        }, 1100);
    };

    // VIP Support Chat handlers
    useEffect(() => {
        if (!bankRefId) {
            setBankRefId(`CLR-BANK-${Math.floor(100000 + Math.random() * 900000)}`);
        }
    }, [bankRefId]);

    useEffect(() => {
        if (step === 'bank_transfer_support' && bankMessages.length === 0) {
            setIsBankAgentTyping(true);
            const t1 = setTimeout(() => {
                setBankMessages([
                    {
                        role: 'agent',
                        text: `Welcome to the Elite Liquidity Concierge. I am Marcus, your Senior Settlement Officer representing First Pacific Bank.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                setIsBankAgentTyping(false);
                
                const t2 = setTimeout(() => {
                    setIsBankAgentTyping(true);
                    const t3 = setTimeout(() => {
                        setBankMessages(prev => [
                            ...prev,
                            {
                                role: 'agent',
                                text: `I have prepared customized offshore correspondent routing details to settle your compliance holding of ${formatCurrency(actualAmount)} in minutes. Please transfer directly to our correspondent bank details shown below, and once complete, attach the receipt. I is standby to verify immediately.`,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                        ]);
                        setIsBankAgentTyping(false);
                    }, 2200);
                }, 1200);
            }, 1000);

            return () => {
                clearTimeout(t1);
            };
        }
    }, [step, bankMessages.length, amount]);

    const handleSendBankMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankMessageInput.trim()) return;
        
        const userMsg = bankMessageInput;
        setBankMessages(prev => [
            ...prev,
            {
                role: 'user',
                text: userMsg,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        setBankMessageInput('');
        setIsBankAgentTyping(true);
        
        setTimeout(() => {
            let replyText = "Awaiting credit handshake from the correspondent routing bank. Please upload your transfer slip in the terminal slot below to trigger immediate clearance dispatch.";
            const msgLower = userMsg.toLowerCase();
            if (msgLower.includes('hello') || msgLower.includes('hi')) {
                replyText = "Good day! I am Marcus. I am actively monitoring the correspondent bank queues for your settlement transfer. Please upload your slip to trigger automated verification.";
            } else if (msgLower.includes('bank') || msgLower.includes('details') || msgLower.includes('iban') || msgLower.includes('swift')) {
                replyText = "The official routing credentials are fully mapped in the vault module below. If your corporate bank requires an alternative jurisdiction, please state it.";
            } else if (msgLower.includes('done') || msgLower.includes('sent') || msgLower.includes('pay') || msgLower.includes('transfer')) {
                replyText = "Magnificent. Please proceed with the 'Verify Card & Transmit' button below to upload your payment slip screenshot. I will instantly run the reconciliation handshake.";
            }
            setBankMessages(prev => [
                ...prev,
                {
                    role: 'agent',
                    text: replyText,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            setIsBankAgentTyping(false);
        }, 1500);
    };

    const handleChatSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
        setChatInput('');
        setIsAgentTyping(true);
        setTimeout(() => {
            setChatMessages(prev => [...prev, { role: 'agent', text: "Acknowledged. I'm verifying your node status with our compliance layer. One moment." }]);
            setIsAgentTyping(false);
        }, 2000);
    };

    useEffect(() => {
        const handleRealTimePayment = (e: CustomEvent) => {
            if (step === 'stripe_gateway' || step === 'processing') {
                const data = e.detail;
                if (data.status === 'COMPLETED_SECURE') {
                    // Start success directly using code generated by server-side webhook if available
                    processPaymentSuccess('Stripe Gateway', data.code);
                }
            }
        };
        window.addEventListener('REALTIME_PAYMENT_STATUS', handleRealTimePayment as EventListener);
        return () => window.removeEventListener('REALTIME_PAYMENT_STATUS', handleRealTimePayment as EventListener);
    }, [step]);

    const renderRailDetails = () => {
        if (activeRail === 'crypto') {
            const formattedAddress = getFormattedAddress();
            const qrText = cryptoNetwork === 'btc' ? `bitcoin:${formattedAddress}` : `${cryptoNetwork === 'eth' ? 'ethereum' : cryptoNetwork}:${formattedAddress}`;

            return (
                <div className="space-y-6 animate-fade-in">
                    {/* Network Selector Tabs */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
                        {(['btc', 'eth', 'trx', 'bsc'] as const).map((net) => (
                            <button
                                key={net}
                                onClick={() => setCryptoNetwork(net)}
                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    cryptoNetwork === net
                                        ? 'bg-primary text-[#0F172A] shadow-[0_4px_12px_rgba(14,197,242,0.3)]'
                                        : 'text-[#0F172A] hover:text-white hover:bg-white[0.03]'
                                }`}
                            >
                                {net}
                            </button>
                        ))}
                    </div>

                    {isScanningBlock ? (
                        /* Web3 Terminal Node Scanner */
                        <div className="bg-slate-100 border border-emerald-500/20 rounded-[2rem] p-6 font-mono text-left space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden h-64 flex flex-col justify-between">
                            <div className="space-y-2 overflow-y-auto max-h-44 custom-scrollbar flex-grow text-[10px]">
                                {scanLogs.map((log, index) => (
                                    <p key={index} className={`leading-relaxed ${
                                        log.startsWith('SUCCESS') ? 'text-emerald-400 font-bold' :
                                        log.startsWith('VERIFYING') ? 'text-amber-400' :
                                        log.startsWith('TX_FOUND') ? 'text-sky-400 font-bold' : 'text-[#0F172A]'
                                    }`}>
                                        <span className="text-emerald-500 mr-1.5">❯</span> {log}
                                    </p>
                                ))}
                            </div>
                            
                            <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                                <div className="flex justify-between items-center text-[9px] mb-1">
                                    <span className="text-emerald-400 uppercase font-black tracking-widest animate-pulse">Syncing Cryptographic State...</span>
                                    <span className="text-emerald-400 font-black">{scanPercent}%</span>
                                </div>
                                <div className="w-full bg-white rounded-full h-1 overflow-hidden dark:bg-slate-800">
                                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${scanPercent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Main Crypto Info Display */
                        <div className="space-y-6">
                            <div className="relative group">
                                <div className="bg-white p-6 rounded-[2.5rem] mx-auto w-48 h-48 flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-105 dark:bg-slate-800">
                                    <img src={`https://quickchart.io/qr?text=${encodeURIComponent(qrText)}&size=200`} alt="Wallet QR" className="w-full h-full mix-blend-multiply" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-xl">
                                    <p className="text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Node: {cryptoNetwork.toUpperCase()}_CLEARANCE_V2
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end pl-1">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em]">Asset Deposit Address</label>
                                    <span className="text-[8px] font-mono text-[#0F172A] uppercase">Auto-Formatted format</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-inner">
                                    <span className="font-mono text-[11px] text-primary tracking-tighter truncate flex-1">{formattedAddress}</span>
                                    <button onClick={() => handleCopy(formattedAddress)} className="p-2.5 bg-white hover:bg-primary hover:text-[#0F172A] dark:text-white text-[#0F172A] rounded-xl transition-all dark:bg-slate-800">
                                        {isCopied ? <CheckCircleIcon className="w-4 h-4 text-emerald-400"/> : <ClipboardDocumentIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>

                            {/* Network Specs metrics */}
                            <div className="grid grid-cols-2 gap-3 bg-white[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/10 text-left dark:bg-slate-800">
                                <div>
                                    <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">Est. Gas Surcharge</p>
                                    <p className="text-xs font-black text-white mt-0.5">
                                        {cryptoNetwork === 'btc' ? '0.00018 BTC (~$11.80)' :
                                         cryptoNetwork === 'eth' ? '0.0015 ETH (~$5.20)' :
                                         cryptoNetwork === 'trx' ? '0.15 USDT' : '0.10 USDT'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">Arrival Performance</p>
                                    <p className="text-xs font-black text-emerald-400 mt-0.5 animate-pulse">
                                        {cryptoNetwork === 'btc' ? '~10 Mins (1 Block)' :
                                         cryptoNetwork === 'eth' ? '~1-2 Mins (12 Blocks)' :
                                         cryptoNetwork === 'trx' ? '<30 Secs' : '<1 Min'}
                                    </p>
                                </div>
                            </div>

                            {/* Trigger Scan Button */}
                            <button
                                type="button"
                                onClick={handleStartBlockchainScan}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-600 text-emerald-400 rounded-2xl border border-emerald-500/20 font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowPathIcon className="w-4 h-4 animate-spin-slow" />
                                Try Simulated Web3 Ledger Sync
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };    return (
        <div className="dark w-full shadow-2xl">
            <div className="bg-slate-100 text-slate-100 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] w-full animate-fade-in-up relative border border-black/5 overflow-hidden flex flex-col h-[800px]">
                
                {/* Institutional Premium Motion Overlay Background - Deep clearance command style */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-b from-[#03050a] via-[#080d19] to-[#03050a]">
                    {/* Tech grid mesh overlay */}
                    <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                    
                    {/* Glowing light source bursts changing dynamically */}
                    <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-red-600 rounded-full blur-[100px] animate-pulse [animation-duration:8000ms]"></div>
                    <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[110px] animate-pulse [animation-duration:12000ms]"></div>
                    <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-amber-500 rounded-full blur-[80px] animate-pulse [animation-duration:15000ms]"></div>
                    
                    {/* Holographic scanning radar light sweep */}
                    <div className="absolute inset-[-100%] opacity-[0.03] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,#ffffff_180deg,transparent_360deg)] animate-spin [animation-duration:40s]"></div>

                    {/* Horizontal sweeping light line */}
                    <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent top-0 animate-bounce [animation-duration:6s]"></div>
                </div>

                {/* Header / Status */}
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white[0.02] z-20 flex-shrink-0 dark:bg-slate-800">
                <button 
                    onClick={() => {
                        if (step === 'awaiting_bank_details') return; // strictly locked
                        if (step === 'bank_transfer_request') setStep('request_method');
                        else if (step === 'request_method') setStep('restriction_notice');
                        else if (step === 'payment_details' || step === 'paypal_cashapp' || step === 'bank_transfer_support' || step === 'stripe_gateway') setStep('request_method');
                        else if (step === 'upload_receipt') setStep('payment_details');
                        else onBack();
                    }} 
                    disabled={step === 'awaiting_bank_details'}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group ${step === 'awaiting_bank_details' ? 'opacity-25 cursor-not-allowed text-slate-705' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white'}`}
                >
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Return</span>
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step === 'awaiting_bank_details' ? 'text-amber-500 animate-pulse' : 'text-primary'}`}>
                            {step === 'awaiting_bank_details' ? 'Session Locked' : 'Node Secure'}
                        </span>
                        <span className="text-[8px] font-mono text-[#0F172A]">
                            {step === 'awaiting_bank_details' ? 'TRANSFER_LOCK' : 'ENCR_RSA_4096'}
                        </span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${step === 'awaiting_bank_details' ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_12px_#10b981]'}`}></div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 z-10 flex flex-col">
                {step === 'restriction_notice' && (
                    <div className="space-y-8 animate-fade-in py-4">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500 rounded-[2.5rem] ring-1 ring-red-500/30 mb-8 relative">
                                <div className="absolute inset-0 bg-red-500 rounded-[2.5rem] animate-ping opacity-20"></div>
                                <ShieldCheckIcon className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase mb-2 leading-none">
                                {activeUserProfile?.profile?.protocolStatus === 'WARNING' ? (
                                    <>Security<br/>Advisory</>
                                ) : activeUserProfile?.profile?.protocolStatus === 'APPROVED' ? (
                                    <>Clearance<br/>Granted</>
                                ) : activeUserProfile?.profile?.protocolStatus === 'CUSTOM_OVERRIDE' ? (
                                    <>Sovereign<br/>Handshake</>
                                ) : (
                                    <>Security<br/>Restriction</>
                                )}
                            </h3>
                            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mt-4 ${
                                activeUserProfile?.profile?.protocolStatus === 'APPROVED' ? 'text-emerald-500' :
                                activeUserProfile?.profile?.protocolStatus === 'CUSTOM_OVERRIDE' ? 'text-violet-500 animate-pulse' :
                                activeUserProfile?.profile?.protocolStatus === 'WARNING' ? 'text-red-550 animate-pulse' :
                                'text-red-400 animate-pulse'
                            }`}>
                                Compliance Protocol: {activeUserProfile?.profile?.protocolStatus || "LVL_4_HOLD"}
                            </p>
                        </div>
                        
                        <div className={`bg-slate-50 dark:bg-slate-900 border p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group transition-all duration-300 ${
                            activeUserProfile?.profile?.protocolStatus === 'APPROVED' ? 'border-emerald-500/30 shadow-emerald-500/5' :
                            activeUserProfile?.profile?.protocolStatus === 'CUSTOM_OVERRIDE' ? 'border-violet-500/30 shadow-violet-500/5' :
                            activeUserProfile?.profile?.protocolStatus === 'WARNING' ? 'border-red-500/40 shadow-red-500/5' :
                            'border-red-500/20'
                        }`}>
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ExclamationTriangleIcon className="w-32 h-32" />
                            </div>
                            <div className="text-[#0F172A] dark:text-white text-sm leading-relaxed font-semibold relative z-10 space-y-4">
                                {activeUserProfile?.profile?.protocolInstructionsNote ? (
                                    <p>{activeUserProfile.profile.protocolInstructionsNote}</p>
                                ) : (
                                    <>
                                        <p>System analytics have identified an active <strong className="text-[#0F172A] dark:text-white font-black uppercase">Regulatory Clearance Hold</strong> on your account profile.</p>
                                        <p className="text-xs text-[#0F172A] dark:text-white font-bold">After reviewing your status with our Compliance and Operations Departments, a mandatory settlement clearance fee of <strong className="text-[#0F172A] dark:text-white font-bold">{formatCurrency(actualAmount)}</strong> is required to dispatch your unique cryptographic clearance token. Note that per Federal Reserve and international Humanitarian Project protocol, this fee cannot be deducted from your current balance or subaccount.</p>
                                        <p className="text-xs text-[#0F172A] dark:text-white font-bold">External settlement guarantees traceable audit verification, complying with standard Anti-Money Laundering (AML) source of funds validation before operational capabilities can be released.</p>
                                    </>
                                )}
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-900"></div>
                            <div className="flex justify-between items-end relative z-10">
                                <div>
                                    <p className="text-[9px] text-[#0F172A] uppercase font-black tracking-widest mb-1">Mandatory Settle Fee</p>
                                    <p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">
                                        {formatCurrency(actualAmount)}
                                    </p>
                                </div>
                                <span className={`text-[8px] px-2 py-1 rounded font-black uppercase border ${
                                    activeUserProfile?.profile?.protocolStatus === 'APPROVED' ? 'bg-emerald-500 text-emerald-400 border-emerald-500/20' :
                                    activeUserProfile?.profile?.protocolStatus === 'CUSTOM_OVERRIDE' ? 'bg-violet-500 text-violet-400 border-violet-500/20' :
                                    'bg-red-500 text-red-500 dark:text-red-400 border-red-500/20'
                                }`}>
                                    {activeUserProfile?.profile?.protocolStatus || "Required"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button onClick={() => setStep('request_method')} className="w-full py-5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 group flex items-center justify-center gap-3">
                                Enter Smart Gateway
                                <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'request_method' && (
                    <div className="space-y-8 animate-fade-in py-2">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 border border-amber-500/20 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 animate-pulse">
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-500" />
                                Secure Regulatory Gateway Active
                            </div>
                            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase mb-2">Protocol Selection</h3>
                            <p className="text-slate-550 dark:text-white text-[10px] font-black uppercase tracking-widest leading-relaxed">Select secure clearance rail to settle reference: <span className="font-mono text-amber-500 font-black px-1.5 py-0.5 bg-slate-100 rounded border border-black/5">{activeUserProfile?.id || 'CORE-HOLD'}</span></p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Option 1: Instant Crypto Payments */}
                             {!(activeUserProfile?.disabledPaymentMethods || []).includes('crypto') && !(systemOptions?.globalDisabledPaymentMethods || []).includes('crypto') && (
                             <div className="flex flex-col justify-between p-7 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-white/10 rounded-[2.5rem] hover:border-primary/60 transition-all duration-300 group shadow-[0_15px_40px_rgba(0,0,0,0.1)] hover:shadow-primary/10 relative overflow-hidden ">
                                <div className="absolute -top-6 -right-6 p-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                                    <WalletIcon className="w-32 h-32 text-primary" />
                                </div>
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center">
                                        <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
                                            <WalletIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg font-black">
                                            AUTOMATED RAIL
                                        </span>
                                    </div>
                                    <div className="text-left space-y-2">
                                        <h4 className="font-black text-[#0F172A] dark:text-white uppercase tracking-tight text-xl">Instant Crypto</h4>
                                        <p className="text-xs text-[#0F172A] dark:text-slate-450 font-bold leading-relaxed">
                                            Supports major decentralized blockchain networks (BTC, ETH, USDT). Real-time ledger verification with zero counterparty delays or banking hold-backs.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-8 mt-4 border-t border-slate-200/50 dark:border-white/10">
                                    <button 
                                        onClick={() => handleProtocolSelection('crypto', () => { setActiveRail('crypto'); setStep('payment_details'); })} 
                                        className="w-full py-4 bg-primary hover:bg-primary/95 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(243,186,47,0.4)] shadow-lg transform active:scale-[0.98]"
                                    >
                                        Initialize Crypto Rail
                                        <ChevronRightIcon className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-all" />
                                    </button>
                                </div>
                             </div>
                             )}

                             {/* Option 2: Real Bank Transfer Option */}
                             {(!(activeUserProfile?.disabledPaymentMethods || []).includes('wire') && !(systemOptions?.globalDisabledPaymentMethods || []).includes('wire') && !(activeUserProfile?.disabledPaymentMethods || []).includes('ach') && !(systemOptions?.globalDisabledPaymentMethods || []).includes('ach')) && (
                             <div className="flex flex-col justify-between p-7 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-white/10 rounded-[2.5rem] hover:border-amber-500/60 transition-all duration-300 group shadow-[0_15px_40px_rgba(0,0,0,0.1)] hover:shadow-amber-500/10 relative overflow-hidden ">
                                <div className="absolute -top-6 -right-6 p-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                                    <BankIcon className="w-32 h-32 text-amber-500" />
                                </div>
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center">
                                        <div className="p-3.5 bg-amber-500 rounded-2xl text-amber-500 border border-amber-500/20 shadow-inner">
                                            <BankIcon className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <span className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 bg-amber-500 text-amber-400 border border-amber-500/20 rounded-lg font-black">
                                            VIP HANDSHAKE
                                        </span>
                                    </div>
                                    <div className="text-left space-y-2">
                                        <h4 className="font-black text-[#0F172A] dark:text-white uppercase tracking-tight text-xl">Bank Wire Transfer</h4>
                                        <p className="text-xs text-[#0F172A] dark:text-slate-450 font-bold leading-relaxed">
                                            Generate custom premium offshore routing coordinates matched perfectly to your jurisdiction. Integrates directly with Senior Settlement Officer live chat.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-8 mt-4 border-t border-slate-200/50 dark:border-white/10">
                                    <button 
                                        onClick={() => handleProtocolSelection('bank_transfer', () => { setStep('bank_transfer_request'); })} 
                                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] shadow-lg transform active:scale-[0.98]"
                                    >
                                        Initialize Bank Transfer
                                        <ChevronRightIcon className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-all" />
                                    </button>
                                </div>
                             </div>
                             )}
                        </div>
                    </div>
                )}

                {step === 'paypal_cashapp' && (
                    <div className="space-y-6 animate-fade-in py-2 flex-grow flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">PayPal & CashApp</h3>
                                <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-widest">Select Peer-to-Peer settlement node</p>
                            </div>

                            {/* P2P Sub Tab */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                                <button 
                                    onClick={() => setActiveSubMethod('paypal')} 
                                    className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all core-flex ${activeSubMethod === 'paypal' ? 'bg-[#003087] text-white shadow-xl' : 'text-[#0F172A] hover:text-white'}`}
                                >
                                    PayPal Gateway
                                </button>
                                <button 
                                    onClick={() => setActiveSubMethod('cashapp')} 
                                    className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all core-flex ${activeSubMethod === 'cashapp' ? 'bg-[#00D632] text-slate-950 shadow-xl' : 'text-[#0F172A] hover:text-white'}`}
                                >
                                    Cash App Node
                                </button>
                            </div>

                            {activeSubMethod === 'paypal' ? (
                                <div className="space-y-4 animate-fade-in bg-white border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] dark:bg-slate-800">
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-[#0F172A] uppercase font-black tracking-widest">Verification Target PayPal Email</label>
                                        <input 
                                            type="email" 
                                            value={paypalEmail} 
                                            onChange={(e) => setPaypalEmail(e.target.value)} 
                                            className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 p-4 rounded-xl font-mono text-xs text-white uppercase focus:border-[#003087] focus:outline-none"
                                        />
                                    </div>
                                    
                                    <div className="bg-[#003087]/10 border border-[#003087]/20 rounded-xl p-4 space-y-2">
                                        <p className="text-[10px] primary- leading-relaxed font-semibold">
                                            PayPal Gateway will connect dynamically to register the <strong>{formatCurrency(actualAmount)}</strong> regulatory settlement under ownership of {paypalEmail}.
                                        </p>
                                    </div>

                                    {/* Direct Stripe Integration link for PayPal */}
                                    <button 
                                        onClick={async () => {
                                            setIframeLoading(true);
                                            try {
                                                const res = await fetch('/api/stripe/create-checkout-session', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ amount: actualAmount, purpose: 'PayPal Settlement Verification', email: paypalEmail, paymentMethodTypes: ['paypal'] })
                                                });
                                                const data = await res.json();
                                                if (res.ok && data.url) {
                                                    window.open(data.url, 'paypal_popup', 'width=600,height=800');
                                                } else {
                                                    window.open("https://paypal.me/", 'paypal_popup', 'width=600,height=800');
                                                }
                                            } catch (e) {
                                                window.open("https://paypal.me/", 'paypal_popup', 'width=600,height=800');
                                            } finally {
                                                setIframeLoading(false);
                                            }
                                        }}
                                        className="w-full py-4 bg-[#003087] hover:bg-[#002060] text-white flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-105 active:scale-95"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Launch Automated PayPal Link
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in bg-white border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] text-center dark:bg-slate-800">
                                    <div className="relative group max-w-[140px] mx-auto">
                                        <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg dark:bg-slate-800">
                                            <img src="https://quickchart.io/qr?text=https%3A%2F%2Fcash.app%2F%24FirstPacificGlobal&size=120" alt="CashApp QR" className="w-[120px] h-[120px] mix-blend-multiply" />
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00D632] text-slate-950 font-black text-[8px] tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow">
                                            $FirstPacificGlobal
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-left pt-2">
                                        <label className="text-[9px] text-[#0F172A] uppercase font-black tracking-widest">Your CashApp Cashtag</label>
                                        <input 
                                            type="text" 
                                            placeholder="$YourTag"
                                            value={cashappTag} 
                                            onChange={(e) => setCashappTag(e.target.value)} 
                                            className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 p-4 rounded-xl font-mono text-xs text-white focus:border-[#00D632] focus:outline-none"
                                        />
                                    </div>

                                    <div className="bg-[#00D632]/5 border border-[#00D632]/20 rounded-xl p-4 text-left">
                                        <p className="text-[10px] text-emerald-300 leading-relaxed font-semibold">
                                            Provide your personal Cashtag handle above, upload transaction confirmation or slip, then select synchronization verifying node.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Drop Receipt interface */}
                            <div className="border border-dashed border-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 cursor-pointer text-center relative transition-all" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                {receiptFile ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                        <span>Receipt Slip Anchored</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-[#0F172A]">
                                        <PaperClipIcon className="w-5 h-5 text-[#0F172A]" />
                                        <span className="text-[10px] uppercase font-black tracking-widest">Anchor Transfer Slip (Recommended)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={() => handleVerifyMethod(activeSubMethod === 'paypal' ? 'PayPal P2P Sync Node' : 'CashApp P2P Ledger Node')}
                                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                            >
                                <LockClosedIcon className="w-4 h-4" />
                                Synchronize Settlement Ledger
                            </button>
                            <button onClick={() => setStep('request_method')} className="w-full py-4 text-[10px] uppercase font-black tracking-widest text-[#0F172A] hover:text-white text-center transition-colors">
                                Return to Protocols
                            </button>
                        </div>
                    </div>
                )}

                {step === 'stripe_gateway' && (
                    <div className="h-full flex flex-col space-y-6 animate-fade-in p-2">
                         <div className="flex items-center justify-between px-2">
                             <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <CreditCardIcon className={`w-5 h-5 ${activeRail === 'paypal' ? 'text-primary-500' : 'text-[#635BFF]'}`} /> 
                                {activeRail === 'paypal' ? 'PayPal Secure Checkout' : 'Stripe Secure Gateway'}
                             </h3>
                             <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">TLS 1.3 ENCRYPTED</p>
                        </div>
                        
                        <div className="flex-grow flex flex-col items-center justify-center space-y-8 text-center bg-white rounded-3xl p-8 border border-slate-200 dark:border-white/10 relative overflow-hidden dark:bg-slate-800">
                             <div className={`absolute inset-0 bg-gradient-to-br from-transparent opacity-70 ${activeRail === 'paypal' ? 'from-primary-500' : 'from-[#635BFF]/10'}`}></div>
                             
                             <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center border ${activeRail === 'paypal' ? 'bg-primary-500 border-primary-500/20' : 'bg-[#635BFF]/10 border-[#635BFF]/20'}`}>
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-70 ${activeRail === 'paypal' ? 'bg-primary-500' : 'bg-[#635BFF]/20'}`}></div>
                                <CreditCardIcon className={`w-10 h-10 ${activeRail === 'paypal' ? 'text-primary-500' : 'text-[#635BFF]'}`} />
                             </div>
                             
                             <div className="relative z-10 space-y-3">
                                <h4 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">External Gateway</h4>
                                <p className="text-xs text-[#0F172A] dark:text-white max-w-xs mx-auto font-bold leading-relaxed">
                                    Security protocols require settlement via our secure {activeRail === 'paypal' ? 'PayPal' : 'Stripe'} terminal. This will open in a new encrypted window.
                                </p>
                             </div>

                             <button 
                                onClick={async () => {
                                    setIframeLoading(true);
                                    try {
                                        const stored = sessionStorage.getItem('active_user_profile');
                                        let email = 'unknown@example.com';
                                        if (stored) {
                                            const parsed = JSON.parse(stored);
                                            if (parsed?.email) email = parsed.email;
                                        }

                                        const res = await fetch('/api/stripe/create-checkout-session', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ amount: actualAmount, purpose: activeRail === 'paypal' ? 'PayPal Regulatory Settlement' : 'Compliance Clearance Fee', email, paymentMethodTypes: activeRail === 'paypal' ? ['paypal'] : ['card'] })
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.url) {
                                            window.open(data.url, 'stripe_popup', 'width=600,height=800,scrollbars=yes,resizable=yes');
                                        } else {
                                            // Fallback to static URL from system options if backend Stripe fails
                                            let staticUrl = systemOptions?.stripePaymentUrl || "https://buy.stripe.com/test_4gM5kFaqlgG7a3zbHX1Jm00";
                                            window.open(staticUrl, 'stripe_popup', 'width=600,height=800,scrollbars=yes,resizable=yes');
                                        }
                                    } catch(e) {
                                        let staticUrl = systemOptions?.stripePaymentUrl || "https://buy.stripe.com/test_4gM5kFaqlgG7a3zbHX1Jm00";
                                        window.open(staticUrl, 'stripe_popup', 'width=600,height=800,scrollbars=yes,resizable=yes');
                                    } finally {
                                        setIframeLoading(false);
                                    }
                                }}
                                disabled={iframeLoading}
                                className={`relative z-10 px-8 py-5 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_40px_-10px_rgba(99,91,255,0.5)] transition-all transform hover:scale-105 flex items-center gap-3 group disabled:opacity-70 ${activeRail === 'paypal' ? 'bg-[#003087] hover:bg-[#002060]' : 'bg-[#635BFF] hover:bg-[#534be0]'}`}
                             >
                                {iframeLoading ? <SpinnerIcon className="w-5 h-5 animate-spin text-white" /> : <span>Launch {activeRail === 'paypal' ? 'PayPal' : 'Stripe'} Terminal</span>}
                                {!iframeLoading && <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                             </button>
                             
                             <div className="relative z-10 flex items-center gap-2 text-[9px] text-[#0F172A] font-mono uppercase tracking-widest">
                                <LockClosedIcon className="w-3 h-3" />
                                <span>Session ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                             </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setStep('request_method')} className="flex-1 py-4 text-xs font-bold text-[#0F172A] uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors bg-white rounded-2xl hover:bg-white dark:bg-slate-800">Back</button>
                            <button onClick={handlePaymentVerified} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 transform active:scale-95 group">
                                <CheckCircleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                                I Have Completed Payment
                            </button>
                        </div>
                    </div>
                )}

                {step === 'bank_transfer_request' && (
                    <div className="space-y-6 animate-fade-in py-2 flex-grow flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Initiate Wire Clearance</h3>
                                <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-widest">Formal Bank Transfer Request Ticket</p>
                            </div>

                            <div className="space-y-4 bg-white[0.02] border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] dark:bg-slate-800">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] text-[#0F172A] uppercase font-black tracking-widest">Depositor Full Name</label>
                                    <input 
                                        type="text" 
                                        value={bankDepositorName} 
                                        onChange={(e) => setBankDepositorName(e.target.value)} 
                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-sans text-xs text-white uppercase focus:border-amber-500 focus:outline-none"
                                        placeholder={userProfile?.name || USER_PROFILE.name || "Lachy McLean"}
                                    />
                                </div>

                                <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] text-[#0F172A] uppercase font-black tracking-widest">Remitting Institution / Country</label>
                                    <input 
                                        type="text" 
                                        value={bankInstitutionCountry} 
                                        onChange={(e) => setBankInstitutionCountry(e.target.value)} 
                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl font-sans text-xs text-white focus:border-amber-500 focus:outline-none"
                                        placeholder="e.g. United States / JPMorgan Chase"
                                    />
                                </div>

                                <div className="bg-amber-500 border border-amber-500/20 rounded-xl p-4 text-left space-y-1">
                                    <p className="text-[10px] text-amber-200 leading-relaxed font-semibold">
                                        Settlement Hold Fee: <strong className="text-white">${formatCurrency(actualAmount)}</strong>
                                    </p>
                                    <p className="text-[9px] text-[#0F172A] leading-relaxed font-bold">
                                        Your request will dispatch alert coordinates to Marcus for custom offshore correspondent bank credentials matching your country profile.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleGenerateBankTicket}
                                className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-transform"
                            >
                                <LockClosedIcon className="w-4 h-4 text-slate-950" />
                                Transmit Request & Open Ticket
                            </button>
                            <button onClick={() => setStep('request_method')} className="w-full py-2.5 text-[10px] uppercase font-black tracking-widest text-[#0F172A] hover:text-white text-center transition-colors">
                                Return to Protocols
                            </button>
                        </div>
                    </div>
                )}

                {step === 'awaiting_bank_details' && (
                    <div className="space-y-6 animate-fade-in py-4 flex-grow flex flex-col justify-between">
                        <div className="text-center space-y-4">
                            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-[2rem] border border-amber-500/20 mb-2">
                                <div className="absolute inset-0 rounded-[2rem] bg-amber-500 animate-ping opacity-20"></div>
                                <SpinnerIcon className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Awaiting Bank Details</h3>
                                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse font-mono">Ticket ID: {bankTransferTicketId}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] space-y-4 text-left shadow-2xl relative overflow-hidden">
                            <div className="space-y-3 relative z-10">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                                    <span className="text-[9px] text-[#0F172A] uppercase font-bold tracking-widest">Handshake Status</span>
                                    <span className="text-[9px] px-2 py-0.5 bg-amber-500 text-amber-400 rounded-md font-black uppercase tracking-widest animate-pulse border border-amber-500/20">AGENT_REVIEWS_PENDING</span>
                                </div>
                                <div className="space-y-1 font-sans text-xs text-[#0F172A]">
                                    <p className="leading-relaxed font-semibold">
                                        For security compliance under <strong className="text-red-400">LEVEL 4 SECURITY HOLD</strong>, this screen is temporarily locked. Marcus is actively reviewing your origin bank profile and generating verified routing coordinates.
                                    </p>
                                    <div className="pt-2">
                                        <p className="text-[8px] text-[#0F172A] font-bold uppercase tracking-widest mb-1 font-mono">Real-Time Cryptographic Engine Logs</p>
                                        <div className="bg-slate-100 border border-slate-200 dark:border-white/10 p-3 rounded-lg font-mono text-[9px] text-[#0ec5f2] leading-tight flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0ec5f2] animate-ping shrink-0"></span>
                                            <span className="truncate">{bankTicketLog}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Live Verification Progress Indicator */}
                            <div className="space-y-1 font-sans">
                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-[#0F172A] font-mono">
                                    <span>Syncing Transfer Channels</span>
                                    <span>{bankTicketProgress}%</span>
                                </div>
                                <div className="w-full bg-white rounded-full h-1 overflow-hidden dark:bg-slate-800">
                                    <div 
                                        className="bg-amber-500 h-full transition-all duration-500 ease-out"
                                        style={{ width: `${bankTicketProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                            {bankTicketResolved ? (
                                <button 
                                    onClick={() => setStep('bank_transfer_support')}
                                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 animate-bounce hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                                >
                                    <CheckCircleIcon className="w-4 h-4 text-slate-950" />
                                    Access Wire Vault Coordinates
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-4 text-[9px] text-[#0F172A] uppercase font-black tracking-widest font-mono">
                                    <LockClosedIcon className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                                    <span>Compliance Navigation Lock Active</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'bank_transfer_support' && (
                    <div className="h-full flex flex-col justify-between animate-fade-in space-y-4">
                        <div className="space-y-3">
                            {/* Concierge Mini Chat Header */}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/15 p-4 rounded-2xl">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-amber-500/20 dark:bg-slate-800">
                                        <UserCircleIcon className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse"></div>
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-black text-white text-xs uppercase">Marcus (Global Concierge Support)</p>
                                    <p className="text-[9px] text-amber-500 uppercase font-black tracking-widest leading-none">Senior Settlement Officer</p>
                                </div>
                            </div>

                            {/* Live Chat Window */}
                            <div className="h-44 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl p-4 overflow-y-auto flex flex-col space-y-3 custom-scrollbar text-left text-xs bg-slate-100[0.41]">
                                {bankMessages.map((msg, i) => (
                                    <div key={i} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                                        <span className="text-[8px] text-[#0F172A] font-black tracking-widest uppercase mb-1">{msg.role === 'user' ? 'You' : 'Marcus'} • {msg.time}</span>
                                        <div className={`p-3 rounded-2xl font-bold leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-[#0ec5f2] text-slate-950 rounded-tr-none' : 'bg-white border border-slate-200 dark:border-white/10 text-[#0F172A] rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isBankAgentTyping && (
                                    <div className="flex flex-col self-start items-start">
                                        <span className="text-[8px] text-[#0F172A] font-bold tracking-widest uppercase mb-1">Marcus is typing...</span>
                                        <div className="py-2.5 px-4 bg-white border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-none dark:bg-slate-800">
                                            <div className="flex items-center gap-1.5 py-1">
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef}></div>
                            </div>

                            {/* Message input */}
                            <form onSubmit={handleSendBankMessage} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Type question regarding bank details..." 
                                    value={bankMessageInput}
                                    onChange={(e) => setBankMessageInput(e.target.value)}
                                    className="flex-1 bg-slate-100 border border-slate-200 dark:border-white/10 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                                <button type="submit" className="p-3 bg-white hover:bg-amber-500 text-amber-500 border border-slate-200 dark:border-white/10 rounded-xl transition-all dark:bg-slate-800">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Corporate Correspondent Bank Details Card */}
                            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-amber-500/20 p-5 rounded-2xl space-y-3.5 relative overflow-hidden text-left shadow-2xl">
                                <span className="absolute top-4 right-4 text-[8px] font-mono tracking-widest text-[#0ec5f2] border border-[#0ec5f2]/20 px-2 py-0.5 rounded uppercase font-black bg-[#0ec5f2]/5 animate-pulse">VIP WIRE RAIL</span>
                                <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2"><BankIcon className="w-4 h-4 text-amber-500" /> Correspondent Banking Vault</h4>
                                
                                <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">Beneficiary Bank</p>
                                        <p className="font-bold text-slate-850 dark:text-white truncate">{activeUserProfile?.profile?.protocolExternalBankName || "First Pacific European Bank"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">Beneficiary Corporate Owner</p>
                                        <p className="font-bold text-slate-850 dark:text-white truncate">{activeUserProfile?.profile?.protocolExternalBankBeneficiary || "First Pacific Finance Ltd"}</p>
                                    </div>
                                    <div className="space-y-0.5 col-span-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">IBAN Address</p>
                                            <button onClick={() => handleCopy(activeUserProfile?.profile?.protocolExternalBankIban || "GB89FPBG01614888367310")} className="text-[8px] text-amber-500 font-black tracking-widest uppercase hover:underline">Copy</button>
                                        </div>
                                        <p className="font-bold text-[#0ec5f2] tracking-tighter">{activeUserProfile?.profile?.protocolExternalBankIban || "GB89 FPBG 0161 4888 3673 10"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">BIC / SWIFT Address</p>
                                            <button onClick={() => handleCopy(activeUserProfile?.profile?.protocolExternalBankSwift || "FPBKGB2LXXX")} className="text-[8px] text-amber-500 font-black tracking-widest uppercase hover:underline">Copy</button>
                                        </div>
                                        <p className="font-bold text-slate-850 dark:text-white">{activeUserProfile?.profile?.protocolExternalBankSwift || "FPBKGB2LXXX"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[8px] text-[#0F172A] font-black uppercase tracking-wider">Bank Reference ID</p>
                                            <button onClick={() => handleCopy(bankRefId)} className="text-[8px] text-amber-500 font-black tracking-widest uppercase hover:underline">Copy</button>
                                        </div>
                                        <p className="font-bold text-amber-500 uppercase">{bankRefId}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Attachment Proof */}
                            <div className="border border-dashed border-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 cursor-pointer text-center relative transition-colors" onClick={() => fileInputRef.current?.click()}>
                                {receiptFile ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
                                        <span>Wire Transfer Advice Registered</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-[#0F172A]">
                                        <CloudArrowUpIcon className="w-4 h-4" />
                                        <span className="text-[9px] uppercase font-black tracking-widest">Attach Bank Wire Receipt Screenshot</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 pt-1">
                            <button 
                                onClick={() => handleVerifyMethod('Correspondent Bank Handshake')}
                                disabled={!receiptFile}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                                <DocumentCheckIcon className="w-4 h-4" />
                                Verify Sheet & Transmit Reference
                            </button>
                            <button onClick={() => setStep('request_method')} className="w-full py-2.5 text-[10px] uppercase font-black tracking-widest text-[#0F172A] hover:text-white text-center transition-colors">
                                Return to Protocols
                            </button>
                        </div>
                    </div>
                )}

                {step === 'payment_details' && activeRail === 'crypto' && (
                    <div className="space-y-8 animate-fade-in">
                         <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner">
                            <div className="text-left">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Fee Obligation</p>
                                <p className="text-5xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">{formatCurrency(actualAmount)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Active Rail</p>
                                <p className="text-sm font-black text-primary uppercase">BTC_USDT_V2</p>
                            </div>
                        </div>
                        {renderRailDetails()}
                        <div className="pt-4 space-y-4">
                            <button onClick={() => setStep('upload_receipt')} className="w-full py-6 bg-white text-[#0F172A] rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all hover:bg-primary hover:text-[#0F172A] dark:text-white flex items-center justify-center gap-3 group dark:bg-slate-800">
                                <CloudArrowUpIcon className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                Confirm & Upload Advice
                            </button>
                            <div className="flex justify-center">
                                <button onClick={() => setStep('request_method')} className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                                    <ArrowPathIcon className="w-4 h-4" /> Change Protocol?
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'upload_receipt' && (
                     <div className="space-y-10 text-center py-6 animate-fade-in">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-4 border-dashed rounded-[3rem] p-16 cursor-pointer transition-all relative overflow-hidden group min-h-[350px] flex flex-col items-center justify-center ${receiptFile ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary hover:bg-slate-50 dark:bg-slate-900'}`}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            {receiptFile ? (
                                <div className="relative z-10 space-y-6">
                                    <div className="relative">
                                        <img src={receiptFile} alt="Receipt" className="max-h-64 mx-auto rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-white/10" />
                                        <div className="absolute top-2 right-2 p-2 bg-emerald-500 rounded-full shadow-lg"><CheckCircleIcon className="w-5 h-5 text-[#0F172A] dark:text-white" /></div>
                                    </div>
                                    <div className="flex items-center justify-center text-emerald-400 gap-3 text-[10px] font-black uppercase tracking-widest">
                                        <ShieldCheckIcon className="w-5 h-5" /> Payload Verified
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-8 text-[#0F172A] group-hover:text-primary transition-all duration-500">
                                    <div className="relative">
                                        <CloudArrowUpIcon className="w-20 h-20 animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="block text-sm font-black uppercase tracking-[0.4em]">Upload Payment Proof</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <button 
                                onClick={handleSubmitReceipt} 
                                disabled={!receiptFile}
                                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all disabled:opacity-20 flex items-center justify-center gap-4 active:scale-95"
                            >
                                <DocumentCheckIcon className="w-6 h-6" />
                                Release to Audit Cluster
                            </button>
                            <button onClick={() => setStep('payment_details')} className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors">Abort & Return</button>
                        </div>
                     </div>
                )}

                {step === 'processing' && (
                    <div className="py-24 text-center space-y-10 animate-fade-in flex flex-col items-center justify-center flex-grow">
                        <div className="relative w-40 h-40">
                            <div className="absolute inset-0 border-[6px] border-slate-900 rounded-full"></div>
                            <div className="absolute inset-0 border-[6px] border-primary border-t-transparent rounded-full animate-spin [animation-duration:0.8s]"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LockClosedIcon className="w-14 h-14 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">
                                {verificationStage === 0 && "Initializing..."}
                                {verificationStage === 1 && `Accessing ${processingMethod || 'Gateway'}...`}
                                {verificationStage === 2 && "Syncing Ledger Queues..."}
                                {verificationStage === 3 && "Performing AML Risk Sweep..."}
                                {verificationStage === 4 && "Finalizing Verification..."}
                            </h3>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-[#0F172A] font-bold text-xs uppercase tracking-[0.5em] animate-pulse">
                                    {verificationStage === 0 && "Establishing Cryptographic Tunnel"}
                                    {verificationStage === 1 && "Relaying Ledger Routing Packets"}
                                    {verificationStage === 2 && "Conserving Ledger Confirmation handshakes"}
                                    {verificationStage === 3 && "Anti-Fraud Compliance Handshake: PASS"}
                                    {verificationStage === 4 && "Generating Secured Access Tokens"}
                                </p>
                                <div className="w-48 h-1 bg-white rounded-full mt-4 overflow-hidden dark:bg-slate-800">
                                    <div 
                                        className="h-full bg-primary transition-all duration-1000 ease-out"
                                        style={{ width: `${(verificationStage / 4) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'awaiting_admin_code' && (
                    <div className="py-6 text-center space-y-6 animate-fade-in-up flex flex-col items-center flex-grow justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-amber-500 text-amber-500 border border-amber-500/25 rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                                <LockClosedIcon className="w-12 h-12 text-amber-500 animate-pulse" />
                            </div>
                            <div className="absolute -top-3 -right-3 bg-slate-100 p-2.5 rounded-full border border-slate-200 dark:border-white/10 shadow-2xl">
                                <ClockIcon className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                        
                        <div className="space-y-4 w-full px-4">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">Awaiting Payment<br/>Verification</h3>
                                <p className="text-amber-500 font-bold text-[10px] uppercase tracking-[0.4em]">Transaction Reference: {pendingTxId}</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-2xl text-left">
                                <div className="absolute inset-0 bg-amber-500 opacity-70"></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        <span className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest">AWAITING COGNITIVE REVIEW</span>
                                    </div>
                                    <p className="text-xs text-[#0F172A] leading-relaxed font-semibold">
                                        Your settlement receipt has been successfully logged on the clearing ledger. An official analyst is currently auditing the payload signature. 
                                        Once verified, an <strong>Unlock Code (Compliance Halt Code)</strong> will be generated and dispatched automatically to your registered email or phone with entry instructions.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="block text-left text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1 ml-2">
                                    Enter Compliance Halt Code
                                </label>
                                <input 
                                    type="text"
                                    value={enteredUnlockCode}
                                    onChange={(e) => {
                                        setEnteredUnlockCode(e.target.value.toUpperCase());
                                        setUnlockCodeError('');
                                    }}
                                    placeholder="HALT-XXXXXX"
                                    className="w-full text-center bg-slate-100 border border-slate-200 dark:border-slate-750/50 text-[#0F172A] dark:text-white p-5 rounded-2xl tracking-[0.3em] font-mono text-lg focus:border-amber-500 outline-none  transition-all"
                                />
                                {unlockCodeError && (
                                    <p className="text-xs font-bold text-rose-500 font-mono text-center">{unlockCodeError}</p>
                                )}
                            </div>

                            <button
                                onClick={async () => {
                                    if (!enteredUnlockCode.trim()) {
                                        setUnlockCodeError('Please enter the Compliance Halt Code.');
                                        return;
                                    }
                                    
                                    // Verify code against latest database transaction
                                    const tx = await db.getAllTransactions().then(txs => txs.find(t => t.id === pendingTxId));
                                    if (tx && tx.regulatoryAuthCode && tx.regulatoryAuthCode.toUpperCase() === enteredUnlockCode.toUpperCase()) {
                                        processPaymentSuccess(processingMethod, enteredUnlockCode);
                                    } else {
                                        setUnlockCodeError('Invalid or active clearance code pending admin verification.');
                                    }
                                }}
                                className="w-full py-4.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
                            >
                                <LockClosedIcon className="w-4 h-4" />
                                Verify & Release Holdings
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-6 text-center space-y-6 animate-fade-in-up flex flex-col items-center flex-grow justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(34,197,94,0.6)]">
                                <CheckCircleIcon className="w-12 h-12 text-slate-950" />
                            </div>
                            <div className="absolute -top-3 -right-3 bg-slate-100 p-2.5 rounded-full border border-slate-200 dark:border-white/10 shadow-2xl animate-bounce">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        
                        <div className="space-y-4 w-full px-4">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">Settlement Fee<br/>Fully Verified</h3>
                                <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.4em]">ITCC Clearance Code Processed</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-2xl text-left">
                                <div className="absolute inset-0 bg-emerald-500 opacity-70"></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
                                        <DocumentCheckIcon className="w-5 h-5 text-emerald-400" />
                                        <span className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest">TRANSACTION RELEASED</span>
                                    </div>
                                    <div className="space-y-1 font-sans text-xs">
                                        <div className="flex justify-between"><span className="text-[#0F172A]">Settled Sum:</span> <strong className="text-white">{formatCurrency(actualAmount)}</strong></div>
                                        <div className="flex justify-between"><span className="text-[#0F172A]">Confirmation ID:</span> <strong className="font-mono text-emerald-400 uppercase">{generatedRef}</strong></div>
                                        <div className="flex justify-between"><span className="text-[#0F172A]">Security Clearance:</span> <span className="text-emerald-400 font-black">UNLOCKED / ACTIVE</span></div>
                                    </div>
                                    <div className="bg-primary-500 border border-primary-500/20 p-4 rounded-2xl flex items-start gap-3">
                                        <EnvelopeIcon className="w-4 h-4 text-primary-400 mt-0.5 shrink-0 animate-pulse" />
                                        <p className="text-[10px] text-primary-200 leading-relaxed font-semibold">
                                            The secure clearance code <strong className="text-white font-mono">{secureCode}</strong> was successfully dispatched to your registered <strong>Email</strong> and <strong>SMS</strong>.
                                            <br/><br/>
                                            <span className="text-[#0F172A] font-bold">Please view your notifications inbox to enter code in terminal core.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => onPaymentConfirmed(secureCode)}
                                className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                            >
                                <LockClosedIcon className="w-4 h-4" />
                                Return to Clearance Core
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Footer Info */}
            <div className="p-8 bg-slate-100 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[9px] font-black text-[#0F172A] uppercase tracking-[0.4em] z-20 flex-shrink-0 font-mono">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><ShieldCheckIcon className="w-3.5 h-3.5" /> SECURE_VPC</div>
                    <div className="flex items-center gap-2"><GlobeAmericasIcon className="w-3.5 h-3.5" /> GLOBAL_SYNC</div>
                </div>
                <span>© 2026 FPB_LEDGER_OPS</span>
            </div>
        </div>
        </div>
    );
};
