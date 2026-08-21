import React, { useState, useEffect } from 'react';
import { SpinnerIcon, BankIcon, CheckCircleIcon, ShieldCheckIcon, LockClosedIcon, XIcon, SearchIcon, ExclamationCircleIcon, AlertTriangleIcon } from './Icons';
import { BANKS_BY_COUNTRY } from './constants';
import { getBankIcon } from './Icons';
import { ExternalAccountsService } from '../services/externalAccountsService';

interface LinkBankAccountModalProps {
  onClose: () => void;
  onLinkSuccess: (bankName: string, accountName: string, lastFour: string, balance: number) => void;
}

type Step = 'select_bank' | 'credentials' | 'select_account' | 'processing' | 'success' | 'failure';

// Safe access to US banks
const usBanks = BANKS_BY_COUNTRY['US'] || [];
const mockBanks = usBanks.map(bank => ({ name: bank.name }));

const mockAccounts: Record<string, { name: string; lastFour: string; balance: number }[]> = {
    'Chase Bank': [{ name: 'College Checking', lastFour: '1234', balance: 5432.10 }, { name: 'Total Savings', lastFour: '5678', balance: 25109.42 }],
    'Bank of America': [{ name: 'Advantage Plus Banking', lastFour: '9876', balance: 12345.67 }],
    'Wells Fargo': [{ name: 'Everyday Checking', lastFour: '5432', balance: 8765.43 }, { name: 'Way2Save Savings', lastFour: '2109', balance: 50231.00 }],
    'Citibank': [{ name: 'Basic Banking Account', lastFour: '1111', balance: 3456.78 }],
    'PNC Bank': [{ name: 'Virtual Wallet', lastFour: '2222', balance: 7890.12 }],
};

export const LinkBankAccountModal: React.FC<LinkBankAccountModalProps> = ({ onClose, onLinkSuccess }) => {
    const [step, setStep] = useState<Step>('select_bank');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState('Securely connecting...');
    const [searchTerm, setSearchTerm] = useState('');
    const [username, setUsername] = useState('demo_user');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: number;
        if (step === 'processing' && selectedBank) {
            const messages = [
                `Connecting to ${selectedBank}...`,
                'Encrypting credentials...',
                'Verifying identity...',
                'Fetching accounts...'
            ];
            let messageIndex = 0;
            setProcessingMessage(messages[0]);
            
            interval = window.setInterval(() => {
                messageIndex++;
                if (messageIndex < messages.length) {
                    setProcessingMessage(messages[messageIndex]);
                } else {
                    clearInterval(interval);
                }
            }, 800);
        }
        return () => clearInterval(interval);
    }, [step, selectedBank]);


    const handleBankSelect = (bankName: string) => {
        setSelectedBank(bankName);
        setStep('credentials');
        setError(null);
    };

    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        setProcessingMessage('Authenticating...');
        
        // Simulate API call
        setTimeout(() => {
            if (username.toLowerCase() === 'fail' || password === 'wrong') {
                setStep('failure');
                setError('Invalid credentials. Please check your username and password.');
            } else {
                setStep('select_account');
            }
        }, 2000);
    };

    const handleAccountSelect = (account: { name: string; lastFour: string; balance: number }) => {
        setSelectedAccount(`${account.name} (•••• ${account.lastFour})`);
        setStep('processing');
        setProcessingMessage('Finalizing secure link...');
        setTimeout(() => {
            if (selectedBank) {
                ExternalAccountsService.addAccount({
                    institution: selectedBank,
                    name: account.name,
                    accountType: account.name.toLowerCase().includes('checking') ? 'checking' : account.name.toLowerCase().includes('savings') ? 'savings' : 'investment',
                    mask: `•••• ${account.lastFour}`,
                    balance: account.balance,
                    currency: 'USD',
                    syncFrequency: 'realtime',
                    securityProtocol: 'OAuth 2.0 FDX'
                });
                onLinkSuccess(selectedBank, account.name, account.lastFour, account.balance);
            }
            setStep('success');
            setTimeout(onClose, 2500);
        }, 2000);
    };

    const filteredBanks = mockBanks.filter(bank => 
        bank.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContent = () => {
        switch (step) {
            case 'select_bank':
                return (
                    <div className="space-y-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A] dark:text-white" />
                            <input 
                                type="text" 
                                placeholder="Search for your bank" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-[#0F172A] dark:text-[#1E293B]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredBanks.length > 0 ? (
                            filteredBanks.map(bank => {
                                 const BankLogo = getBankIcon(bank.name);
                                 return (
                                    <button key={bank.name} onClick={() => handleBankSelect(bank.name)} className="w-full flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 transition-all text-left group">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform dark:bg-slate-800">
                                            <BankLogo className="w-8 h-8 object-contain" />
                                        </div>
                                        <span className="font-bold text-[#0F172A] dark:text-[#1E293B]">{bank.name}</span>
                                    </button>
                                 )
                            })
                        ) : (
                            <div className="text-center py-8 text-[#0F172A]">
                                <p>No banks found matching "{searchTerm}"</p>
                            </div>
                        )}
                        </div>
                    </div>
                );
            case 'credentials':
                 return (
                    <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                {selectedBank && React.createElement(getBankIcon(selectedBank), { className: "w-10 h-10" })}
                            </div>
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Login to {selectedBank}</h3>
                            <p className="text-sm text-[#0F172A]">Enter your online banking credentials.</p>
                        </div>
                        
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-3">
                                <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Username</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-[#0F172A] dark:text-white" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Password</label>
                            <input 
                                type="password" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-[#0F172A] dark:text-white" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setStep('select_bank')} className="px-4 py-2 text-sm font-bold text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-colors">Back</button>
                            <button type="submit" className="px-6 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-lg shadow-md transition-colors">Submit</button>
                        </div>
                    </form>
                );
            case 'select_account':
                const accounts = selectedBank ? mockAccounts[selectedBank as keyof typeof mockAccounts] || [] : [];
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#1E293B] mb-2">Choose an account to link</h3>
                        {accounts.length > 0 ? accounts.map(acc => (
                             <button key={acc.name} onClick={() => handleAccountSelect(acc)} className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 transition-all text-left group">
                                 <div>
                                    <p className="font-bold text-[#0F172A] dark:text-[#1E293B]">{acc.name}</p>
                                    <p className="text-sm text-[#0F172A] font-mono">•••• {acc.lastFour}</p>
                                 </div>
                                 <p className="font-mono font-semibold text-[#0F172A] dark:text-white group-hover:text-primary transition-colors">{acc.balance.toLocaleString('en-US',{style:'currency',currency:'USD'})}</p>
                             </button>
                        )) : (
                            <div className="text-center py-8">
                                <p className="text-[#0F172A] mb-4">No eligible accounts found.</p>
                                <button onClick={() => setStep('select_bank')} className="text-primary font-bold hover:underline">Try another bank</button>
                            </div>
                        )}
                    </div>
                );
            case 'processing':
                return (
                    <div className="text-center p-12">
                        <div className="relative w-16 h-16 mx-auto mb-6">
                             <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                             <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-lg font-bold text-[#0F172A] dark:text-[#1E293B] animate-pulse">{processingMessage}</p>
                        <p className="text-sm text-[#0F172A] mt-2">This information is encrypted end-to-end.</p>
                    </div>
                );
            case 'success':
                 return (
                    <div className="text-center p-8">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Account Linked!</h3>
                        <p className="text-[#0F172A] dark:text-white mt-2">{selectedAccount} has been successfully added to your portfolio.</p>
                    </div>
                );
            case 'failure':
                return (
                    <div className="text-center p-8">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangleIcon className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Connection Failed</h3>
                        <p className="text-[#0F172A] dark:text-white mt-2 mb-6">{error || 'We were unable to connect to your bank. Please try again.'}</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setStep('select_bank')} className="px-4 py-2 text-sm font-bold text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-colors">Cancel</button>
                            <button onClick={() => setStep('credentials')} className="px-6 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-lg shadow-md transition-colors">Try Again</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/10 animate-fade-in-up">
                 <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                        <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Secure Connection</span>
                    </div>
                    <button onClick={onClose} className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-[#1E293B] transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6">
                    {renderContent()}
                </div>
                
                {step === 'select_bank' && (
                     <div className="p-4 bg-slate-50 dark:bg-slate-900 text-center border-t border-slate-100 dark:border-white/10">
                        <p className="text-[10px] text-[#0F172A] dark:text-white flex items-center justify-center gap-1">
                            <LockClosedIcon className="w-3 h-3" /> 
                            Credentials are never stored on our servers.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};