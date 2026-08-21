import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    Pencil, 
    Highlighter, 
    Type, 
    Square, 
    Stamp, 
    Undo2, 
    RotateCcw, 
    CheckCircle, 
    Save, 
    X,
    Sparkles,
    ShieldCheck
} from 'lucide-react';

interface ReceiptMarkupCanvasProps {
    receiptImageUrl: string;
    receiptTitle?: string;
    onSaveMarkup: (dataUrl: string) => void;
    onClose?: () => void;
}

interface StrokePath {
    points: { x: number; y: number }[];
    color: string;
    width: number;
    isHighlighter: boolean;
}

interface HighlightBox {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    label?: string;
}

interface TextComment {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
}

interface AuditStamp {
    x: number;
    y: number;
    text: string;
    type: 'TAX_AUDIT' | 'APPROVED' | 'DEDUCTION_VERIFIED';
}

export const ReceiptMarkupCanvas: React.FC<ReceiptMarkupCanvasProps> = ({
    receiptImageUrl,
    receiptTitle = "Uploaded Receipt Audit Trail",
    onSaveMarkup,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [tool, setTool] = useState<'pen' | 'highlighter' | 'box' | 'text' | 'stamp'>('highlighter');
    const [color, setColor] = useState<string>('#facc15'); // translucent yellow default
    const [penColor, setPenColor] = useState<string>('#ef4444'); // red default for markup
    const [strokeWidth, setStrokeWidth] = useState<number>(12); // highlighter width
    
    const [drawings, setDrawings] = useState<StrokePath[]>([]);
    const [highlightBoxes, setHighlightBoxes] = useState<HighlightBox[]>([]);
    const [comments, setComments] = useState<TextComment[]>([]);
    const [stamps, setStamps] = useState<AuditStamp[]>([]);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
    const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

    const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null);
    const [commentInput, setCommentInput] = useState('');
    const [stampType, setStampType] = useState<'TAX_AUDIT' | 'APPROVED' | 'DEDUCTION_VERIFIED'>('TAX_AUDIT');

    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Load receipt image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = receiptImageUrl;
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
        };
        img.onerror = () => {
            console.error("Failed to load receipt image into markup canvas");
            setImageLoaded(true); // render canvas anyway
        };
    }, [receiptImageUrl]);

    // Redraw loop
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        // Clear background
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0f172a'; // dark slate canvas background
        ctx.fillRect(0, 0, w, h);

        // Render receipt image scaled to center
        if (imageRef.current) {
            const img = imageRef.current;
            const padding = 30;
            const maxW = w - padding * 2;
            const maxH = h - padding * 2;
            
            let drawW = img.width;
            let drawH = img.height;
            const ratio = Math.min(maxW / drawW, maxH / drawH);
            
            drawW = drawW * ratio;
            drawH = drawH * ratio;
            
            const drawX = (w - drawW) / 2;
            const drawY = (h - drawH) / 2;

            // Soft shadow behind paper
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 10;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX, drawY, drawW, drawH);
            ctx.shadowColor = 'transparent';

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // Placeholder text if image loading
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(40, 40, w - 80, h - 80);
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Receipt Image...', w / 2, h / 2);
        }

        // 1. Render Highlight Boxes
        highlightBoxes.forEach(box => {
            ctx.save();
            ctx.fillStyle = box.color || 'rgba(250, 204, 21, 0.35)'; // translucent gold
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.fillRect(box.x, box.y, box.w, box.h);
            ctx.strokeRect(box.x, box.y, box.w, box.h);

            if (box.label) {
                ctx.fillStyle = '#854d0e';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`[AUDIT: ${box.label}]`, box.x + 4, box.y - 4);
            }
            ctx.restore();
        });

        // 2. Render Active Box Drawing preview
        if (boxStart && boxCurrent) {
            ctx.save();
            ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            const bx = Math.min(boxStart.x, boxCurrent.x);
            const by = Math.min(boxStart.y, boxCurrent.y);
            const bw = Math.abs(boxCurrent.x - boxStart.x);
            const bh = Math.abs(boxCurrent.y - boxStart.y);
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.restore();
        }

        // 3. Render Freehand Drawings & Highlighters
        drawings.forEach(d => {
            if (d.points.length < 2) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(d.points[0].x, d.points[0].y);
            for (let i = 1; i < d.points.length; i++) {
                ctx.lineTo(d.points[i].x, d.points[i].y);
            }
            
            if (d.isHighlighter) {
                ctx.globalAlpha = 0.45;
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
            } else {
                ctx.globalAlpha = 1.0;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
            ctx.strokeStyle = d.color;
            ctx.lineWidth = d.width;
            ctx.stroke();
            ctx.restore();
        });

        // 4. Render Stamps
        stamps.forEach(s => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(-0.12); // slight official stamp tilt

            ctx.lineWidth = 3;
            if (s.type === 'TAX_AUDIT') {
                ctx.strokeStyle = '#dc2626';
                ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
                ctx.strokeRect(-90, -22, 180, 44);
                ctx.fillRect(-90, -22, 180, 44);

                ctx.font = 'black 13px sans-serif';
                ctx.fillStyle = '#dc2626';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('★ TAX AUDIT COMPLIANT ★', 0, -2);
                ctx.font = 'bold 8px monospace';
                ctx.fillText('IRS SEC. 274 VERIFIED', 0, 12);
            } else if (s.type === 'APPROVED') {
                ctx.strokeStyle = '#16a34a';
                ctx.fillStyle = 'rgba(22, 163, 74, 0.1)';
                ctx.strokeRect(-80, -20, 160, 40);
                ctx.fillRect(-80, -20, 160, 40);

                ctx.font = 'black 14px sans-serif';
                ctx.fillStyle = '#16a34a';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✔ AUDIT APPROVED', 0, 0);
            } else {
                ctx.strokeStyle = '#2563eb';
                ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
                ctx.strokeRect(-95, -22, 190, 44);
                ctx.fillRect(-95, -22, 190, 44);

                ctx.font = 'black 12px sans-serif';
                ctx.fillStyle = '#2563eb';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('DEDUCTION VERIFIED', 0, -2);
                ctx.font = 'bold 8px monospace';
                ctx.fillText('SCHEDULE C COMPLIANCE', 0, 12);
            }
            ctx.restore();
        });

        // 5. Render Text Comments
        comments.forEach(c => {
            ctx.save();
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = c.color || '#ef4444';
            
            // Text background pill
            const metrics = ctx.measureText(c.text);
            const pw = metrics.width + 12;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(c.x - 4, c.y - 14, pw, 20);
            ctx.strokeStyle = c.color || '#ef4444';
            ctx.lineWidth = 1;
            ctx.strokeRect(c.x - 4, c.y - 14, pw, 20);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(c.text, c.x + 2, c.y);
            ctx.restore();
        });

    }, [drawings, highlightBoxes, comments, stamps, boxStart, boxCurrent, imageLoaded]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Handle mouse/touch events
    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e);
        
        if (tool === 'pen' || tool === 'highlighter') {
            setIsDrawing(true);
            const activeColor = tool === 'highlighter' ? color : penColor;
            const activeWidth = tool === 'highlighter' ? strokeWidth : 4;
            setDrawings(prev => [
                ...prev,
                {
                    points: [coords],
                    color: activeColor,
                    width: activeWidth,
                    isHighlighter: tool === 'highlighter'
                }
            ]);
        } else if (tool === 'box') {
            setBoxStart(coords);
            setBoxCurrent(coords);
        } else if (tool === 'stamp') {
            setStamps(prev => [
                ...prev,
                {
                    x: coords.x,
                    y: coords.y,
                    text: stampType,
                    type: stampType
                }
            ]);
        } else if (tool === 'text') {
            setPendingComment(coords);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e);

        if (isDrawing && (tool === 'pen' || tool === 'highlighter')) {
            setDrawings(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const updated = {
                    ...last,
                    points: [...last.points, coords]
                };
                return [...prev.slice(0, -1), updated];
            });
        } else if (boxStart && tool === 'box') {
            setBoxCurrent(coords);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
        }
        if (boxStart && boxCurrent) {
            const bx = Math.min(boxStart.x, boxCurrent.x);
            const by = Math.min(boxStart.y, boxCurrent.y);
            const bw = Math.abs(boxCurrent.x - boxStart.x);
            const bh = Math.abs(boxCurrent.y - boxStart.y);
            
            if (bw > 10 && bh > 10) {
                setHighlightBoxes(prev => [
                    ...prev,
                    {
                        x: bx,
                        y: by,
                        w: bw,
                        h: bh,
                        color: 'rgba(250, 204, 21, 0.35)',
                        label: 'TAX DEDUCTIBLE'
                    }
                ]);
            }
            setBoxStart(null);
            setBoxCurrent(null);
        }
    };

    const handleAddComment = () => {
        if (!pendingComment || !commentInput.trim()) return;
        setComments(prev => [
            ...prev,
            {
                id: `cmt_${Date.now()}`,
                text: commentInput.trim(),
                x: pendingComment.x,
                y: pendingComment.y,
                color: penColor
            }
        ]);
        setCommentInput('');
        setPendingComment(null);
    };

    const handleUndo = () => {
        if (drawings.length > 0) {
            setDrawings(prev => prev.slice(0, -1));
        } else if (highlightBoxes.length > 0) {
            setHighlightBoxes(prev => prev.slice(0, -1));
        } else if (stamps.length > 0) {
            setStamps(prev => prev.slice(0, -1));
        } else if (comments.length > 0) {
            setComments(prev => prev.slice(0, -1));
        }
    };

    const handleClearAll = () => {
        setDrawings([]);
        setHighlightBoxes([]);
        setStamps([]);
        setComments([]);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        onSaveMarkup(dataUrl);
    };

    return (
        <div className="flex flex-col rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xl">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-xl border border-amber-500/20 text-amber-400">
                        <Highlighter className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{receiptTitle}</h3>
                        <p className="text-[10px] font-mono text-[#0F172A]">Draw, highlight tax lines, or stamp compliance approval</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Tool Pickers */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                        <button
                            type="button"
                            onClick={() => setTool('highlighter')}
                            className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                tool === 'highlighter' ? 'bg-amber-500 text-slate-950' : 'text-[#0F172A] hover:text-white'
                            }`}
                            title="Highlight specific text/amounts"
                        >
                            <Highlighter className="w-4 h-4" />
                            <span>Highlighter</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTool('box')}
                            className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                tool === 'box' ? 'bg-amber-500 text-slate-950' : 'text-[#0F172A] hover:text-white'
                            }`}
                            title="Draw Tax Highlight Box"
                        >
                            <Square className="w-4 h-4" />
                            <span>Tax Box</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTool('pen')}
                            className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                tool === 'pen' ? 'bg-amber-500 text-slate-950' : 'text-[#0F172A] hover:text-white'
                            }`}
                            title="Draw ink notes"
                        >
                            <Pencil className="w-4 h-4" />
                            <span>Pen</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTool('stamp')}
                            className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                tool === 'stamp' ? 'bg-amber-500 text-slate-950' : 'text-[#0F172A] hover:text-white'
                            }`}
                            title="Add Tax Compliance Stamp"
                        >
                            <Stamp className="w-4 h-4" />
                            <span>Audit Stamp</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTool('text')}
                            className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                tool === 'text' ? 'bg-amber-500 text-slate-950' : 'text-[#0F172A] hover:text-white'
                            }`}
                            title="Type audit comment"
                        >
                            <Type className="w-4 h-4" />
                            <span>Note</span>
                        </button>
                    </div>

                    {/* Color Swatches */}
                    {tool === 'highlighter' && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200">
                            {[
                                { name: 'Yellow', value: '#facc15' },
                                { name: 'Green', value: '#4ade80' },
                                { name: 'Orange', value: '#fb923c' },
                                { name: 'Cyan', value: '#38bdf8' }
                            ].map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                                        color === c.value ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    )}

                    {tool === 'stamp' && (
                        <select
                            value={stampType}
                            onChange={(e) => setStampType(e.target.value as any)}
                            className="bg-slate-100 text-white text-xs border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-bold"
                        >
                            <option value="TAX_AUDIT">TAX AUDIT COMPLIANT</option>
                            <option value="APPROVED">AUDIT APPROVED</option>
                            <option value="DEDUCTION_VERIFIED">DEDUCTION VERIFIED</option>
                        </select>
                    )}

                    {/* Actions */}
                    <button
                        type="button"
                        onClick={handleUndo}
                        className="p-2 text-[#0F172A] hover:text-white bg-slate-100 rounded-xl border border-slate-200"
                        title="Undo Last Markup"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="p-2 text-[#0F172A] hover:text-red-400 bg-slate-100 rounded-xl border border-slate-200"
                        title="Clear All Markups"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Markup</span>
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-[#0F172A] hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas Stage */}
            <div ref={containerRef} className="relative w-full flex justify-center items-center p-4 bg-slate-100 overflow-auto min-h-[500px]">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={750}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="cursor-crosshair rounded-2xl border border-slate-200 shadow-2xl max-w-full h-auto"
                />

                {/* Comment Input Modal Overlay */}
                {pendingComment && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 border border-slate-300 p-4 rounded-2xl shadow-2xl w-80 z-20 space-y-3 dark:bg-slate-900">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400">Add Audit Annotation</span>
                            <button onClick={() => setPendingComment(null)} className="text-[#0F172A] hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="e.g. Schedule C Line 24B deduction..."
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                        />
                        <button
                            onClick={handleAddComment}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl"
                        >
                            Place Annotation
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Notice */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-[#0F172A] font-mono dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Markup changes produce a high-fidelity tax audit snapshot.</span>
                </div>
                <span>Mode: {tool.toUpperCase()}</span>
            </div>
        </div>
    );
};
