
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Account, Recipient, Transaction } from '../types';
import { SELF_RECIPIENT, STANDARD_FEE, EXCHANGE_RATES } from './constants';
import { 
    SpinnerIcon, 
    CheckCircleIcon, 
    getBankIcon, 
    UserCircleIcon, 
    SendIcon, 
    PlusIcon, 
    ChevronDownIcon, 
    WalletIcon,
    ArrowRightIcon,
    ClockIcon
} from './Icons';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { RealTimePaymentVerification } from './RealTimePaymentVerification';
import { TransactionSuccessAnimation, TransactionSuccessData } from './TransactionSuccessAnimation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSystemOptions } from '../hooks/useSystemOptions';
import { Haptics } from '../utils/haptics';

interface QuickTransferProps {
    accounts: Account[];
    recipients: Recipient[];
    createTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'statusTimestamps' | 'type'>) => Promise<Transaction | null>;
    onContactSupport?: () => void;
}

export const QuickTransfer: React.FC<QuickTransferProps> = ({ accounts, recipients, createTransaction, onContactSupport }) => {
    const { formatCurrency, displayCurrency, getCurrencyInfo } = useCurrency();
    const systemOptions = useSystemOptions();
    const availableAccounts = useMemo(() => accounts.filter(acc => (acc?.balance || 0) > 0), [accounts]);
    
    // Combine self and recent recipients, ensuring unique IDs
    const quickRecipients = useMemo(() => {
        const uniqueRecipients = [SELF_RECIPIENT, ...recipients].reduce((acc, current) => {
            const x = acc.find(item => item.id === current.id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, [] as Recipient[]);
        return uniqueRecipients.slice(0, 5); // Show top 5
    }, [recipients]);

    const [sourceAccountId, setSourceAccountId] = useState(availableAccounts[0]?.id || '');
    const [selectedRecipientId, setSelectedRecipientId] = useState(quickRecipients[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'idle' | 'compliance' | 'verifying' | 'sending' | 'success'>('idle');
    const [error, setError] = useState('');
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [isSuccessSeqOpen, setIsSuccessSeqOpen] = useState(false);
    const [successSeqData, setSuccessSeqData] = useState<TransactionSuccessData | null>(null);

    const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
    const selectedRecipient = quickRecipients.find(rec => rec.id === selectedRecipientId);

    const numericAmount = parseFloat(amount) || 0;
    const exchangeRate = selectedRecipient ? EXCHANGE_RATES[selectedRecipient.country.currency] : 1;
    const receiveAmount = numericAmount * exchangeRate;
    const totalCost = numericAmount > 0 ? numericAmount + STANDARD_FEE : 0;
    
    // Quick amount presets
    const PRESET_AMOUNTS = ['20', '50', '100', '200'];

    const amountError = useMemo(() => {
        if (numericAmount <= 0 && amount !== '') return "Enter a valid amount";
        if (!sourceAccount) return "Select an account";
        if (totalCost > (sourceAccount?.balance || 0)) return "Insufficient funds";
        return null;
    }, [numericAmount, amount, sourceAccount, totalCost]);
    
    const isAmountInvalid = amountError !== null || numericAmount <= 0;

    const handleSendClick = () => {
        if (isAmountInvalid || !selectedRecipient || !sourceAccount) return;
        setStatus('compliance');
    };

    const handleComplianceVerified = () => {
        setStatus('verifying');
        setError('');
    };

    const executeQuickTransfer = async () => {
        setStatus('sending');
        setError('');

        // Simulate network delay with realistic steps
        setTimeout(async () => {
            const newTransaction = await createTransaction({
                accountId: sourceAccount!.id,
                recipient: selectedRecipient!,
                sendAmount: numericAmount,
                receiveAmount: receiveAmount,
                receiveCurrency: selectedRecipient!.country.currency,
                fee: STANDARD_FEE,
                exchangeRate: exchangeRate,
                originalInputAmount: numericAmount,
                originalInputCurrencyCode: "USD",
                description: `Quick transfer to ${selectedRecipient!.nickname || selectedRecipient!.fullName}`,
                purpose: 'Personal Transfer',
                estimatedArrival: new Date(Date.now() + 1000 * 60 * 5), // 5 mins arrival for "Instant" feel
            });

            if (newTransaction) {
                setStatus('success');
                const animData: TransactionSuccessData = {
                    amount: numericAmount,
                    currency: displayCurrency,
                    sourceAccountName: sourceAccount?.nickname || sourceAccount?.type || 'Checking Account',
                    sourceAccountType: sourceAccount?.type || 'Checking',
                    sourceAccountNumber: `•••• ${sourceAccount?.accountNumber ? sourceAccount.accountNumber.slice(-4) : '4821'}`,
                    sourceInitialBalance: sourceAccount?.balance || 25000,
                    recipientName: selectedRecipient?.fullName || 'Recipient',
                    recipientBank: selectedRecipient?.bankName || 'Partner Bank',
                    recipientAccountNumber: `•••• ${selectedRecipient?.accountNumber ? selectedRecipient.accountNumber.slice(-4) : '9102'}`,
                    recipientInitialBalance: 3200,
                    referenceId: newTransaction.id || `TX-${Math.floor(10000000 + Math.random() * 90000000)}`,
                    network: 'FedNow'
                };
                setSuccessSeqData(animData);
                setIsSuccessSeqOpen(true);

                setTimeout(() => {
                    setStatus('idle');
                    setAmount('');
                }, 3000);
            } else {
                setError('Transaction failed. Please try again.');
                setStatus('idle');
            }
        }, 2000);
    };

    const RecipientAvatar: React.FC<{ recipient: Recipient }> = ({ recipient }) => {
        const isSelected = recipient.id === selectedRecipientId;
        const BankIconComponent = getBankIcon(recipient.bankName);

        return (
            <button
                onClick={() => setSelectedRecipientId(recipient.id)}
                className={`group relative flex flex-col items-center space-y-2 min-w-[72px] transition-all duration-200`}
                aria-label={`Select ${recipient.fullName}`}
                aria-pressed={isSelected}
            >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                    ? 'primary- text-[#0F172A] dark:text-white shadow-lg primary- scale-110' 
                    : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white hover:bg-slate-100 dark:bg-slate-700 hover:text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10'
                }`}>
                    {recipient.id === SELF_RECIPIENT.id ? <UserCircleIcon className="w-8 h-8" /> : <BankIconComponent className="w-7 h-7" />}
                    
                    {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-slate-900">
                            <CheckCircleIcon className="w-3 h-3 text-[#0F172A] dark:text-white" />
                        </div>
                    )}
                </div>
                <span className={`text-xs font-bold truncate max-w-[72px] transition-colors ${isSelected ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] group-hover:text-[#0F172A] dark:text-white'}`}>
                    {recipient.nickname?.split(' ')[0] || recipient.fullName.split(' ')[0]}
                </span>
            </button>
        );
    };

    return (
        <div id="quick-transfer-container" className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-xl dark:shadow-black/40 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10 transition-all duration-300 h-full flex flex-col relative w-full overflow-hidden">

            {status === 'compliance' && (
                <ComplianceHaltModal 
                    isOpen={true}
                    amount={numericAmount}
                    onVerified={handleComplianceVerified}
                    onCancel={() => setStatus('idle')}
                    onContactSupport={onContactSupport || (() => {})}
                />
            )}

            {/* Header */}
            <div className="p-6 pb-2 flex justify-between items-center z-10">
                <div>
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <SendIcon className="w-5 h-5 primary-" />
                        Quick Transfer
                    </h2>
                    <p className="text-xs text-[#0F172A] dark:text-white mt-0.5">Send money instantly to friends</p>
                </div>
                <button className="p-2 rounded-full hover:bg-white text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800">
                    <ClockIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-grow flex flex-col px-6 pb-6 z-10 space-y-6">
                {status === 'success' ? (
                     <div className="flex-grow flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-1">Transfer Sent!</h3>
                        <p className="text-[#0F172A] dark:text-white text-sm mb-6">
                            <span className="text-[#0F172A] dark:text-white font-bold">{formatCurrency(numericAmount)}</span> has been sent to <br/>
                            <span className="text-[#0F172A] dark:text-white font-bold">{selectedRecipient?.fullName}</span>.
                        </p>
                        <button 
                            onClick={() => { setStatus('idle'); setAmount(''); }}
                            className="px-6 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white rounded-xl text-sm font-bold transition-colors"
                        >
                            Send Another
                        </button>
                    </div>
                ) : status === 'verifying' ? (
                     <div className="flex-grow flex items-center justify-center -mx-6">
                         <RealTimePaymentVerification 
                            amount={numericAmount}
                            currency={selectedRecipient?.country.currency || 'USD'}
                            recipientName={selectedRecipient?.fullName || ''}
                            complianceFee={numericAmount * ((systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17) / 100)}
                            networkFee={STANDARD_FEE}
                            accountBalance={sourceAccount?.balance || 0}
                            onVerificationComplete={(success) => {
                                if (success) {
                                    executeQuickTransfer();
                                } else {
                                    setError('Verification failed');
                                    setStatus('idle');
                                }
                            }}
                         />
                     </div>
                ) : (
                    <>
                        {/* Recipient Selector */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">Recipient</label>
                                <button className="text-xs primary- hover:primary- font-bold flex items-center gap-1">
                                    <PlusIcon className="w-3 h-3" /> New
                                </button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar mask-linear-fade">
                                {quickRecipients.map(rec => <RecipientAvatar key={rec.id} recipient={rec} />)}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">Amount</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <span className="text-2xl font-bold text-[#0F172A]">$</span>
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    value={amount}
                                    onChange={e => {
                                        setAmount(e.target.value);
                                        Haptics.selection();
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-[#0F172A] dark:text-white placeholder:text-[#0F172A] focus:outline-none focus:primary- focus:ring-1 focus:primary- transition-all"
                                />
                                {amountError && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-red-400 font-bold bg-red-400 px-2 py-1 rounded-lg">
                                        {amountError}
                                    </div>
                                )}
                            </div>
                            
                            {/* Quick Presets */}
                            <div className="flex gap-2">
                                {PRESET_AMOUNTS.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => {
                                            Haptics.tap();
                                            setAmount(preset);
                                        }}
                                        className="flex-1 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 active:scale-95 border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-all"
                                    >
                                        ${preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Source Account Selector */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">From Account</label>
                            <div className="relative">
                                <button 
                                    onClick={() => {
                                        Haptics.tap();
                                        setShowAccountDropdown(!showAccountDropdown);
                                    }}
                                    className="w-full flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-white dark:bg-slate-900 active:scale-[0.99] border border-slate-200 dark:border-white/10 rounded-2xl p-3 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl primary- flex items-center justify-center primary-">
                                            <WalletIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{sourceAccount?.nickname || sourceAccount?.type}</p>
                                            <p className="text-xs text-[#0F172A] dark:text-white">Balance: {sourceAccount ? formatCurrency((sourceAccount?.balance || 0)) : '---'}</p>
                                        </div>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-[#0F172A] transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showAccountDropdown && (
                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-20 animate-fade-in-up">
                                        {availableAccounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => {
                                                    Haptics.selection();
                                                    setSourceAccountId(acc.id);
                                                    setShowAccountDropdown(false);
                                                }}
                                                className="w-full flex items-center justify-between p-3 hover:bg-white active:bg-slate-100 dark:active:bg-slate-800 transition-colors border-b border-slate-100 dark:border-white/10 last:border-0 dark:bg-slate-800"
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">{acc.nickname || acc.type}</p>
                                                    <p className="text-xs text-[#0F172A] dark:text-white">{formatCurrency((acc?.balance || 0))}</p>
                                                </div>
                                                {acc.id === sourceAccountId && <CheckCircleIcon className="w-4 h-4 primary-" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-auto pt-2 space-y-2">
                            <button
                                onClick={async () => {
                                    await Haptics.heavy();
                                    handleSendClick();
                                }}
                                disabled={isAmountInvalid || status === 'sending'}
                                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 ${
                                    isAmountInvalid 
                                    ? 'bg-white dark:bg-slate-900 text-[#0F172A] cursor-not-allowed' 
                                    : 'primary- hover:primary- text-[#0F172A] dark:text-white shadow-lg primary- hover:primary- hover:-translate-y-0.5'
                                }`}
                            >
                                {status === 'sending' ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send {amount ? formatCurrency(numericAmount) : ''}</span>
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Transaction Success Kinetic Animation Modal */}
            {successSeqData && (
                <TransactionSuccessAnimation
                    isOpen={isSuccessSeqOpen}
                    data={successSeqData}
                    onClose={() => setIsSuccessSeqOpen(false)}
                />
            )}
        </div>
    );
};
