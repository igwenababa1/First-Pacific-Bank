import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    AppleIcon, AppleWalletIcon, BarcodeIcon, CheckCircleIcon,
    ShieldCheckIcon, SparklesIcon, GiftIcon, LockClosedIcon,
    ArrowRightIcon, PrinterIcon
} from './Icons';
import { useCurrency } from '../contexts/CurrencyContext';

export type CardType = 'unified' | 'classic' | 'gold';

interface PhysicalGiftCardProps {
    type: CardType;
    amount: string;
    isFlipped: boolean;
    onFlip: () => void;
    revealedCode?: string;
    isPurchased?: boolean;
    onScratchComplete?: () => void;
}

export const PhysicalGiftCard: React.FC<PhysicalGiftCardProps> = ({
    type,
    amount,
    isFlipped,
    onFlip,
    revealedCode = 'APPL-9827-X109-2814',
    isPurchased = false,
    onScratchComplete
}) => {
    const { formatCurrency } = useCurrency();
    const [scratchedPercent, setScratchedPercent] = useState(0);
    const [isFullyRevealed, setIsFullyRevealed] = useState(false);
    const [scratchPoints, setScratchPoints] = useState<boolean[]>(Array(24).fill(false));

    const handleScratchPoint = (index: number) => {
        if (!isPurchased || isFullyRevealed) return;
        const newPoints = [...scratchPoints];
        newPoints[index] = true;
        setScratchPoints(newPoints);

        const activeCount = newPoints.filter(p => p).length;
        const progress = Math.round((activeCount / newPoints.length) * 100);
        setScratchedPercent(progress);

        if (progress >= 60 && !isFullyRevealed) {
            setIsFullyRevealed(true);
            if (onScratchComplete) onScratchComplete();
        }
    };

    const triggerFullReveal = () => {
        if (!isPurchased || isFullyRevealed) return;
        setScratchPoints(Array(24).fill(true));
        setScratchedPercent(100);
        setIsFullyRevealed(true);
        if (onScratchComplete) onScratchComplete();
    };

    // Design styles based on card type
    const cardDesigns = {
        unified: {
            frontBg: 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-xl',
            glossy: 'bg-gradient-to-tr from-white/30 via-zinc-100/10 to-transparent',
            logoGlow: 'shadow-[0_0_50px_rgba(255,100,100,0.2)]',
            appleLogoColor: 'bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-500',
            labelColor: 'text-zinc-500',
            badgeBg: 'bg-zinc-100 text-zinc-800'
        },
        classic: {
            frontBg: 'bg-gradient-to-br from-indigo-950 primary- to-slate-950 primary- text-white shadow-[0_20px_50px_rgba(30,58,138,0.3)]',
            glossy: 'bg-gradient-to-tr primary- via-indigo-500/5 to-transparent',
            logoGlow: 'shadow-[0_0_40px_rgba(59,130,246,0.35)]',
            appleLogoColor: 'bg-white',
            labelColor: 'primary-',
            badgeBg: 'primary- primary- border primary-'
        },
        gold: {
            frontBg: 'bg-gradient-to-br from-yellow-950 via-zinc-900 to-amber-950 border-yellow-500/30 text-white shadow-[0_20px_50px_rgba(180,83,9,0.2)]',
            glossy: 'bg-gradient-to-tr from-yellow-500/10 via-amber-500/5 to-transparent',
            logoGlow: 'shadow-[0_0_45px_rgba(245,158,11,0.25)]',
            appleLogoColor: 'bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-600',
            labelColor: 'text-amber-300/80',
            badgeBg: 'bg-amber-950 text-amber-300 border border-amber-500/30'
        }
    };

    const design = cardDesigns[type];

    return (
        <div className="w-full flex flex-col items-center gap-4">
            {/* Real Card 3D container */}
            <div className="relative w-full max-w-[420px] aspect-[1.586/1] perspective-1000 group transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] rounded-2xl">
                <motion.div
                    className="w-full h-full relative duration-1000 transform-style-3d cursor-pointer"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                >
                    {/* CARD FRONT */}
                    <div className={`absolute inset-0 w-full h-full rounded-2xl p-6 border flex flex-col justify-between backface-hidden overflow-hidden ${design.frontBg}`}>
                        {/* Reflective Glossy Overlay */}
                        <div className={`absolute inset-0 z-0 pointer-events-none ${design.glossy}`} />
                        
                        {/* Dynamic Radial Laser Lines */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-70" />

                        {/* Top Header */}
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="font-semibold tracking-wider text-xs uppercase opacity-80">Apple Gift Card</span>
                                <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${design.labelColor}`}>
                                    {type === 'unified' ? 'Everything Apple' : type === 'classic' ? 'App Store & iTunes' : 'Special Golden Edition'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono font-black text-3xl tracking-tight">${amount}</span>
                                {type === 'unified' && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-black mt-1">NEW UNIFIED</span>}
                                {type === 'classic' && <span className="text-[8px] primary- primary- px-1.5 py-0.5 rounded-full font-black mt-1">CLASSIC BLUE</span>}
                                {type === 'gold' && <span className="text-[8px] bg-amber-100 text-amber-300 px-1.5 py-0.5 rounded-full font-black mt-1">GOLD EDITION</span>}
                            </div>
                        </div>

                        {/* Centered Dimensional Logo */}
                        <div className="relative z-10 flex justify-center items-center py-2">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-transform duration-500 group-hover:scale-110 ${design.logoGlow}`}>
                                {type === 'unified' ? (
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 relative shadow-lg overflow-hidden`}>
                                        <AppleIcon className="w-10 h-10 text-white drop-shadow-md" />
                                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
                                    </div>
                                ) : (
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-transparent border-2 border-slate-200 dark:border-white/25`}>
                                        <AppleIcon className={`w-10 h-10 ${type === 'classic' ? 'text-white' : 'text-amber-400'}`} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Footer Details */}
                        <div className="relative z-10 flex justify-between items-end border-t border-slate-500/10 pt-3">
                            <div className="flex gap-2.5">
                                <div className="w-9 h-7 rounded bg-white  border border-slate-200 dark:border-black/10 flex items-center justify-center dark:bg-slate-800">
                                    <SparklesIcon className="w-5 h-5 opacity-80" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[8px] uppercase tracking-widest opacity-60">Usage Policy</p>
                                    <p className="text-[10px] font-bold">100% Redeemable Online</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md ${design.badgeBg}`}>
                                    {type === 'unified' ? 'Products & Store' : 'Digital Services'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CARD BACK */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-zinc-950 border border-zinc-800 text-white flex flex-col justify-between backface-hidden rotate-y-180 overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-950 to-zinc-900 opacity-90" />
                        
                        {/* Magnetic Stripe / Black Bar */}
                        <div className="absolute top-4 left-0 w-full h-8 bg-zinc-900 border-y border-zinc-800" />

                        {/* Card Back Info */}
                        <div className="relative z-10 mt-10 text-[8px] text-zinc-400 leading-normal text-left space-y-1 bg-slate-100 p-2.5 rounded-lg border border-zinc-800">
                            <p className="font-extrabold text-[9px] text-white uppercase tracking-wider">Instructions for Redemption</p>
                            <p>For App Store & iTunes: Redeemable on iTunes Store, App Store, Apple Books, or Apple TV. For digital entertainment only.</p>
                            <p>For Unified Card: Can also be used directly on Apple.com, in the Apple Store App, or at physical Apple Store locations.</p>
                            <p className="text-[7px] text-zinc-500">APPL-DECAL No fee. No expiration. Non-refundable. Terms apply. Serial AP61073-206.</p>
                        </div>

                        {/* SCRATCH-OFF FIELD OR CODE FIELD */}
                        <div className="relative z-10 py-1">
                            {!isPurchased ? (
                                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black flex items-center justify-center gap-1.5 animate-pulse">
                                        <LockClosedIcon className="w-3.5 h-3.5 text-indigo-400" /> Unlock Upon Purchase Process
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                                    
                                    {!isFullyRevealed && (
                                        <div className="absolute inset-0 bg-slate-50 z-10 flex flex-col items-center justify-center select-none overflow-hidden rounded-xl dark:bg-slate-900">
                                            {/* Grid of scratch bubbles targeting simulation */}
                                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 p-1 opacity-90 gap-0.5">
                                                {scratchPoints.map((scratched, index) => (
                                                    <div
                                                        key={index}
                                                        onMouseEnter={() => handleScratchPoint(index)}
                                                        onTouchStart={() => handleScratchPoint(index)}
                                                        className={`w-full h-full transition-colors duration-200 cursor-crosshair rounded ${
                                                            scratched ? 'bg-transparent' : 'bg-gradient-to-b from-zinc-400 to-zinc-500 border border-zinc-500/20 shadow-inner'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="relative z-20 pointer-events-none text-center">
                                                <p className="text-[9px] font-black text-slate-100 uppercase tracking-[0.2em] shadow-sm drop-shadow-md">Hover/Swipe to Scratch</p>
                                                <button onClick={triggerFullReveal} className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto text-[7px] bg-white hover:bg-white active:scale-95 text-white border border-slate-200 dark:border-black/10 px-2 py-0.5 rounded uppercase font-bold tracking-widest shadow transition-all dark:bg-slate-800">
                                                    By-Pass Scratch
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Revealed Code Area */}
                                    <div className="flex flex-col items-center justify-center py-1">
                                        <p className="text-[7.5px] font-extrabold text-indigo-400 uppercase tracking-[0.25em] mb-1">REDEEMABLE SECURITY PIN</p>
                                        <p className="font-mono text-base md:text-lg font-black tracking-[0.2em] text-white text-emerald-400 select-all cursor-copy">
                                            {revealedCode}
                                        </p>
                                        <span className="text-[6.5px] text-zinc-500 uppercase tracking-widest mt-0.5">Click to highlight and copy code</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Barcode Area */}
                        <div className="relative z-10 flex justify-between items-center border-t border-zinc-800 pt-3">
                            <div className="flex flex-col items-start gap-0.5 opacity-80">
                                <BarcodeIcon className="w-28 h-6 text-white text-zinc-200" />
                                <span className="font-mono text-[7px] text-zinc-650 mt-0.5">*(AP927492810476201)*</span>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <AppleIcon className="w-5 h-5 text-white/40" />
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[6.5px] text-zinc-400">Secure Issuer Token</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Hint message under Card */}
            <p className="text-[11px] text-[#0F172A] dark:text-zinc-400 font-bold tracking-wide uppercase flex items-center gap-1.5 mt-1">
                <GiftIcon className="w-3.5 h-3.5" />
                <span>Click Card Face to flip FRONT & BACK</span>
            </p>
        </div>
    );
};

/* Real card feature support checklist dynamically rendered */
export const CardUsageAdvisor: React.FC = () => {
    const categories = [
        { name: 'Apple Hardware (Mac, iPhone, Accessories)', unified: true, classic: false, gold: true },
        { name: 'App Store (In-App Purchases, Apps, Games)', unified: true, classic: true, gold: true },
        { name: 'Apple Music, Arcade, TV+ Subscriptions', unified: true, classic: true, gold: true },
        { name: 'iCloud+ Monthly Storage Upgrades', unified: true, classic: true, gold: true },
        { name: 'Physical Apple Retail Stores Checkouts', unified: true, classic: false, gold: true },
        { name: 'Online Apple.com Official Store Web checkout', unified: true, classic: false, gold: true },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl text-left">
            <h4 className="text-base font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-400" /> Card Purchase Advisor (Avoid Mistakes!)
            </h4>
            <p className="text-[#0F172A] dark:text-zinc-400 text-xs mb-5">
                Ensure you are purchasing the exact card style compatible with your needs. Classic cards are restricted to digital services only, whereas Unified cards support hardware purchases.
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 pb-2 text-[#0F172A] dark:text-zinc-500 uppercase font-black text-[10px] tracking-wider">
                            <th className="py-2 text-left">Usage / Redeem Destination</th>
                            <th className="py-2 text-center text-rose-400 bg-rose-500 rounded-t-xl px-2">Unified Apple Card</th>
                            <th className="py-2 text-center primary- primary- rounded-t-xl px-2">Classic App Store Card</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {categories.map((cat, i) => (
                            <tr key={i} className="hover:bg-slate-100 dark:hover:bg-white transition-colors dark:bg-slate-800">
                                <td className="py-3 font-bold text-[#0F172A] dark:text-zinc-300">{cat.name}</td>
                                <td className="py-3 text-center bg-rose-500">
                                    {cat.unified ? (
                                        <span className="text-emerald-400 font-bold">✓ YES</span>
                                    ) : (
                                        <span className="text-rose-500 font-bold">✗ NO</span>
                                    )}
                                </td>
                                <td className="py-3 text-center primary-">
                                    {cat.classic ? (
                                        <span className="text-emerald-400 font-bold">✓ YES</span>
                                    ) : (
                                        <span className="text-rose-500 font-bold">✗ NO</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-5 p-3.5 bg-yellow-500 border border-yellow-500/20 rounded-2xl flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                    <h5 className="text-[11px] font-black uppercase text-yellow-600 dark:text-yellow-400 tracking-wider mb-0.5">Premium Tip from Credit Union Advisors</h5>
                    <p className="text-[10px] text-[#0F172A] dark:text-yellow-400/80 leading-relaxed">
                        If you are gifting this card to a friend or relative, we heavily recommend selecting the <strong>Unified Apple Gift Card</strong>. It works for all software, media, services, as well as hardware, making it impossible to make a gifting mistake!
                    </p>
                </div>
            </div>
        </div>
    );
};

/* Interactive Fake Apple Wallet Pass Component */
interface WalletPassModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: string;
    cardType: CardType;
    serialNumber?: string;
}

export const WalletPassModal: React.FC<WalletPassModalProps> = ({
    isOpen,
    onClose,
    amount,
    cardType,
    serialNumber = 'APPL-WAL-7281-PASS'
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 " onClick={onClose} />
                
                <motion.div
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 30, opacity: 0 }}
                    className="relative w-full max-w-[340px] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl z-10 text-white"
                >
                    {/* Header bar mimics iOS */}
                    <div className="bg-zinc-950 py-3.5 px-6 border-b border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <AppleWalletIcon className="w-5 h-5 text-indigo-400" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Add Wallet Pass</span>
                        </div>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white font-mono text-sm uppercase px-2 font-bold select-none cursor-pointer">
                            Close
                        </button>
                    </div>

                    {/* Official apple certificate background design style */}
                    <div className="p-6 relative text-center">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                        
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg border border-zinc-800 border-zinc-700 ${
                            cardType === 'unified' ? 'bg-zinc-100 text-black' : cardType === 'classic' ? 'bg-gradient-to-br from-indigo-900 primary-' : 'bg-gradient-to-br from-yellow-700 to-amber-900'
                        }`}>
                            <AppleIcon className="w-9 h-9" />
                        </div>

                        <h3 className="text-lg font-black tracking-tight text-white mt-4 uppercase">Apple Store Gift Card</h3>
                        <p className="text-[10px] uppercase text-zinc-500 tracking-wider mt-1 font-bold">Official Certified Digital Pass</p>

                        {/* Pass stats */}
                        <div className="grid grid-cols-2 gap-4 my-6 bg-slate-100 border border-zinc-800 rounded-2xl p-4 text-left">
                            <div>
                                <span className="text-[8px] uppercase text-zinc-500 tracking-widest block font-bold">Total Balance</span>
                                <span className="font-mono text-2xl font-black text-white">${amount}</span>
                            </div>
                            <div>
                                <span className="text-[8px] uppercase text-zinc-500 tracking-widest block font-bold">Issuer Authority</span>
                                <span className="text-[10px] font-bold text-indigo-300 block mt-1 uppercase">Prem Pacific CU</span>
                            </div>
                            <div className="col-span-2 border-t border-zinc-800 pt-3">
                                <span className="text-[8px] uppercase text-zinc-500 tracking-widest block font-bold border-zinc-800">Pass Identifier Token</span>
                                <span className="font-mono text-[9px] text-zinc-300 block mt-1 tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">{serialNumber}</span>
                            </div>
                        </div>

                        {/* Interactive iOS QR Code segment */}
                        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-4 border border-zinc-200 dark:bg-slate-800">
                            {/* Realistic SVG of Apple Pass QR scanner matrix */}
                            <svg className="w-32 h-32" viewBox="0 0 100 100" fill="black">
                                <rect width="10" height="10" x="0" y="0" />
                                <rect width="6" height="6" x="2" y="2" fill="white" />
                                <rect width="10" height="10" x="90" y="0" transform="translate(-10, 0)" />
                                <rect width="6" height="6" x="82" y="2" fill="white" />
                                <rect width="10" height="10" x="0" y="90" transform="translate(0, -10)" />
                                <rect width="6" height="6" x="2" y="82" fill="white" />
                                
                                <rect x="20" y="5" width="4" height="4" />
                                <rect x="35" y="10" width="8" height="4" />
                                <rect x="50" y="5" width="4" height="8" />
                                <rect x="65" y="15" width="4" height="4" />
                                <rect x="15" y="25" width="10" height="4" />
                                <rect x="30" y="30" width="4" height="12" />
                                <rect x="45" y="25" width="12" height="4" />
                                <rect x="70" y="25" width="4" height="8" />
                                <rect x="5" y="45" width="8" height="4" />
                                <rect x="20" y="50" width="4" height="8" />
                                <rect x="40" y="45" width="12" height="4" />
                                <rect x="60" y="50" width="8" height="4" />
                                <rect x="80" y="45" width="4" height="12" />
                                <rect x="15" y="65" width="6" height="4" />
                                <rect x="35" y="60" width="4" height="10" />
                                <rect x="55" y="65" width="12" height="4" />
                                <rect x="75" y="65" width="4" height="8" />
                                <rect x="25" y="75" width="8" height="4" />
                                <rect x="45" y="75" width="4" height="12" />
                                <rect x="65" y="80" width="10" height="4" />
                                <rect x="85" y="75" width="4" height="4" />
                            </svg>
                        </div>
                        <p className="text-[8px] uppercase text-zinc-500 tracking-widest font-black">Scan to Redeem Instantly at Apple POS Terminal</p>

                        <button 
                            onClick={onClose}
                            className="mt-6 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:scale-102 active:scale-98 text-white rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-[0_5px_20px_rgba(79,70,229,0.3)]"
                        >
                            Confirm Pass addition
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
