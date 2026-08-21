import React, { useState } from 'react';
import { 
    ShieldCheckIcon,
    UsersIcon,
    ChevronDownIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    DocumentCheckIcon,
    PlusCircleIcon,
    ClockIcon,
    ArrowsRightLeftIcon,
    LockClosedIcon as KeyIcon
} from './Icons';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

interface MultiSigTransaction {
    id: string;
    amount: number;
    recipient: string;
    description: string;
    date: Date;
    requiredSignatures: number;
    currentSignatures: number;
    status: 'pending' | 'executed' | 'rejected';
    signers: { name: string; signed: boolean; role: string; timestamp?: Date }[];
    creator: string;
}

const INITIAL_TRANSACTIONS: MultiSigTransaction[] = [
    {
        id: 'MS-8910-B',
        amount: 154000.00,
        recipient: 'Apex Capital Holdings LLC',
        description: 'Q3 Vendor Settlement Series A',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        requiredSignatures: 3,
        currentSignatures: 2,
        status: 'pending',
        creator: 'Sarah Jenkins',
        signers: [
            { name: 'Sarah Jenkins', role: 'Treasury Admin', signed: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
            { name: 'Michael Chen', role: 'CFO', signed: true, timestamp: new Date(Date.now() - 1000 * 60 * 45) },
            { name: 'Elias Thorne', role: 'CEO', signed: false },
        ]
    },
    {
        id: 'MS-9012-C',
        amount: 8500.00,
        recipient: 'Global Tech Services',
        description: 'Software Licensing Renewal',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        requiredSignatures: 2,
        currentSignatures: 2,
        status: 'executed',
        creator: 'David Miller',
        signers: [
            { name: 'David Miller', role: 'IT Director', signed: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
            { name: 'Michael Chen', role: 'CFO', signed: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12 * 1) },
        ]
    }
];

export const MultiSigWallet: React.FC<{ addNotification?: any }> = ({ addNotification }) => {
    const [transactions, setTransactions] = useState<MultiSigTransaction[]>(INITIAL_TRANSACTIONS);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<MultiSigTransaction | null>(null);
    const [passcode, setPasscode] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    const pendingTx = transactions.filter(t => t.status === 'pending');
    const historyTx = transactions.filter(t => t.status !== 'pending');

    const handleSign = (tx: MultiSigTransaction) => {
        setSelectedTx(tx);
        setIsSignModalOpen(true);
    };

    const confirmSignature = () => {
        if (!selectedTx || passcode.length < 6) return;
        setIsSigning(true);

        setTimeout(() => {
            setTransactions(prev => prev.map(t => {
                if (t.id === selectedTx.id) {
                    const newSigners = [...t.signers];
                    const currentUserIndex = newSigners.findIndex(s => s.name === 'Elias Thorne');
                    if (currentUserIndex !== -1) {
                        newSigners[currentUserIndex] = { ...newSigners[currentUserIndex], signed: true, timestamp: new Date() };
                    } else {
                        newSigners.push({ name: 'You (Admin)', role: 'Authorized Signer', signed: true, timestamp: new Date() });
                    }
                    
                    const newSigs = t.currentSignatures + 1;
                    const newStatus = newSigs >= t.requiredSignatures ? 'executed' : 'pending';
                    
                    // Dispatch real-time simulated notification
                    window.dispatchEvent(new CustomEvent('REALTIME_INTERVENTION_RESOLVED', { 
                        detail: { 
                            txId: t.id, 
                            resolution: newStatus === 'executed' ? 'approved' : 'pending',
                            message: `Signature applied. ${newSigs}/${t.requiredSignatures} collected.` 
                        } 
                    }));
                    if (addNotification) {
                        addNotification(
                            newStatus === 'executed' ? 'SUCCESS' : 'INFO',
                            newStatus === 'executed' ? 'Transaction Authorized' : 'Signature Applied',
                            newStatus === 'executed' 
                                ? `Multi-Sig executed successfully for ${t.recipient}.` 
                                : `${newSigs} of ${t.requiredSignatures} signatures collected.`
                        );
                    }

                    return { ...t, currentSignatures: newSigs, status: newStatus, signers: newSigners };
                }
                return t;
            }));
            
            setIsSigning(false);
            setIsSignModalOpen(false);
            setPasscode('');
            setSelectedTx(null);
        }, 400); // reduced delay for immediate perception
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-8 pb-20 animate-fade-in relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none"></div>
            
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-slate-100 dark:border-white/10 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500 rounded-xl border border-emerald-500/30">
                                <KeyIcon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter">Multi-Sig Vault</h1>
                        </div>
                        <p className="text-[#0F172A] dark:text-white max-w-lg mt-3">
                            Business-grade security protocol requiring multiple authorized cryptographic signatures before transaction execution.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl">
                        <div className="flex -space-x-3 mr-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-[#0F172A] dark:text-white shadow-md">
                                    {i === 1 ? 'SJ' : i === 2 ? 'MC' : 'ET'}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                <PlusCircleIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Co-Signers</p>
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">3 Active Keyholders</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-[#0F172A] shadow-lg' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white hover:bg-slate-100 dark:bg-slate-700'}`}
                    >
                        Pending Approvals <span className="ml-2 bg-emerald-500 text-[#0F172A] px-2 py-0.5 rounded-md">{pendingTx.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-[#0F172A] shadow-lg' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white hover:bg-slate-100 dark:bg-slate-700'}`}
                    >
                        Transaction History
                    </button>
                </div>

                <div className="space-y-6">
                    {(activeTab === 'pending' ? pendingTx : historyTx).length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-white/10">
                            <ShieldCheckIcon className="w-16 h-16 text-[#0F172A] mx-auto mb-4 opacity-70" />
                            <p className="text-[#0F172A] dark:text-white font-bold uppercase tracking-widest text-sm">No {activeTab} multi-sig transactions</p>
                        </div>
                    ) : (
                        (activeTab === 'pending' ? pendingTx : historyTx).map(tx => (
                            <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/10 p-6 hover:border-emerald-500/30 transition-colors  group">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400 px-2 py-1 rounded truncate border border-emerald-400/20">{tx.id}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${tx.status === 'pending' ? 'bg-amber-500 text-amber-400' : 'primary- primary-'}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight mb-1">{tx.recipient}</h3>
                                        <p className="text-[#0F172A] dark:text-white text-sm font-bold">{tx.description}</p>
                                    </div>
                                    
                                    <div className="flex flex-col lg:items-end gap-3 min-w-[200px]">
                                        <p className="text-3xl font-mono font-bold text-[#0F172A] dark:text-white tracking-widest">
                                            {formatCurrency(tx.amount)}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/10 w-full lg:w-auto mt-2">
                                            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] text-[#0F172A] dark:text-white font-bold mb-1 uppercase tracking-wider">
                                                    <span>Signatures</span>
                                                    <span>{tx.currentSignatures} / {tx.requiredSignatures}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 flex rounded-full overflow-hidden">
                                                    {Array.from({ length: tx.requiredSignatures }).map((_, idx) => (
                                                        <div key={idx} className={`h-full flex-1 border-r border-slate-900 last:border-0 ${idx < tx.currentSignatures ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-4">Authorization Chain</p>
                                        <div className="space-y-3">
                                            {tx.signers.map((signer, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${signer.signed ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-100 dark:bg-slate-700 text-[#0F172A]'}`}>
                                                        {signer.signed ? <CheckCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 flex justify-between items-center">
                                                        <div>
                                                            <p className={`text-sm font-bold ${signer.signed ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-white'}`}>{signer.name}</p>
                                                            <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-wider">{signer.role}</p>
                                                        </div>
                                                        {signer.timestamp && (
                                                            <span className="text-[10px] font-mono text-[#0F172A]">
                                                                {signer.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {tx.status === 'pending' && (
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => handleSign(tx)}
                                                className="w-full md:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-1"
                                            >
                                                Sign & Authorize
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Signature Modal */}
            {isSignModalOpen && selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 ">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-scale-in">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-slate-100 border border-emerald-500/50 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <KeyIcon className="w-8 h-8 text-emerald-400" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase mb-2">Cryptographic Signature</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm mb-6">Authorize {formatCurrency(selectedTx.amount)} to {selectedTx.recipient}. This action cannot be reversed.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-2 mb-2 block">Enterprise Passcode</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={passcode}
                                            onChange={(e) => setPasscode(e.target.value)}
                                            className="w-full bg-slate-100 border border-emerald-500/30 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xl tracking-[0.5em] text-center shadow-inner"
                                            placeholder="••••••"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                                    
                                <button 
                                    onClick={confirmSignature}
                                    disabled={passcode.length < 6 || isSigning}
                                    className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl disabled:opacity-70 transition-all flex justify-center items-center gap-3 dark:bg-slate-800"
                                >
                                    {isSigning ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                            <span>Signing Vault...</span>
                                        </>
                                    ) : 'Apply Signature'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsSignModalOpen(false);
                                        setPasscode('');
                                    }}
                                    className="w-full py-4 bg-transparent text-[#0F172A] font-bold uppercase tracking-widest text-[10px] hover:text-[#0F172A] dark:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
