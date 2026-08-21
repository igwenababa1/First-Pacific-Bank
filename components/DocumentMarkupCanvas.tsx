import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Undo2, Type, Paintbrush, Eraser, RotateCcw, HelpCircle } from 'lucide-react';
import { generateOfficialSealDataUrl } from './DocumentViewer';

interface DocumentMarkupCanvasProps {
    authFormData: {
        beneficiaryName: string;
        amount: string;
        regulatoryExemption: string;
        signeeOfficer: string;
        routingSpeed: string;
    };
    userSignatureDataUrl?: string | null;
    onMarkupSave: (dataUrl: string | null) => void;
}

interface StrokePath {
    points: { x: number; y: number }[];
    color: string;
    width: number;
    isHighlighter: boolean;
}

interface TextComment {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
}

export const DocumentMarkupCanvas: React.FC<DocumentMarkupCanvasProps> = ({
    authFormData,
    userSignatureDataUrl,
    onMarkupSave
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [tool, setTool] = useState<'pen' | 'highlighter' | 'text'>('pen');
    const [color, setColor] = useState<string>('#1e40af'); // blue ink standard
    const [width, setWidth] = useState<number>(3);
    const [drawings, setDrawings] = useState<StrokePath[]>([]);
    const [drawingHistory, setDrawingHistory] = useState<StrokePath[][]>([]);
    const [comments, setComments] = useState<TextComment[]>([]);
    const [commentColor, setCommentColor] = useState<string>('#dc2626'); // red alerts
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Coordinate spot clicked when typing comments
    const [pendingComment, setPendingComment] = useState<{
        canvasX: number;
        canvasY: number;
        percentX: number;
        percentY: number;
    } | null>(null);

    // Helpers to wrap text elegantly on canvas paper
    const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
    ): number => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY;
    };

    // Main comprehensive board state redrawing engine
    const renderAllToCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Warm textured paper background
        ctx.fillStyle = '#fffdf7';
        ctx.fillRect(0, 0, w, h);

        // 2. Classy official double gold and dark thin borders
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, w - 30, h - 30);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(21, 21, w - 42, h - 42);

        // 3. Central watermark official seal background
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 220, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Elegant Letterhead Typography
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Times New Roman", Times, Georgia, serif';
        ctx.fillText('FIRST PACIFIC GLOBAL PRIVATE BANK', w / 2, 80);
        
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('OFFICIAL TREASURY EXECUTIVE CLEARANCE DECK | SWITZERLAND & NEW YORK HUBS', w / 2, 106);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(40, 122);
        ctx.lineTo(w - 40, 122);
        ctx.stroke();

        // 5. Letter Metadata Checklist
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('OFFICIAL SWIFT TRANSMISSION RELEASE DEED AUTHORIZATION', 45, 154);

        ctx.font = '11px "Times New Roman", Georgia, serif';
        ctx.fillStyle = '#475569';
        const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        ctx.fillText(`Date of Ledger Release: ${todayStr}`, 45, 185);
        ctx.fillText(`Cleared Capital Envelope: $${authFormData.amount} USD Equivalent`, 45, 203);
        ctx.fillText(`Swift Core Speed Metric: ${authFormData.routingSpeed}`, 45, 221);
        ctx.fillText(`Regulatory Exemption Basis: ${authFormData.regulatoryExemption}`, 45, 239);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(40, 260);
        ctx.lineTo(w - 40, 260);
        ctx.stroke();

        // 6. Letter Paragraph Text Body (Formal Legal Verbiage)
        ctx.fillStyle = '#1e293b';
        ctx.font = '13.5px "Times New Roman", Times, serif';

        const letterText = `To whom it may concern,

This formal compliance directive serves as absolute signature verification that the First Pacific Sovereign Clearing Node has reviewed and authorized a secure credit/debit allocation amounting to $${authFormData.amount} USD.

The transaction is prefunded and cleared of all global escrow holds, specifically satisfying the framework rules set forth under the ${authFormData.regulatoryExemption}. First Pacific Private Banking Desk hereby guarantees funds availability and instructs immediate direct correspondent routing to the designated beneficiary: ${authFormData.beneficiaryName || 'N/A'} without further operational halts or institutional restrictions.

All regulatory clearance flags have been resolved internally by our underwriting trustees, and we request that all clearing networks (including SWIFT, ACH, and Fedwire) finalize this credit ledger entry immediately.`;

        const pX = 50;
        let pY = 295;
        const pMaxWidth = w - 100;
        const pLineHeight = 22;

        const paragraphs = letterText.split('\n\n');
        paragraphs.forEach(p => {
            pY = wrapText(ctx, p, pX, pY, pMaxWidth, pLineHeight);
            pY += pLineHeight * 1.5;
        });

        // 7. Signature area & representative at bottom
        const endY = 760;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(40, endY - 20);
        ctx.lineTo(w - 40, endY - 20);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('EXECUTIVE RISK UNDERWRITER SIGNATORY', 45, endY + 15);
        
        if (userSignatureDataUrl) {
            const sigImg = new Image();
            sigImg.src = userSignatureDataUrl;
            if (sigImg.complete) {
                ctx.drawImage(sigImg, 45, endY + 22, 140, 45);
            } else {
                sigImg.onload = () => {
                    ctx.drawImage(sigImg, 45, endY + 22, 140, 45);
                    drawCustomElements(ctx);
                };
            }
        } else {
            ctx.fillStyle = '#1e3b8b';
            ctx.font = 'italic 18px Georgia, serif';
            ctx.fillText(authFormData.signeeOfficer, 45, endY + 45);
        }

        ctx.fillStyle = '#64748b';
        ctx.font = '10.5px "Times New Roman", Georgia, serif';
        ctx.fillText(`${authFormData.signeeOfficer}, Chief Settlement Trustee`, 45, endY + 65);
        ctx.fillText('First Pacific Treasury Solvency Desk, NY Head Office', 45, endY + 80);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`AUTHENTICATED BY IMMUTABLE CRYPTO KEY: [FPB-SEC-AUTH-${authFormData.regulatoryExemption.split(' ').pop() || 'A78B'}]`, 45, h - 55);

        // Stamp seal render bottom right
        const sealUrl = generateOfficialSealDataUrl();
        if (sealUrl) {
            const sealImg = new Image();
            sealImg.src = sealUrl;
            sealImg.onload = () => {
                // To avoid drawing conflict on async load, draw base layer under review if active
                ctx.drawImage(sealImg, w - 190, endY - 5, 135, 135);
                // Also redraw all strokes and comments right after so seal is overlayed properly
                drawCustomElements(ctx);
            };
            if (sealImg.complete) {
                ctx.drawImage(sealImg, w - 190, endY - 5, 135, 135);
            }
        }

        drawCustomElements(ctx);
    }, [authFormData, drawings, comments]);

    // Sub-routine to overlay all user-created strokes, highlights, and texts
    const drawCustomElements = (ctx: CanvasRenderingContext2D) => {
        // Render fluorescent highlights first so text/pen is legible on top
        drawings.forEach(path => {
            if (path.points.length < 1) return;
            ctx.save();
            if (path.isHighlighter) {
                ctx.strokeStyle = path.color;
                ctx.globalAlpha = 0.42;
                ctx.lineWidth = path.width * 4; // highlighters are broader
                ctx.lineCap = 'butt'; // clean highlights block
                ctx.lineJoin = 'miter';
            } else {
                ctx.strokeStyle = path.color;
                ctx.lineWidth = path.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }

            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x, path.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
        });

        // Render annotations comments
        comments.forEach(comm => {
            ctx.save();
            ctx.font = 'bold 12px "Courier New", Courier, monospace';
            ctx.fillStyle = comm.color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Draw audit marker flag background
            ctx.fillStyle = comm.color;
            ctx.beginPath();
            ctx.arc(comm.x - 10, comm.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillText(comm.text.toUpperCase(), comm.x, comm.y);
            ctx.restore();
        });
    };

    // Side-effects to redraw canvas on form or content modifications
    useEffect(() => {
        renderAllToCanvas();
    }, [renderAllToCanvas]);

    // Side-effect callback to parent component with full composite PNG data url
    useEffect(() => {
        const timer = setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                // Save out high fidelity composite state
                onMarkupSave(canvas.toDataURL('image/png'));
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [drawings, comments, renderAllToCanvas, onMarkupSave]);

    // Interactive coordinate retrieval helpers mapped to canvas scale
    const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: ((clientX - rect.left) / rect.width) * canvas.width,
            y: ((clientY - rect.top) / rect.height) * canvas.height
        };
    };

    // Coordinate handler triggers
    const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const pos = getPos(e);

        if (tool === 'text') {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            let screenX = 0;
            let screenY = 0;

            if ('touches' in e) {
                screenX = e.touches[0].clientX - rect.left;
                screenY = e.touches[0].clientY - rect.top;
            } else {
                screenX = e.clientX - rect.left;
                screenY = e.clientY - rect.top;
            }

            setPendingComment({
                canvasX: pos.x,
                canvasY: pos.y,
                percentX: (screenX / rect.width) * 100,
                percentY: (screenY / rect.height) * 100
            });
            return;
        }

        setIsDrawing(true);
        // Save current drawings array in history list for undoing
        setDrawingHistory(prev => [...prev, drawings]);

        const isHigh = tool === 'highlighter';
        const strokeColor = isHigh ? (color === '#1e40af' ? '#fbbf24' : color) : color; // Yellow default for highlights
        const strokeWidth = isHigh ? 12 : width;

        const newPath: StrokePath = {
            points: [pos],
            color: strokeColor,
            width: strokeWidth,
            isHighlighter: isHigh
        };

        setDrawings(prev => [...prev, newPath]);
    };

    const handleDrawingMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);

        setDrawings(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const active = { ...updated[updated.length - 1] };
            active.points = [...active.points, pos];
            updated[updated.length - 1] = active;
            return updated;
        });
    };

    const handleEndDraw = () => {
        setIsDrawing(false);
    };

    const handleAddComment = (text: string) => {
        if (!pendingComment || !text.trim()) {
            setPendingComment(null);
            return;
        }

        const newComment: TextComment = {
            id: `comm_${Date.now()}`,
            text: text.trim(),
            x: pendingComment.canvasX,
            y: pendingComment.canvasY,
            color: commentColor
        };

        setComments(prev => [...prev, newComment]);
        setPendingComment(null);
    };

    const handleUndo = () => {
        if (drawingHistory.length > 0) {
            const previous = drawingHistory[drawingHistory.length - 1];
            setDrawings(previous);
            setDrawingHistory(prev => prev.slice(0, -1));
        } else {
            setDrawings([]);
        }
    };

    const handleClearEverything = () => {
        setDrawingHistory(prev => [...prev, drawings]);
        setDrawings([]);
        setComments([]);
        onMarkupSave(null);
    };

    return (
        <div className="space-y-4 w-full">
            
            {/* Elegant Annotation/Markup Tools deck bar */}
            <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl select-none z-10 relative dark:bg-slate-900">
                
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono">
                        MARKUP SUITE:
                    </span>
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-black/5">
                        <button
                            type="button"
                            onClick={() => setTool('pen')}
                            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                                tool === 'pen' 
                                    ? 'bg-blue-600 text-white border border-blue-500/50' 
                                    : 'text-[#0F172A] hover:text-white hover:bg-white'
                            }`}
                            title="Fine Ink Pen"
                        >
                            <Paintbrush className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setTool('highlighter')}
                            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                                tool === 'highlighter' 
                                    ? 'bg-amber-600 text-amber-400 border border-amber-500/50' 
                                    : 'text-[#0F172A] hover:text-white hover:bg-white'
                            }`}
                            title="Fluorescent Highlighter"
                        >
                            <Eraser className="w-4 h-4" /> {/* Semantic Highlighter icon */}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTool('text')}
                            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                                tool === 'text' 
                                    ? 'bg-emerald-600 text-emerald-400 border border-emerald-500/50' 
                                    : 'text-[#0F172A] hover:text-white hover:bg-white'
                            }`}
                            title="Add Audit Text Flag"
                        >
                            <Type className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Color selection depending on current active tool */}
                    {tool !== 'text' ? (
                        <div className="flex items-center gap-1.5">
                            {(tool === 'highlighter' 
                                ? ['#fbbf24', '#22c55e', '#06b6d4'] 
                                : ['#1e40af', '#dc2626', '#16a34a', '#0f172a']
                            ).map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-5 h-5 rounded-full border transition-transform ${
                                        color === c ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {['#dc2626', '#2563eb', '#ca8a04'].map(tc => (
                                <button
                                    key={tc}
                                    type="button"
                                    onClick={() => setCommentColor(tc)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                                        commentColor === tc ? 'ring-2 ring-white/50 scale-110' : 'opacity-60'
                                    }`}
                                    style={{ backgroundColor: tc }}
                                >
                                    <span className="text-[8px] text-white font-black font-mono">T</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Stroke width selector if drawing with pen */}
                    {tool === 'pen' && (
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#0F172A] font-bold uppercase font-mono">Size</span>
                            <input
                                type="range"
                                min="1"
                                max="8"
                                value={width}
                                onChange={e => setWidth(Number(e.target.value))}
                                className="w-14 accent-blue-500"
                            />
                        </div>
                    )}

                    <div className="h-4 w-px bg-white dark:bg-slate-800" />

                    {/* Operational Actions */}
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={handleUndo}
                            className="p-2 bg-slate-100 text-[#0F172A] hover:text-white hover:bg-white rounded-lg border border-black/5 transition-all text-xs dark:bg-slate-800"
                            title="Undo Stroke"
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearEverything}
                            className="p-2 bg-slate-100 text-[#0F172A] hover:text-red-400 hover:bg-red-950 rounded-lg border border-black/5 transition-all text-xs flex items-center gap-1"
                            title="Wipe Worksheet"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-black uppercase font-mono hidden sm:inline">Reset</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Instruction tooltip badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 border border-black/5 rounded-xl text-[10px] text-[#0F172A] font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>
                    {tool === 'pen' && "Draw freely with ink to stamp markers, checkmarks or manual review signatures."}
                    {tool === 'highlighter' && "Brush semitransparent yellow/green/blue markers to highlight critical terms."}
                    {tool === 'text' && "Click anywhere on the document deed surface to position an authoritative comment tag."}
                </span>
            </div>

            {/* Document layout canvas card (Aspect ratio matching standard document page) */}
            <div 
                ref={containerRef}
                className="relative w-full overflow-hidden select-none bg-slate-100 p-2 rounded-3xl border border-black/5 focus:outline-none"
            >
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={1130}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDrawingMove}
                    onMouseUp={handleEndDraw}
                    onMouseLeave={handleEndDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDrawingMove}
                    onTouchEnd={handleEndDraw}
                    className="w-full h-auto aspect-[1/1.413] rounded-2xl bg-white shadow-2xl cursor-crosshair border border-slate-200 dark:bg-slate-800"
                />

                {/* Absolutes comments typing prompt overlay */}
                {pendingComment && (
                    <div 
                        className="absolute z-50 flex items-center bg-slate-50 border border-[#ca8a04] rounded-xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-in dark:bg-slate-900"
                        style={{ 
                            left: `calc(${pendingComment.percentX}% - 14px)`, 
                            top: `calc(${pendingComment.percentY}% - 14px)` 
                        }}
                    >
                        <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0 animate-ping" style={{ backgroundColor: commentColor }} />
                        <input
                            type="text"
                            placeholder="Type comment remarks..."
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleAddComment(e.currentTarget.value);
                                }
                            }}
                            className="px-2 py-1.5 text-xs bg-slate-100 border border-slate-850 rounded-lg text-white font-mono placeholder:text-slate-650 focus:outline-none focus:border-amber-500 w-44"
                        />
                        <button
                            type="button"
                            onClick={() => setPendingComment(null)}
                            className="ml-2.5 p-1 text-[#0F172A] hover:text-white hover:bg-white rounded text-[10px] dark:bg-slate-800"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* List of comment flags rendered as miniature floating badges on hover */}
                {comments.length > 0 && (
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 max-w-[150px]">
                        {comments.map((c, idx) => (
                            <div key={c.id} className="bg-slate-100 border border-black/5 rounded-lg px-2 py-1 text-[8px] font-mono text-[#0F172A] truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                <span>Note #{idx + 1}: {c.text}</span>
                                <button
                                    type="button"
                                    onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))}
                                    className="ml-auto text-red-400 hover:text-red-300 font-bold"
                                    title="Delete markup comment"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};
