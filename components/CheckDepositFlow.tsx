
import React, { useState, useRef, useEffect } from 'react';
import { Account } from '../types';
import { 
    SpinnerIcon, 
    CameraIcon, 
    CheckCircleIcon, 
    ArrowLeftIcon, 
    DocumentCheckIcon, 
    ExclamationTriangleIcon, 
    CloudArrowUpIcon,
    XIcon,
    ViewfinderIcon
} from './Icons';
import { triggerHaptic } from '../utils/haptics';
import { db } from '../services/database';
import { useCurrency } from '../contexts/CurrencyContext';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

interface CheckDepositFlowProps {
    accounts: Account[];
    onDepositCheck: (details: { amount: number, accountId: string, images: { front: string, back: string } }) => void;
}

type DepositStep = 'amount' | 'capture_front' | 'capture_back' | 'review' | 'submitting' | 'success';

const CameraOverlay: React.FC<{
    label: string;
    onCapture: (imageData: string) => void;
    onCancel: () => void;
}> = ({ label, onCapture, onCancel }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [scanMessage, setScanMessage] = useState("Align check within frame");

    useEffect(() => {
        // Simulate smart detection logic
        const messages = ["Align check within frame", "Hold steady...", "Optimizing focus...", "Capturing..."];
        let index = 0;
        const interval = setInterval(() => {
            if (index < messages.length - 1) {
                index++;
                setScanMessage(messages[index]);
            }
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsScanning(false);
            const base64 = await fileToBase64(file);
            triggerHaptic();
            onCapture(base64);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100 flex flex-col items-center justify-between py-8 animate-fade-in">
            {/* Header */}
            <div className="w-full px-6 flex justify-between items-center">
                <button onClick={onCancel} className="p-2 bg-white rounded-full  dark:bg-slate-800">
                    <XIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                </button>
                <span className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">{label}</span>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Viewfinder Area */}
            <div className="relative w-full max-w-md aspect-[16/9] px-4 flex items-center justify-center">
                <div className="relative w-full h-full border-2 border-slate-200 dark:border-white/30 rounded-xl overflow-hidden">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                    
                    {/* Scanning Line */}
                    {isScanning && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(0,82,255,0.8)] animate-scan-vertical opacity-70"></div>
                    )}
                    
                    {/* Simulated Camera Feed Placeholder */}
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 -z-10 flex items-center justify-center">
                        <ViewfinderIcon className="w-16 h-16 text-[#0F172A] dark:text-white/20" />
                    </div>
                </div>
                
                {/* Feedback Toast */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 bg-slate-100  px-4 py-2 rounded-full border border-slate-200 dark:border-white/10">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-white animate-pulse">{scanMessage}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md px-8 flex flex-col items-center gap-6">
                <p className="text-xs text-center text-[#0F172A] dark:text-white max-w-xs">
                    Place check on a dark, non-reflective background. Ensure all four corners are visible.
                </p>
                
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-white/30 flex items-center justify-center relative group"
                >
                    <div className="w-16 h-16 bg-white rounded-full transition-transform group-hover:scale-90 group-active:scale-75 dark:bg-slate-800"></div>
                </button>
            </div>
            
            <style>{`
                @keyframes scan-vertical {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-vertical {
                    animation: scan-vertical 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export const CheckDepositFlow: React.FC<CheckDepositFlowProps> = ({ accounts, onDepositCheck }) => {
    const { formatCurrency, displayCurrency, getCurrencyInfo } = useCurrency();
    const currencySymbol = getCurrencyInfo(displayCurrency)?.symbol || '$';
    
    const [step, setStep] = useState<DepositStep>('amount');
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [endorsed, setEndorsed] = useState(false);
    const [error, setError] = useState('');

    const handleAmountSubmit = () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        setError('');
        triggerHaptic();
        setStep('capture_front');
    };

    const handleFrontCapture = (img: string) => {
        setFrontImage(img);
        // Simulate analysis delay before moving to next step
        setTimeout(() => setStep('capture_back'), 500);
    };

    const handleBackCapture = (img: string) => {
        setBackImage(img);
        setTimeout(() => setStep('review'), 500);
    };

    const handleDeposit = async () => {
        if (!endorsed) {
            setError("You must endorse the check.");
            return;
        }
        setError('');
        setStep('submitting');
        
        try {
            // Upload images to storage before submitting.
            // Explicitly use the 'documents' bucket for secure check storage.
            const frontUrl = await db.uploadFile(frontImage!, 'documents', 'checks');
            const backUrl = await db.uploadFile(backImage!, 'documents', 'checks');

            // Submit with URLs
            onDepositCheck({
                amount: parseFloat(amount),
                accountId,
                images: { front: frontUrl, back: backUrl }
            });
            
            setStep('success');
            triggerHaptic([10, 50, 10]);
        } catch (e) {
            console.error(e);
            setError("Deposit failed. Please try again.");
            setStep('review');
        }
    };

    // Dynamic UI rendering
    return (
        <div className="relative min-h-[400px]">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 px-6 -mt-2 mb-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mb-2">
                    <span className={['amount', 'capture_front', 'capture_back', 'review'].includes(step) ? 'text-primary' : ''}>Amount</span>
                    <span className={['capture_front', 'capture_back', 'review'].includes(step) ? 'text-primary' : ''}>Photos</span>
                    <span className={step === 'review' ? 'text-primary' : ''}>Review</span>
                </div>
                <div className="h-1 bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ 
                            width: step === 'amount' ? '33%' : 
                                   step === 'capture_front' ? '50%' : 
                                   step === 'capture_back' ? '66%' : '100%' 
                        }}
                    ></div>
                </div>
            </div>

            <div className="pt-8">
                {step === 'amount' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center">
                            <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">Check Amount</label>
                            <div className="relative inline-block">
                                <span className="absolute left-[-20px] top-2 text-2xl text-[#0F172A]">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    className="bg-transparent text-5xl font-bold text-[#0F172A] dark:text-white text-center outline-none w-full max-w-[200px] placeholder-slate-700"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-400 text-xs mt-2 font-bold">{error}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wide pl-1">Deposit To</label>
                            <div className="relative">
                                <select 
                                    value={accountId} 
                                    onChange={e => setAccountId(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl appearance-none focus:ring-2 focus:ring-primary outline-none font-bold"
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.nickname} (....{acc.accountNumber.slice(-4)})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F172A] dark:text-white">▼</div>
                            </div>
                        </div>

                        <button onClick={handleAmountSubmit} className="w-full py-4 bg-primary text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all active:scale-[0.98]">
                            Continue to Photos
                        </button>
                    </div>
                )}

                {(step === 'capture_front' || step === 'capture_back') && (
                    <CameraOverlay 
                        label={step === 'capture_front' ? "Scan Front of Check" : "Scan Back of Check"} 
                        onCapture={step === 'capture_front' ? handleFrontCapture : handleBackCapture}
                        onCancel={() => setStep('amount')}
                    />
                )}

                {step === 'review' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 uppercase tracking-wider">Check Summary</h3>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-white/10">
                                <span className="text-[#0F172A] dark:text-white">Amount</span>
                                <span className="text-2xl font-bold text-[#0F172A] dark:text-white">{formatCurrency(parseFloat(amount))}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden border border-slate-300 dark:border-black/10 group">
                                    <img src={frontImage!} alt="Front" className="w-full h-full object-cover opacity-80" />
                                    <span className="absolute top-2 left-2 bg-slate-100 text-[8px] text-[#0F172A] dark:text-white px-2 py-0.5 rounded  uppercase font-bold">Front</span>
                                    <button onClick={() => setStep('capture_front')} className="absolute inset-0 flex items-center justify-center bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-bold text-[#0F172A] dark:text-white border border-white px-3 py-1 rounded-full">Retake</span>
                                    </button>
                                </div>
                                <div className="relative aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden border border-slate-300 dark:border-black/10 group">
                                    <img src={backImage!} alt="Back" className="w-full h-full object-cover opacity-80" />
                                    <span className="absolute top-2 left-2 bg-slate-100 text-[8px] text-[#0F172A] dark:text-white px-2 py-0.5 rounded  uppercase font-bold">Back</span>
                                    <button onClick={() => setStep('capture_back')} className="absolute inset-0 flex items-center justify-center bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-bold text-[#0F172A] dark:text-white border border-white px-3 py-1 rounded-full">Retake</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={endorsed} 
                                onChange={e => setEndorsed(e.target.checked)} 
                                className="mt-1 w-5 h-5 rounded border-slate-500 text-primary focus:ring-primary bg-transparent" 
                            />
                            <div>
                                <span className="block text-sm font-bold text-[#0F172A] dark:text-white">I have endorsed this check</span>
                                <span className="block text-xs text-[#0F172A] dark:text-white mt-1">Please write "For Mobile Deposit Only at Premium Reserved Bank" on the back.</span>
                            </div>
                        </label>

                        {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}

                        <div className="flex gap-3">
                            <button onClick={() => setStep('amount')} className="px-6 py-3 text-[#0F172A] dark:text-white font-bold hover:text-[#0F172A] dark:text-white transition-colors">Back</button>
                            <button onClick={handleDeposit} className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]">
                                <DocumentCheckIcon className="w-5 h-5" />
                                Confirm Deposit
                            </button>
                        </div>
                    </div>
                )}

                {step === 'submitting' && (
                    <div className="py-12 text-center space-y-6 animate-fade-in">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-300 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CloudArrowUpIcon className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Processing Deposit...</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm mt-2">Uploading images securely to vault.</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-8 text-center space-y-6 animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                            <CheckCircleIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Deposit Successful!</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm mt-2">
                                Your funds of <strong className="text-[#0F172A] dark:text-white">{formatCurrency(parseFloat(amount))}</strong> are pending availability.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg text-xs text-[#0F172A] max-w-sm mx-auto">
                            Standard availability is 1 business day. You will receive a notification when funds clear.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
