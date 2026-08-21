
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipient, Transaction, TransactionStatus } from '../types';
import { AddRecipientModal } from './AddRecipientModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { 
    ChevronDownIcon, 
    ClipboardDocumentIcon, 
    CheckCircleIcon, 
    BankIcon, 
    CreditCardIcon, 
    WithdrawIcon, 
    getBankIcon, 
    PencilIcon, 
    getServiceIcon, 
    PlusCircleIcon, 
    TrendingUpIcon,
    ShieldCheckIcon, 
    TrashIcon,
    ArrowRightIcon,
    ClockIcon,
    SearchIcon,
    UserGroupIcon,
    StarIcon,
    StarIconFilled,
    FunnelIcon,
    BrandLogo
} from './Icons';
import { getFlagUrl } from '../utils/flags';
import { BANKS_BY_COUNTRY, SERVICES_CONFIG } from './constants';
import { useCurrency } from '../contexts/CurrencyContext';

interface RecipientsProps {
    recipients: Recipient[];
    transactions: Transaction[];
    addRecipient: (data: any) => void;
    onUpdateRecipient: (recipientId: string, data: any) => void;
    onDeleteRecipient: (recipientId: string) => void;
    onToggleFavorite: (recipientId: string) => void;
    onOpenSendMoneyFlow: (initialTab?: 'send' | 'split' | 'deposit', preselectedRecipient?: Recipient) => void;
}

const NodeHealthIndicator: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <div 
                    key={i} 
                    className={`w-1.5 h-3 rounded-sm transition-all duration-500 ${
                        i <= Math.round(score / 20) 
                        ? (score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-rose-500') 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                />
            ))}
        </div>
        <span className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">{score}%</span>
    </div>
);

const RecipientHistory: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const { formatCurrency } = useCurrency();
    return (
        <div className="space-y-2 mt-4">
            <h5 className="text-[10px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <ClockIcon className="w-3 h-3" /> Recent Node Settlements
            </h5>
            {transactions.length > 0 ? (
                <div className="space-y-1.5">
                    {transactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10 text-xs group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${tx.status === TransactionStatus.FUNDS_ARRIVED ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <div>
                                    <p className="font-bold text-[#1E293B] dark:text-slate-100">{new Date(tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || Date.now()).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-[#0F172A]">{tx.status}</p>
                                </div>
                            </div>
                            <p className="font-mono font-bold text-[#0F172A] dark:text-white">
                                {formatCurrency(tx.sendAmount)}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-[#0F172A] dark:text-white dark:text-white font-bold uppercase tracking-widest">No transaction history detected for this node</p>
                </div>
            )}
        </div>
    );
};

// Helper to resolve domain for BrandLogo
const getRecipientDomain = (recipient: Recipient): string => {
    if (recipient.recipientType === 'service' && recipient.serviceName) {
         if (SERVICES_CONFIG[recipient.serviceName]) {
             return SERVICES_CONFIG[recipient.serviceName].domain;
         }
         // Fallback guess
         return `${recipient.serviceName.toLowerCase().replace(/\s/g, '')}.com`;
    }
    
    // Check known banks map
    for (const country in BANKS_BY_COUNTRY) {
        const bank = BANKS_BY_COUNTRY[country].find(b => b.name === recipient.bankName);
        if (bank) return bank.domain;
    }

    // Heuristic fallback for unknown banks
    return `${recipient.bankName.toLowerCase().replace(/\s/g, '')}.com`;
};

const RecipientCard: React.FC<{ 
    recipient: Recipient; 
    onEdit: () => void; 
    onDelete: () => void;
    onQuickPay: () => void;
    onToggleFavorite: () => void;
    transactions: Transaction[];
}> = ({ recipient, onEdit, onDelete, onQuickPay, onToggleFavorite, transactions }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const FallbackIcon = (recipient.recipientType === 'service' && recipient.serviceName) 
        ? getServiceIcon(recipient.serviceName) 
        : getBankIcon(recipient.bankName);

    const domain = getRecipientDomain(recipient);
    const trustScore = recipient.trustScore || 85; 
    const verificationStatus = recipient.verificationStatus || 'verified';

    return (
        <div className={`group bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-500 hover:shadow-2xl ${isExpanded ? 'border-primary/30 ring-1 ring-primary/10 shadow-xl' : 'border-slate-200 dark:border-white/10 shadow-md'}`}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center p-2 shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                                <BrandLogo 
                                    domain={domain} 
                                    name={recipient.bankName || recipient.serviceName || ''} 
                                    fallback={FallbackIcon} 
                                    className="w-full h-full object-contain" 
                                />
                            </div>
                            {verificationStatus === 'verified' && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-[#0F172A] dark:text-white p-1 rounded-full shadow-lg border-2 border-white dark:border-slate-700">
                                    <ShieldCheckIcon className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-black text-[#0F172A] dark:text-white text-lg tracking-tight uppercase">{recipient.nickname || recipient.fullName}</h4>
                                <img src={getFlagUrl(recipient.country.code)} alt="" className="w-5 h-3.5 rounded-sm object-cover opacity-80" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                                    className={`p-1 rounded-full transition-colors ${recipient.isFavorite ? 'text-amber-500' : 'text-[#0F172A] dark:text-white hover:text-amber-400'}`}
                                >
                                    {recipient.isFavorite ? <StarIconFilled className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white dark:text-white uppercase tracking-[0.2em]">{recipient.bankName} • {recipient.accountNumber}</p>
                                {recipient.category && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">
                                        {recipient.category}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Node Reliability</p>
                        <NodeHealthIndicator score={trustScore} />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={onQuickPay}
                        className="flex-1 py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <ArrowRightIcon className="w-4 h-4" /> Direct Settlement
                    </button>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`px-4 py-3 rounded-xl border transition-all ${isExpanded ? 'bg-white dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white border-transparent' : 'bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-100 dark:bg-slate-700'}`}
                    >
                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {isExpanded && (
                    <div className="mt-8 space-y-8 animate-fade-in-up">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Legal Entity</p>
                                <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">{recipient.fullName}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Jurisdiction</p>
                                <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">{recipient.country.name} ({recipient.country.currency})</p>
                            </div>
                            <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Routing Protocol (SWIFT/BIC)</p>
                                <p className="text-sm font-mono font-bold text-[#1E293B] dark:text-slate-100">{recipient.realDetails?.swiftBic || 'N/A'}</p>
                            </div>

                            {recipient.realDetails?.intermediaryBank && (
                                <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Intermediary Institution</p>
                                    <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">{recipient.realDetails?.intermediaryBank}</p>
                                </div>
                            )}

                            {recipient.realDetails?.bankAddress && (
                                <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Institution Address</p>
                                    <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">{recipient.realDetails?.bankAddress}</p>
                                </div>
                            )}

                            <div className="col-span-2 grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                         {verificationStatus === 'verified' ? <ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> : <ClockIcon className="w-4 h-4 text-amber-500" />}
                                         <p className={`text-sm font-bold capitalize ${verificationStatus === 'verified' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{verificationStatus}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Trust Score</p>
                                    <p className="text-sm font-black text-[#1E293B] dark:text-slate-100">{trustScore}/100</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1">Last Payment</p>
                                    <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                                        {recipient.lastPaymentDate ? new Date(recipient.lastPaymentDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <RecipientHistory transactions={transactions} />

                        <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-white/10">
                            <button 
                                onClick={onDelete}
                                className="flex items-center gap-2 text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest"
                            >
                                <TrashIcon className="w-4 h-4" /> Decommission Node
                            </button>
                            <button 
                                onClick={onEdit}
                                className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-primary-600 transition-colors uppercase tracking-widest"
                            >
                                <PencilIcon className="w-4 h-4" /> Edit Config
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Recipients: React.FC<RecipientsProps> = ({ 
    recipients, 
    transactions,
    addRecipient, 
    onUpdateRecipient, 
    onDeleteRecipient, 
    onToggleFavorite,
    onOpenSendMoneyFlow 
}) => {
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [recipientToEdit, setRecipientToEdit] = useState<Recipient | null>(null);
    const [recipientToDelete, setRecipientToDelete] = useState<Recipient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(['All']);
        recipients.forEach(r => { if (r.category) cats.add(r.category); });
        return Array.from(cats);
    }, [recipients]);

    const filteredRecipients = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return recipients.filter(r => {
            const matchesSearch = r.fullName.toLowerCase().includes(term) || 
                                 (r.nickname && r.nickname.toLowerCase().includes(term)) ||
                                 r.bankName.toLowerCase().includes(term);
            const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
            const matchesFavorite = !showOnlyFavorites || r.isFavorite;
            
            return matchesSearch && matchesCategory && matchesFavorite;
        });
    }, [recipients, searchTerm, selectedCategory, showOnlyFavorites]);

    const handleOpenAddPage = () => {
        navigate('/recipients/add');
    };
    
    const handleOpenEditModal = (recipient: Recipient) => {
        setRecipientToEdit(recipient);
        setIsEditModalOpen(true);
    };

    const getTransactionsForRecipient = (recipientName: string) => {
        return transactions
            .filter(tx => tx.recipient.fullName === recipientName || tx.recipient.nickname === recipientName)
            .slice(0, 3);
    };

    return (
        <div className="space-y-12 max-w-7xl mx-auto animate-fade-in-up pb-20">
            {/* Immersive Header */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-100 p-10 md:p-16 border border-slate-100 dark:border-white/10 shadow-2xl">
                <div className="absolute inset-0 z-0">
                    <div 
                        className="w-full h-full bg-cover bg-center opacity-30" 
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2940&auto=format&fit=crop')" }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                            <ShieldCheckIcon className="w-4 h-4" /> Global Registry Protocol
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] dark:text-white tracking-tighter leading-none mb-6">
                            Verified<br/>Beneficiaries.
                        </h1>
                        <p className="text-lg text-[#0F172A] dark:text-white font-bold">Manage your network of institutional nodes and direct settlement partners across our global ecosystem.</p>
                    </div>
                    <button 
                        onClick={handleOpenAddPage} 
                        className="px-8 py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl transition-all hover:bg-primary hover:text-[#0F172A] dark:text-white flex items-center justify-center gap-3 active:scale-[0.98] dark:bg-slate-800"
                    >
                        <PlusCircleIcon className="w-6 h-6" />
                        <span>Initialize Node</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="space-y-6 px-4 md:px-0">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 rounded-[2.5rem] shadow-xl w-full md:max-w-xl flex items-center">
                        <div className="p-4"><SearchIcon className="w-6 h-6 text-[#0F172A] dark:text-white" /></div>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter by name, institution, or node ID..."
                            className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-white font-bold text-lg placeholder-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <button 
                            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all whitespace-nowrap ${showOnlyFavorites ? 'bg-amber-500 text-[#0F172A] dark:text-white border-transparent shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-[#0F172A] hover:border-amber-400'}`}
                        >
                            {showOnlyFavorites ? <StarIconFilled className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Favorites</span>
                        </button>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-900 mx-2 hidden md:block"></div>

                        <div className="flex items-center gap-2">
                            <FunnelIcon className="w-4 h-4 text-[#0F172A] dark:text-white" />
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-[#0F172A] dark:text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipients Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
                {filteredRecipients.length > 0 ? (
                    filteredRecipients.map(recipient => (
                        <RecipientCard 
                            key={recipient.id} 
                            recipient={recipient} 
                            transactions={getTransactionsForRecipient(recipient.fullName)}
                            onEdit={() => handleOpenEditModal(recipient)}
                            onDelete={() => setRecipientToDelete(recipient)}
                            onQuickPay={() => onOpenSendMoneyFlow('send', recipient)}
                            onToggleFavorite={() => onToggleFavorite(recipient.id)}
                        />
                    ))
                ) : (
                    <div className="lg:col-span-2 py-32 text-center bg-slate-100 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <UserGroupIcon className="w-20 h-20 text-[#0F172A] dark:text-white dark:text-[#1E293B] mx-auto mb-6" />
                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-widest">No matching nodes found</h3>
                        <p className="text-[#0F172A] dark:text-white mt-2">Check your query parameters or initialize a new settlement node.</p>
                    </div>
                )}
            </div>

            {isEditModalOpen && recipientToEdit && (
                <AddRecipientModal
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setRecipientToEdit(null);
                    }}
                    onAddRecipient={addRecipient}
                    recipientToEdit={recipientToEdit}
                    onUpdateRecipient={onUpdateRecipient}
                />
            )}

            {recipientToDelete && (
                <DeleteConfirmationModal
                    title="Decommission Node"
                    message="Are you sure you want to permanently decommission this settlement node?"
                    itemTypeLabel="Beneficiary Node:"
                    itemText={`${recipientToDelete.fullName} (${recipientToDelete.bankName})`}
                    confirmButtonText="Decommission"
                    onClose={() => setRecipientToDelete(null)}
                    onConfirm={() => {
                        onDeleteRecipient(recipientToDelete.id);
                        setRecipientToDelete(null);
                    }}
                />
            )}
        </div>
    );
};
