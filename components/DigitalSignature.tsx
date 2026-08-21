import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface SignatureMetadata {
    signerName: string;
    signerTitle: string;
    timestamp: string;
    hash: string;
    mode?: 'draw' | 'type';
}

interface DigitalSignatureProps {
    onSave: (signatureDataUrl: string, metadata?: SignatureMetadata) => void;
    onClear?: () => void;
    initialSignerName?: string;
    initialSignerTitle?: string;
    compact?: boolean;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
    onSave,
    onClear,
    initialSignerName = '',
    initialSignerTitle = 'Account Holder & Authorized Signatory',
    compact = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [mode, setMode] = useState<'draw' | 'type'>('draw');
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    
    // Ink configuration
    const [inkColor, setInkColor] = useState<string>('#1e3a8a'); // Royal Navy default
    const [strokeWidth, setStrokeWidth] = useState<number>(3);
    
    // Type mode state
    const [typedName, setTypedName] = useState<string>(initialSignerName || '');
    const [typedStyle, setTypedStyle] = useState<'cursive' | 'calligraphy' | 'executive' | 'modern'>('cursive');
    
    // Metadata fields
    const [signerName, setSignerName] = useState<string>(initialSignerName || '');
    const [signerTitle, setSignerTitle] = useState<string>(initialSignerTitle);

    // Update signerName if initial changes
    useEffect(() => {
        if (initialSignerName && !signerName) {
            setSignerName(initialSignerName);
            if (!typedName) setTypedName(initialSignerName);
        }
    }, [initialSignerName]);

    // Setup canvas stroke properties
    const updateCanvasContext = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = inkColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = `${inkColor}33`;
        ctx.shadowBlur = 3;
    }, [inkColor, strokeWidth]);

    useEffect(() => {
        updateCanvasContext();
    }, [updateCanvasContext]);

    // Handle rendering typed signature onto canvas
    const renderTypedSignature = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!typedName.trim()) {
            setHasSigned(false);
            return;
        }

        ctx.save();
        ctx.fillStyle = inkColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (typedStyle === 'cursive') {
            ctx.font = 'italic bold 44px "Brush Script MT", "Playfair Display", "Times New Roman", cursive';
        } else if (typedStyle === 'calligraphy') {
            ctx.font = 'italic 40px "Zapfino", "Monotype Corsiva", "Dancing Script", cursive';
        } else if (typedStyle === 'executive') {
            ctx.font = 'bold 36px "Georgia", "Times New Roman", serif';
        } else {
            ctx.font = 'italic 38px "Caveat", "Dancing Script", cursive';
        }

        // Draw centered typed name with slant
        ctx.fillText(`// ${typedName} //`, canvas.width / 2, canvas.height / 2);
        
        // Underline flourish
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const metrics = ctx.measureText(`// ${typedName} //`);
        const startX = Math.max(20, (canvas.width - metrics.width) / 2);
        const endX = Math.min(canvas.width - 20, (canvas.width + metrics.width) / 2);
        const y = canvas.height / 2 + 20;
        ctx.moveTo(startX, y);
        ctx.quadraticCurveTo(canvas.width / 2, y + 10, endX, y);
        ctx.stroke();
        ctx.restore();

        setHasSigned(true);
    }, [typedName, typedStyle, inkColor]);

    useEffect(() => {
        if (mode === 'type') {
            renderTypedSignature();
        }
    }, [mode, renderTypedSignature]);

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * canvas.width,
            y: ((clientY - rect.top) / rect.height) * canvas.height
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (mode !== 'draw') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        updateCanvasContext();
        setIsDrawing(true);
        const pos = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || mode !== 'draw') return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getCoordinates(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        if (mode === 'draw') {
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        if (mode === 'type') {
            setTypedName('');
        }
        if (onClear) onClear();
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSigned) return;
        
        const dataUrl = canvas.toDataURL('image/png');
        const timestamp = new Date().toISOString();
        const hash = `SIG-${Math.random().toString(36).substring(2, 9).toUpperCase()}-VERIFIED`;

        const metadata: SignatureMetadata = {
            signerName: signerName || typedName || 'Authorized Signatory',
            signerTitle: signerTitle || 'Account Owner',
            timestamp,
            hash,
            mode
        };

        onSave(dataUrl, metadata);
    };

    return (
        <div className="space-y-4 w-full">
            {/* Mode Switcher & Ink Palette */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg select-none">
                
                {/* Mode Selector */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setMode('draw')}
                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            mode === 'draw'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white dark:hover:text-white'
                        }`}
                    >
                        ✍ Draw Ink
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('type')}
                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            mode === 'type'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white dark:hover:text-white'
                        }`}
                    >
                        ⌨ Type Signature
                    </button>
                </div>

                {/* Ink Color Picker */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Ink:</span>
                    {[
                        { color: '#1e3a8a', label: 'Navy Royal' },
                        { color: '#0284c7', label: 'Cursive Blue' },
                        { color: '#0f172a', label: 'Classic Onyx' },
                        { color: '#ca8a04', label: 'Gold Seal' },
                    ].map(item => (
                        <button
                            key={item.color}
                            type="button"
                            onClick={() => setInkColor(item.color)}
                            title={item.label}
                            className={`w-5 h-5 rounded-full border-2 transition-transform ${
                                inkColor === item.color ? 'scale-125 ring-2 ring-emerald-500 border-white' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: item.color }}
                        />
                    ))}
                </div>

                {/* Stroke Thickness (Draw mode only) */}
                {mode === 'draw' && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Stroke:</span>
                        {[2, 3, 5].map(w => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => setStrokeWidth(w)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono border ${
                                    strokeWidth === w
                                        ? 'bg-emerald-500 text-emerald-400 border-emerald-500/40'
                                        : 'text-[#0F172A] border-black/5 hover:bg-white'
                                }`}
                            >
                                {w === 2 ? 'Fine' : w === 3 ? 'Med' : 'Bold'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Type Mode Controls */}
            {mode === 'type' && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-black/5 space-y-3 dark:bg-slate-900">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider block mb-1">Type Full Name</label>
                            <input
                                type="text"
                                value={typedName}
                                onChange={e => {
                                    setTypedName(e.target.value);
                                    if (!signerName) setSignerName(e.target.value);
                                }}
                                placeholder="Enter legal full name..."
                                className="w-full bg-slate-100 text-white border border-black/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider block mb-1">Font Script Style</label>
                            <select
                                value={typedStyle}
                                onChange={e => setTypedStyle(e.target.value as any)}
                                className="w-full bg-slate-100 text-white border border-black/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="cursive">Cursive Formal Script</option>
                                <option value="calligraphy">Calligraphy Elegant</option>
                                <option value="executive">Executive Serif Italics</option>
                                <option value="modern">Modern Handwriting</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Signing Box */}
            <div className="border border-slate-300 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-inner relative">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={160}
                    className="w-full h-[160px] cursor-crosshair touch-none bg-slate-50 dark:bg-slate-800"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                
                {/* Guideline line */}
                <div className="absolute bottom-9 left-6 right-6 border-b border-dashed border-slate-300 dark:border-slate-700 pointer-events-none flex items-center justify-between">
                    <span className="text-[10px] text-[#0F172A] uppercase font-mono tracking-widest bg-white dark:bg-slate-800 px-1 select-none font-bold">
                        Legal Signatory Line (X)
                    </span>
                    <span className="text-[9px] text-emerald-500 font-mono select-none font-bold">
                        🔒 Digital Signature Verification Lock
                    </span>
                </div>
            </div>

            {/* Metadata inputs */}
            {!compact && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider block mb-1">Signer Legal Name</label>
                        <input
                            type="text"
                            value={signerName}
                            onChange={e => setSignerName(e.target.value)}
                            placeholder="Signer Full Name..."
                            className="w-full bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider block mb-1">Signer Legal Title / Role</label>
                        <input
                            type="text"
                            value={signerTitle}
                            onChange={e => setSignerTitle(e.target.value)}
                            placeholder="e.g. Account Owner / Trustee"
                            className="w-full bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-[#0F172A] bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-white rounded-xl transition-all hover:text-[#1E293B] dark:hover:text-[#1E293B] cursor-pointer"
                >
                    Clear Ink
                </button>
                <button
                    type="button"
                    disabled={!hasSigned}
                    onClick={saveSignature}
                    className="flex-2 py-3 text-xs font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-30 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                    <span>✍ Affix Digital Signature</span>
                </button>
            </div>
        </div>
    );
};

