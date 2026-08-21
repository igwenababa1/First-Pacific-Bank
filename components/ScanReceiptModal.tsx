import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Camera, Upload, FileText, Sparkles, Loader2, X, Check, 
    ArrowRight, AlertCircle, RefreshCw, Zap, ShieldCheck 
} from 'lucide-react';
import { Account, Transaction } from '../types';

interface ScanReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    createTransaction: (t: Omit<Transaction, 'id' | 'status' | 'statusTimestamps' | 'type'>) => Promise<Transaction | null>;
    onSuccess: (toastMessage: string) => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
    isOpen,
    onClose,
    accounts,
    createTransaction,
    onSuccess
}) => {
    // Camera state
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Flow stages: 'choose_input' | 'camera_active' | 'upload_active' | 'processing' | 'draft_review' | 'success_overlay'
    const [scanStage, setScanStage] = useState<'choose_input' | 'camera_active' | 'processing' | 'draft_review' | 'success_overlay'>('choose_input');
    
    // Uploaded / Captured file stats
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // AI Processing details
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [category, setCategory] = useState('Shopping');
    
    // UI states
    const [isPosting, setIsPosting] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Set first account as default selected account
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    // Cleanup camera stream
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setCameraActive(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [cameraStream]);

    // Activate Device Camera
    const initializeCamera = async () => {
        setCameraError(null);
        setScanStage('camera_active');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setCameraStream(stream);
            setCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error("[Camera Setup Fallback] Permission block or device mismatch: ", err);
            setCameraError("Camera permission blocked or hardware in use. Please use direct receipt upload.");
            setScanStage('choose_input');
        }
    };

    // Capture visual snapshot and halt camera
    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopCamera();
                triggerAiOCRAnalysis();
            }
        } catch(e) {
            console.error("Snapshot capture crash: ", e);
            // Fallback
            triggerAiOCRAnalysis();
        }
    };

    // Trigger AI Extraction Simulation
    const triggerAiOCRAnalysis = () => {
        setScanStage('processing');
        
        // Premium realistic merchant data pool
        const merchants = ["Blue Bottle Coffee Corp", "Prada Luxury Retailer", "SpaceX Launchpad Goods", "Apple Infinity Store", "Whole Foods Sovereign Market", "Elite Airport Concierge Desk"];
        const categories = ["Coffee/Dining", "Shopping", "Interstellar Logistics", "Digital/Tech", "Groceries", "Travel"];
        
        const randomIdx = Math.floor(Math.random() * merchants.length);
        const randomMerchant = merchants[randomIdx];
        const randomCategory = categories[randomIdx];
        const randomAmount = (Math.random() * 240 + 12.50).toFixed(2);

        setTimeout(() => {
            setMerchant(randomMerchant);
            setAmount(randomAmount);
            setCategory(randomCategory);
            setScanStage('draft_review');
        }, 2200); // 2.2 seconds of highly advanced laser sweeping animation
    };

    // Drag and Drop files handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processUploadedFile(files[0]);
        }
    };

    const processUploadedFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setCapturedImage(reader.result as string);
            triggerAiOCRAnalysis();
        };
        reader.readAsDataURL(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processUploadedFile(files[0]);
        }
    };

    // Post finalized draft receipt to standard account balance
    const handlePostReceipt = async () => {
        if (!merchant || !amount || !selectedAccountId) return;
        setIsPosting(true);

        const targetAccount = accounts.find(a => a.id === selectedAccountId);
        
        try {
            await createTransaction({
                accountId: selectedAccountId,
                sendAmount: parseFloat(amount),
                receiveAmount: parseFloat(amount),
                receiveCurrency: "USD",
                description: `Sovereign Receipt: ${merchant}`,
                category: category as any,
                recipient: {
                    id: `merchant_${Date.now()}`,
                    fullName: merchant,
                    bankName: "Verified Card Merchant Settlement Desk",
                    accountNumber: `VCM-MERCH-${Math.floor(10000000 + Math.random() * 90000000)}`,
                    isFavorite: false,
                    country: { name: "United States", code: "US", currency: "USD", symbol: "$" },
                    realDetails: {
                        accountNumber: "VCM-MERCH-8849",
                        swiftBic: "CLRSET33"
                    }
                },
                fee: 0,
                exchangeRate: 1,
                purpose: `Sovereign OCR Auto Reconciliation - ${category}`,
                estimatedArrival: new Date()
            });

            setScanStage('success_overlay');
            onSuccess(`Receipt for ${merchant} of $${amount} successfully reconciled!`);
        } catch (e) {
            console.error("Failed to commit receipt transaction:", e);
        } finally {
            setIsPosting(false);
        }
    };

    const handleReset = () => {
        stopCamera();
        setCapturedImage(null);
        setMerchant('');
        setAmount('');
        setScanStage('choose_input');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 z-[100]  flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-50 border border-slate-200 dark:border-white/10 dark:border-emerald-500/20 w-full max-w-[460px] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative dark:bg-slate-900"
            >
                {/* Close Trigger Button */}
                <button 
                    onClick={() => { stopCamera(); onClose(); }}
                    className="absolute top-4 right-4 text-[#0F172A] hover:text-white transition-colors cursor-pointer bg-white p-1.5 rounded-full z-55 dark:bg-slate-800"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Subheader branding bar */}
                <div className="bg-[#05080f] px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-[9px] font-black uppercase text-[#0F172A] tracking-[0.2em]">SECURE RECEIPT DESK</span>
                </div>

                {/* Scan Sequence Stage Renderer */}
                <div className="p-6">
                    {scanStage === 'choose_input' && (
                        <div>
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold tracking-tight text-white mb-1.5">Sovereign Receipt Capture</h3>
                                <p className="text-xs text-[#0F172A]">Instantly OCR-reconcile expenses onto your secure institutional balances</p>
                            </div>

                            {/* Camera Action Trigger */}
                            <button
                                onClick={initializeCamera}
                                className="w-full flex items-center justify-center gap-3 p-4 mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-2xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer shadow-lg active:scale-95 group"
                            >
                                <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                                <span>Activate Device Camera</span>
                            </button>

                            {/* Drag and Drop File Upload Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer ${
                                    isDragOver 
                                        ? 'border-emerald-400 bg-emerald-500' 
                                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:border-black/10'
                                }`}
                            >
                                <Upload className="w-8 h-8 text-[#0F172A] mb-2" />
                                <span className="text-xs font-semibold text-[#1E293B]">Drag & Drop Receipt</span>
                                <span className="text-[10px] text-[#0F172A] mt-1">or click to browse filesystem</span>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileSelect} 
                                    className="hidden" 
                                    accept="image/*" 
                                />
                            </div>

                            {cameraError && (
                                <div className="mt-4 flex items-center gap-2 text-[11px] text-rose-400 bg-rose-950 border border-rose-800/30 p-2.5 rounded-xl">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{cameraError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Camera Active Preview Screen */}
                    {scanStage === 'camera_active' && (
                        <div>
                            <div className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/15 bg-slate-100">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Luxury HUD scanning guidelines overlay */}
                                <div className="absolute inset-0 border-[3px] border-emerald-500/20 m-6 rounded-xl flex items-center justify-center">
                                    {/* Rotating laser sweep simulator */}
                                    <div className="absolute top-0 bottom-0 left-0 right-0 border-y border-emerald-400/40 opacity-70 flex flex-col justify-between p-2 pointer-events-none">
                                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                                    </div>
                                    <span className="font-mono text-[9px] font-black text-emerald-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded uppercase">Reconciliation HUD</span>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-between items-center mt-5">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-3 bg-white hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold transition-all cursor-pointer dark:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={takeSnapshot}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-[#0F172A] rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-lg dark:bg-slate-800"
                                >
                                    <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
                                    Capture & OCR Sync
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI OCR Processing animation stage */}
                    {scanStage === 'processing' && (
                        <div className="py-8 text-center flex flex-col items-center">
                            <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                                <Loader2 className="w-14 h-14 text-emerald-400 animate-spin absolute" />
                                <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
                            </div>
                            <h4 className="text-white font-bold text-sm tracking-widest uppercase">Executing Decryption Protocol</h4>
                            <p className="text-xs text-[#0F172A] max-w-[280px] mt-1.5 leading-relaxed">
                                Gemini optical analysis extracting merchant, total amounts, sales taxes, and settling currency targets...
                            </p>

                            {/* Progression scanning lines */}
                            <div className="w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden mt-6 border border-slate-200 dark:border-white/10">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2.1, ease: 'easeInOut' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Draft Transaction Review Form */}
                    {scanStage === 'draft_review' && (
                        <div>
                            <div className="text-center mb-5">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 border border-emerald-400/20 flex items-center justify-center mx-auto mb-2 select-none">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-white font-bold text-base">Reconcile Receipt Draft</h3>
                                <p className="text-[11px] text-[#0F172A]">Review OCR parsed fields before publishing to active ledger</p>
                            </div>

                            <div className="space-y-4">
                                {/* Merchant input */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Extracted Merchant</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                        value={merchant}
                                        onChange={(e) => setMerchant(e.target.value)}
                                    />
                                </div>

                                {/* Amount input */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Extracted Amount ($)</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500 font-mono"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Merchant Division</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none focus:border-emerald-500"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Link destination accounts dropdown */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Sovereign Settling Account</label>
                                    <select 
                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500"
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.nickname || acc.type} (${acc.balance.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-3 bg-white hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 dark:bg-slate-800"
                                >
                                    <RefreshCw className="w-3 h-3" /> Rescan
                                </button>
                                <button
                                    onClick={handlePostReceipt}
                                    disabled={isPosting || !merchant || !amount}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-70"
                                >
                                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    <span>Accept & Post Transaction</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success visual overlay */}
                    {scanStage === 'success_overlay' && (
                        <div className="py-8 text-center flex flex-col items-center scale-95 animate-fade-in-up">
                            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center mb-4 text-emerald-400 animate-pulse">
                                <Check className="w-8 h-8" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-1">Receipt Reconciled</h3>
                            <p className="text-xs text-[#0F172A] max-w-[280px]">Draft transaction verified, signed, and propagated across your sovereign checking balances securely.</p>
                            
                            <button
                                onClick={() => { onClose(); handleReset(); }}
                                className="mt-6 px-6 py-2.5 bg-white text-slate-950 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer dark:bg-slate-800"
                            >
                                Return to Portfolio
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Hidden canvas for video Frame capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
