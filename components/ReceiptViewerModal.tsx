import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    Download, 
    Sparkles, 
    Check, 
    Highlighter, 
    FileText, 
    RefreshCw, 
    Tag, 
    Calendar, 
    DollarSign, 
    Store, 
    ShieldCheck, 
    Upload,
    Eye
} from 'lucide-react';
import { Transaction } from '../types';
import { analyzeReceiptOCR } from '../services/geminiService';
import { compressImage } from '../utils/imageProcessor';
import { ReceiptMarkupCanvas } from './ReceiptMarkupCanvas';

interface ReceiptViewerModalProps {
    transaction: Transaction | null;
    onClose: () => void;
    onUpdateTransaction: (txId: string, updates: Partial<Transaction>) => void;
    onDownloadPdfReceipt?: (transaction: Transaction) => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
    transaction,
    onClose,
    onUpdateTransaction,
    onDownloadPdfReceipt
}) => {
    if (!transaction) return null;

    const [activeTab, setActiveTab] = useState<'overview' | 'markup'>('overview');
    
    // Form pre-fill metadata state
    const [amount, setAmount] = useState<string>(transaction.sendAmount.toString());
    const [date, setDate] = useState<string>(
        transaction.paymentProofTimestamp
            ? new Date(transaction.paymentProofTimestamp).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [merchant, setMerchant] = useState<string>(transaction.recipient?.nickname || transaction.recipient?.fullName || transaction.description);
    const [category, setCategory] = useState<string>(transaction.category || 'Shopping');
    const [memo, setMemo] = useState<string>(transaction.transactionDetails?.memo || '');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const receiptUrl = transaction.paymentProof || (transaction as any).screenshotProof || '';

    const handleRunOcr = async (imageToAnalyze?: string) => {
        const targetImg = imageToAnalyze || receiptUrl;
        if (!targetImg) {
            setStatusMessage("No receipt image available to analyze.");
            return;
        }

        setIsAnalyzing(true);
        setStatusMessage("Scanning receipt with Gemini AI OCR engine...");
        try {
            const res = await analyzeReceiptOCR(targetImg);
            if (res.success) {
                if (res.amount && res.amount > 0) setAmount(res.amount.toString());
                if (res.date) setDate(res.date);
                if (res.merchant) setMerchant(res.merchant);
                if (res.category) setCategory(res.category);

                setStatusMessage(`✓ OCR Complete: Extracted $${res.amount || 0} (${res.merchant || 'Vendor'})`);
            } else {
                setStatusMessage("OCR finished with fallback values.");
            }
        } catch (err) {
            console.error("OCR scan error:", err);
            setStatusMessage("Failed to execute OCR scan.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveMetadata = () => {
        setIsSaving(true);
        const parsedAmount = parseFloat(amount) || transaction.sendAmount;
        
        onUpdateTransaction(transaction.id, {
            sendAmount: parsedAmount,
            receiveAmount: parsedAmount,
            category: category as any,
            description: `Receipt: ${merchant}`,
            recipient: {
                ...transaction.recipient,
                nickname: merchant,
                fullName: merchant
            },
            transactionDetails: {
                ...transaction.transactionDetails,
                memo: memo
            }
        });

        setStatusMessage("✓ Transaction metadata updated & pre-filled successfully!");
        setTimeout(() => {
            setIsSaving(false);
        }, 1200);
    };

    const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsAnalyzing(true);
            setStatusMessage("Compressing & scanning new receipt...");
            const compressed = await compressImage(file);
            
            // Auto run OCR
            const ocr = await analyzeReceiptOCR(compressed);
            
            const parsedAmount = ocr.amount && ocr.amount > 0 ? ocr.amount : transaction.sendAmount;

            if (ocr.amount) setAmount(ocr.amount.toString());
            if (ocr.date) setDate(ocr.date);
            if (ocr.merchant) setMerchant(ocr.merchant);
            if (ocr.category) setCategory(ocr.category);

            onUpdateTransaction(transaction.id, {
                paymentProof: compressed,
                paymentProofTimestamp: new Date().toISOString(),
                sendAmount: parsedAmount,
                receiveAmount: parsedAmount,
                category: (ocr.category || category) as any,
                description: `Receipt: ${ocr.merchant || merchant}`
            });

            setStatusMessage("✓ New receipt attached & metadata auto-filled!");
        } catch (err) {
            console.error("File upload failed:", err);
            setStatusMessage("Error updating receipt image.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveMarkup = (newBase64: string) => {
        onUpdateTransaction(transaction.id, {
            paymentProof: newBase64,
            paymentProofTimestamp: new Date().toISOString()
        });
        setStatusMessage("✓ Annotated tax audit receipt saved!");
        setActiveTab('overview');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100  overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-4xl bg-slate-50 border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 dark:bg-slate-900"
                >
                    {/* Top Modal Navigation Header */}
                    <div className="flex items-center justify-between p-6 bg-slate-100 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500 border border-emerald-500/20 rounded-2xl text-emerald-400">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-white uppercase tracking-wide">Receipt Audit & Document Viewer</h2>
                                    <span className="text-[10px] font-mono font-bold bg-emerald-500 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                                        TX_{transaction.id.slice(-8)}
                                    </span>
                                </div>
                                <p className="text-xs text-[#0F172A] font-mono mt-0.5">Instant proof confirmation & tax compliance markup engine</p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="p-2 text-[#0F172A] hover:text-white bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 transition-all dark:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 dark:bg-slate-900">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-2xl border-t border-x transition-all flex items-center gap-2 ${
                                activeTab === 'overview'
                                    ? 'bg-slate-100 text-emerald-400 border-slate-200 border-b-slate-950'
                                    : 'text-[#0F172A] hover:text-white border-transparent'
                            }`}
                        >
                            <Eye className="w-4 h-4" />
                            <span>Receipt & Metadata Form</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('markup')}
                            className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-2xl border-t border-x transition-all flex items-center gap-2 ${
                                activeTab === 'markup'
                                    ? 'bg-slate-100 text-amber-400 border-slate-200 border-b-slate-950'
                                    : 'text-[#0F172A] hover:text-white border-transparent'
                            }`}
                        >
                            <Highlighter className="w-4 h-4" />
                            <span>✍ Draw & Highlight for Tax Audit</span>
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 bg-slate-100">
                        {statusMessage && (
                            <div className="mb-6 p-3 bg-amber-500 border border-amber-500/20 text-amber-400 rounded-2xl text-xs font-mono flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                                    <span>{statusMessage}</span>
                                </div>
                                <button onClick={() => setStatusMessage(null)} className="text-[#0F172A] hover:text-white text-xs">Dismiss</button>
                            </div>
                        )}

                        {activeTab === 'overview' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Real-Time Thumbnail / Receipt Image Viewer */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                                            <span>Attached Receipt Image</span>
                                            {receiptUrl && (
                                                <span className="text-[9px] bg-emerald-500 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                                                    REAL-TIME ACTIVE
                                                </span>
                                            )}
                                        </h3>

                                        <label className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1.5 bg-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20">
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>Replace Receipt</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleReplaceFile} />
                                        </label>
                                    </div>

                                    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center min-h-[320px] overflow-hidden group dark:bg-slate-900">
                                        {receiptUrl ? (
                                            <>
                                                <img 
                                                    src={receiptUrl} 
                                                    alt="Attached Receipt" 
                                                    className="max-h-[360px] w-auto object-contain rounded-xl shadow-2xl transition-transform group-hover:scale-105 duration-300" 
                                                />
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('markup')}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-500 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                                                    >
                                                        <Highlighter className="w-3.5 h-3.5" />
                                                        <span>Highlight / Markup</span>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-8 space-y-3">
                                                <FileText className="w-12 h-12 text-[#0F172A] mx-auto" />
                                                <p className="text-xs text-[#0F172A]">No receipt image attached to this transaction yet.</p>
                                                <label className="inline-flex px-4 py-2 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg hover:bg-emerald-400 transition-all">
                                                    Upload Receipt File
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleReplaceFile} />
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleRunOcr()}
                                            disabled={isAnalyzing || !receiptUrl}
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-600 text-indigo-300 border border-indigo-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            <Sparkles className="w-4 h-4 text-indigo-400" />
                                            <span>{isAnalyzing ? "Analyzing OCR..." : "Re-Run Gemini OCR"}</span>
                                        </button>

                                        {onDownloadPdfReceipt && (
                                            <button
                                                type="button"
                                                onClick={() => onDownloadPdfReceipt(transaction)}
                                                className="py-3 px-4 bg-slate-50 hover:bg-white text-[#0F172A] border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 dark:bg-slate-800"
                                                title="Export Official PDF Advice"
                                            >
                                                <Download className="w-4 h-4 text-emerald-400" />
                                                <span>Advice PDF</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Metadata Auto-Fill Form */}
                                <div className="space-y-4 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between dark:bg-slate-900">
                                    <div className="space-y-4">
                                        <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                                            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span>OCR Metadata Auto-Fill Form</span>
                                            </h3>
                                            <span className="text-[10px] text-[#0F172A] font-mono">Tax Audit Ready</span>
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Receipt Total Amount (USD)</span>
                                            </label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {/* Date */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Receipt Date</span>
                                            </label>
                                            <input 
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Merchant / Recipient */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                                                <Store className="w-3.5 h-3.5 text-cyan-400" />
                                                <span>Merchant / Vendor Name</span>
                                            </label>
                                            <input 
                                                type="text"
                                                value={merchant}
                                                onChange={(e) => setMerchant(e.target.value)}
                                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-white font-sans font-bold focus:outline-none focus:border-emerald-500"
                                                placeholder="Vendor or store name"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                                                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>Tax Deduction Category</span>
                                            </label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-white font-sans font-bold focus:outline-none focus:border-emerald-500"
                                            >
                                                <option value="Shopping">Shopping & Supplies</option>
                                                <option value="Dining">Dining & Entertainment</option>
                                                <option value="Travel">Travel & Lodging</option>
                                                <option value="Services">Professional Services</option>
                                                <option value="Utilities">Utilities & Telecom</option>
                                                <option value="Digital/Tech">Digital Software & Hardware</option>
                                                <option value="Office">Office & Operations</option>
                                                <option value="Groceries">Groceries</option>
                                            </select>
                                        </div>

                                        {/* Memo / Notes */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-[#0F172A]">Audit Memo / Tax Purpose</label>
                                            <input 
                                                type="text"
                                                value={memo}
                                                onChange={(e) => setMemo(e.target.value)}
                                                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-emerald-500"
                                                placeholder="e.g. IRS Sec 274 Business Meal / Office Supply..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSaveMetadata}
                                        disabled={isSaving}
                                        className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isSaving ? "Saving Metadata..." : "Save Pre-filled Metadata"}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {receiptUrl ? (
                                    <ReceiptMarkupCanvas
                                        receiptImageUrl={receiptUrl}
                                        receiptTitle={`Tax Compliance Markup: ${merchant || 'Uploaded Receipt'}`}
                                        onSaveMarkup={handleSaveMarkup}
                                        onClose={() => setActiveTab('overview')}
                                    />
                                ) : (
                                    <div className="text-center py-16 space-y-4">
                                        <p className="text-[#0F172A] text-sm">Please attach or upload a receipt image first before launching markup mode.</p>
                                        <label className="inline-flex px-5 py-3 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg hover:bg-amber-400">
                                            Upload Receipt Image Now
                                            <input type="file" accept="image/*" className="hidden" onChange={handleReplaceFile} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
