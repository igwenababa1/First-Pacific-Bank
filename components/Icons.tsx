
import React, { useState, useEffect } from 'react';
import { BANKS_BY_COUNTRY, SERVICES_CONFIG, UTILITY_BILLERS, AIRTIME_PROVIDERS } from './constants';
import {
  Menu, Bell, X, Search, ChevronRight, ChevronLeft, ChevronDown, ArrowRight, ArrowLeft,
  Plus, Minus, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Info, Lock, Eye, EyeOff,
  Settings, Trash2, Pencil, RefreshCw, ShieldCheck, FileCheck, FileText, UserCircle, Users, Building2,
  Landmark, CreditCard, Wallet, DollarSign, Globe, Activity, BarChart3, TrendingUp,
  ArrowUpCircle, ArrowDownCircle, PlusCircle, MapPin, Clock, Calendar, Mail, Phone,
  Smartphone, Monitor, QrCode, Fingerprint, ScanFace, Sparkles, Star, MessageSquare,
  ShoppingBag, Home, Server, CloudUpload, PiggyBank, Download, HelpCircle, ArrowRightLeft,
  ArrowUpRight, ArrowDownLeft, Loader2, LogOut, Camera, Wifi, Briefcase, GripHorizontal,
  Share2, Scale, Clipboard, Trophy, Zap, Network, BadgeCheck, Sun, Moon, LifeBuoy, Banknote,
  Lightbulb, Package, Tv, Satellite, Box, Ticket, Wrench, Puzzle, Heart, Layers, Code,
  Award, Truck, User, Map, List, Crosshair, Shield, Scan, Terminal, Filter,
  Gift, Leaf, Receipt, Paperclip, Flame, Flag, ThumbsUp, Cloud, CloudRain, CloudSnow, CloudLightning, Wind,
  ExternalLink, Link, Copy, Megaphone, Film
} from 'lucide-react';

// --- General UI Icons (Mapped to Lucide) ---
export const FilmIcon = Film;
export const MenuIcon = Menu;
export const BellIcon = Bell;
export const XIcon = X;
export const SearchIcon = Search;
export const ChevronRightIcon = ChevronRight;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronDownIcon = ChevronDown;
export const ArrowRightIcon = ArrowRight;
export const ArrowLeftIcon = ArrowLeft;
export const PlusIcon = Plus;
export const MinusIcon = Minus;
export const CheckCircleIcon = CheckCircle2;
export const XCircleIcon = XCircle;
export const ExclamationCircleIcon = AlertCircle;
export const ExclamationTriangleIcon = AlertTriangle;
export const AlertTriangleIcon = AlertTriangle;
export const InfoIcon = Info;
export const LockClosedIcon = Lock;
export const MegaphoneIcon = Megaphone;
export const EyeIcon = Eye;
export const EyeSlashIcon = EyeOff;
export const CogIcon = Settings;
export const TrashIcon = Trash2;
export const PencilIcon = Pencil;
export const ArrowPathIcon = RefreshCw;
export const ShieldCheckIcon = ShieldCheck;
export const DocumentCheckIcon = FileCheck;
export const DocumentTextIcon = FileText;
export const UserCircleIcon = UserCircle;
export const UsersIcon = Users;
export const BuildingOfficeIcon = Building2;
export const BankIcon = Landmark;
export const CreditCardIcon = CreditCard;
export const WalletIcon = Wallet;
export const CurrencyDollarIcon = DollarSign;
export const GlobeAmericasIcon = Globe;
export const ActivityIcon = Activity;
export const ChartBarIcon = BarChart3;
export const TrendingUpIcon = TrendingUp;
export const ArrowUpCircleIcon = ArrowUpCircle;
export const ArrowDownCircleIcon = ArrowDownCircle;
export const PlusCircleIcon = PlusCircle;
export const MapPinIcon = MapPin;
export const ClockIcon = Clock;
export const CalendarDaysIcon = Calendar;
export const EnvelopeIcon = Mail;
export const PhoneIcon = Phone;
export const DevicePhoneMobileIcon = Smartphone;
export const ComputerDesktopIcon = Monitor;
export const QrCodeIcon = QrCode;
export const FingerprintIcon = Fingerprint;
export const FaceIdIcon = ScanFace;
export const SparklesIcon = Sparkles;
export const StarIcon = Star;
export const ChatBubbleLeftRightIcon = MessageSquare;
export const MessageSquareIcon = MessageSquare;
export const ShoppingBagIcon = ShoppingBag;
export const HomeIcon = Home;
export const ServerIcon = Server;
export const CloudArrowUpIcon = CloudUpload;
export const PiggyBankIcon = PiggyBank;
export const ArrowDownTrayIcon = Download;
export const QuestionMarkCircleIcon = HelpCircle;
export const ArrowsRightLeftIcon = ArrowRightLeft;
export const WithdrawIcon = ArrowUpRight;
export const DepositIcon = ArrowDownLeft;
export const SpinnerIcon = Loader2;
export const LogoutIcon = LogOut;
export const CameraIcon = Camera;
export const WifiIcon = Wifi;
export const BriefcaseIcon = Briefcase;
export const KeypadIcon = GripHorizontal;
export const ShareIcon = Share2;
export const ScaleIcon = Scale;
export const ClipboardDocumentIcon = Clipboard;
export const LinkIcon = Link;
export const CopyIcon = Copy;
export const TrophyIcon = Trophy;
export const ZapIcon = Zap;
export const NetworkIcon = Network;
export const VerifiedBadgeIcon = BadgeCheck;
export const SunIcon = Sun;
export const MoonIcon = Moon;
export const LifebuoyIcon = LifeBuoy;
export const CashIcon = Banknote;
export const LightBulbIcon = Lightbulb;
export const LightningBoltIcon = Zap;
export const PackageIcon = Package;
export const TvIcon = Tv;
export const SatelliteDishIcon = Satellite;
export const CubeTransparentIcon = Box;
export const AirplaneTicketIcon = Ticket;
export const WrenchScrewdriverIcon = Wrench;
export const PuzzlePieceIcon = Puzzle;
export const HeartIcon = Heart;
export const LayersIcon = Layers;
export const CodeBracketIcon = Code;
export const CertificateIcon = Award;
export const ArrowLongRightIcon = ArrowRight;
export { Truck };
export { User };
export const MapIcon = Map;
export const ListBulletIcon = List;
export const CrosshairsIcon = Crosshair;
export const ReCaptchaIcon = Shield;
export const ViewfinderIcon = Scan;
export { Terminal };
export const FunnelIcon = Filter;
export const GiftIcon = Gift;
export const BoltIcon = Zap;
export const LeafIcon = Leaf;
export const ReceiptIcon = Receipt;
export const PaperClipIcon = Paperclip;
export const FlameIcon = Flame;
export const FlagIcon = Flag;
export const HandThumbUpIcon = ThumbsUp;
export { ExternalLink };

// Weather Icons
export const CloudIcon = Cloud;
export const CloudRainIcon = CloudRain;
export const CloudSnowIcon = CloudSnow;
export const CloudLightningIcon = CloudLightning;
export const WindIcon = Wind;

// --- Aliases for Backward Compatibility ---
export const UserGroupIcon = Users;
export const Cog8ToothIcon = Settings;
export const GlobeAltIcon = Globe;
export const RefreshCwIcon = RefreshCw;
export const MailIcon = Mail;
export const TransportIcon = Truck;
export const FoodDrinkIcon = CoffeeIcon;
export const EntertainmentIcon = Ticket;

// --- Helper Icons (Internal use only) ---
function CoffeeIcon({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="4" /><line x1="10" x2="10" y1="2" y2="4" /><line x1="14" x2="14" y1="2" y2="4" /></svg>;
}

export const SearchCode: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

// --- Custom / Brand Icons ---

export interface FirstPacificLogoProps {
    className?: string;
    variant?: 'premium' | 'standard' | 'modern';
    includeBackground?: boolean;
}

export const FirstPacificLogo = ({
    className = "w-10 h-10",
    variant = "premium",
    includeBackground = true
}: FirstPacificLogoProps) => {
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                {/* Royal Navy Blue background gradient */}
                <radialGradient id="navyBG" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="#0B1528" />
                    <stop offset="70%" stopColor="#060B16" />
                    <stop offset="100%" stopColor="#03060E" />
                </radialGradient>
                
                {/* Premium Gold gradients */}
                <linearGradient id="goldLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#BE9648" />
                    <stop offset="30%" stopColor="#F3E5AB" />
                    <stop offset="70%" stopColor="#9A7A35" />
                    <stop offset="100%" stopColor="#5E481D" />
                </linearGradient>
                <linearGradient id="goldRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF4D0" />
                    <stop offset="35%" stopColor="#D4AF37" />
                    <stop offset="70%" stopColor="#AA7C11" />
                    <stop offset="100%" stopColor="#896008" />
                </linearGradient>
                <linearGradient id="goldCore" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AA7C11" />
                    <stop offset="50%" stopColor="#FFF4D0" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
                <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F3E5AB" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#040814" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="waveGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AA7C11" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#FFF4D0" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#AA7C11" stopOpacity="0.1" />
                </linearGradient>
            </defs>

            {/* Optional luxury navy blue circular container with gold-glowing border */}
            {includeBackground && (
                <>
                    <circle cx="50" cy="50" r="48" fill="url(#navyBG)" stroke="url(#goldRight)" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="44" stroke="url(#goldLeft)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
                </>
            )}

            {/* --- PREMIUM VARIANT (Prestige global navigation layout) --- */}
            {variant === 'premium' && (
                <g>
                    {/* Compass starburst axis lines */}
                    <line x1="50" y1="15" x2="50" y2="85" stroke="url(#goldRight)" strokeWidth="0.5" opacity="0.35" />
                    <line x1="15" y1="50" x2="85" y2="50" stroke="url(#goldRight)" strokeWidth="0.5" opacity="0.35" />
                    
                    {/* Concentric Pacific orbital grid circles */}
                    <circle cx="50" cy="50" r="38" stroke="url(#goldLeft)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
                    <circle cx="50" cy="50" r="30" stroke="url(#goldRight)" strokeWidth="0.75" opacity="0.25" />
                    
                    {/* Left half facet */}
                    <path d="M50 20 L22 82 L50 67 Z" fill="url(#goldLeft)" />
                    {/* Right half facet */}
                    <path d="M50 20 L78 82 L50 67 Z" fill="url(#goldRight)" />
                    
                    {/* Spine highlight keel line */}
                    <path d="M50 20 L50 67" stroke="#FFF4D0" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
                    
                    {/* Starburst/apex core accent */}
                    <path d="M50 32 L53 38 L50 44 L47 38 Z" fill="url(#goldCore)" />
                    
                    {/* Subtle waves at the bottom (representing 'Pacific') */}
                    <path d="M28 78 Q39 74 50 78 T72 78" stroke="url(#waveGold)" strokeWidth="1.2" fill="none" opacity="0.5" />
                    <path d="M34 82 Q42 79 50 82 T66 82" stroke="url(#waveGold)" strokeWidth="0.8" fill="none" opacity="0.3" />
                </g>
            )}

            {/* --- STANDARD VARIANT (Clean 3D gold faceted chevron) --- */}
            {variant === 'standard' && (
                <g>
                    {/* Subtle backing glow */}
                    <circle cx="50" cy="50" r="28" fill="url(#goldGlow)" opacity="0.5" />
                    
                    {/* Simple, pristine faceted geometric design */}
                    <path d="M50 15 L20 85 L50 68 Z" fill="url(#goldLeft)" />
                    <path d="M50 15 L80 85 L50 68 Z" fill="url(#goldRight)" />
                    
                    {/* Center crease line */}
                    <line x1="50" y1="15" x2="50" y2="68" stroke="#FFEFA6" strokeWidth="1" opacity="0.4" />
                    
                    {/* Central diamond starburst */}
                    <path d="M50 30 L53.5 37 L50 44 L46.5 37 Z" fill="url(#goldCore)" />
                </g>
            )}

            {/* --- ULTRA-MODERN VARIANT (Sleek minimalist linear currents and waveforms) --- */}
            {variant === 'modern' && (
                <g>
                    {/* Modern geometric framing */}
                    <polygon points="50,14 83,72 50,62" stroke="url(#goldRight)" strokeWidth="1" opacity="0.2" fill="none" />
                    <polygon points="50,14 17,72 50,62" stroke="url(#goldLeft)" strokeWidth="1" opacity="0.2" fill="none" />
                    
                    {/* Tech wave lines underneath */}
                    <path d="M20 60 C30 52, 40 68, 50 60 C60 52, 70 68, 80 60" stroke="url(#waveGold)" strokeWidth="0.8" strokeDasharray="1 1" fill="none" opacity="0.5" />

                    {/* Minimalist modern gold chevron facets */}
                    <path d="M50 18 L24 78 L50 64 Z" fill="url(#goldLeft)" />
                    <path d="M50 18 L76 78 L50 64 Z" fill="url(#goldRight)" />
                    
                    {/* Pure vertical keel element with gold shine */}
                    <path d="M50 18 L50 64" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
                    
                    {/* Tech dot indicator in center clearance */}
                    <circle cx="50" cy="35" r="2.5" fill="#FFFFFF" />
                    <circle cx="50" cy="35" r="5" stroke="#FFF4D0" strokeWidth="0.5" opacity="0.8" />
                </g>
            )}
        </svg>
    );
};

// Alias for backward compatibility during refactor, but using new design
export const PremiumReservedBankLogo = FirstPacificLogo;

// Official Visa Brand Icon with Premium Gradient and Gold fold
export const VisaIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 16" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
            <linearGradient id="visaBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A1F71" />
                <stop offset="100%" stopColor="#0E124B" />
            </linearGradient>
            <linearGradient id="visaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBA00" />
                <stop offset="100%" stopColor="#D98100" />
            </linearGradient>
        </defs>
        <path d="M19.9 2.2L13.6 17.5h-4l2.4-10.7-4.1 10.7H3.6L0 2.2h4.2l2.3 8.3 0.1-0.2L8.9 2.2h3.5l-0.5 2.5 1.5 7.8 0.1-0.1 3.9-10.2h2.5z" fill="url(#visaBlueGrad)"/>
        <path d="M35.6 11.2c0.2 0.8 1.4 1.3 2.5 1.3 1.1 0 1.9-0.2 1.9-1 0-0.5-0.6-0.9-1.9-1.5 -2-0.9-3.2-2-3.2-3.7 0-1.9 1.9-3.9 5.3-3.9 2 0 3.3 0.5 3.8 0.7l-0.7 3.3c-0.6-0.3-1.6-0.8-3.1-0.8 -1.2 0-1.7 0.4-1.7 0.9 0 0.5 0.7 0.9 2.1 1.5 2 0.9 3.2 2.3 3.2 3.8 0 2.1-2.1 4-5.5 4 -2.3 0-3.9-0.6-4.4-0.9L35.6 11.2zM47.7 2.2h-3.4c-1 0-1.8 0.5-2.2 1.6l-6 13.7h4.3l0.8-2.3h5.3l0.5 2.3h3.8L47.7 2.2zM41.7 12.3l1.8-4.9 0.1-0.2 1 5.1H41.7z" fill="url(#visaBlueGrad)"/>
        <path d="M25.7 2.2l-3.3 15.3h4L29.7 2.2H25.7z" fill="url(#visaGoldGrad)"/>
    </svg>
);

// Official American Express Icon
export const AmexIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 36 20" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="amexBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B56A4" />
                <stop offset="50%" stopColor="#0172D2" />
                <stop offset="100%" stopColor="#004C99" />
            </linearGradient>
            <linearGradient id="amexGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F3E1C5"/>
                <stop offset="100%" stopColor="#CBB484"/>
            </linearGradient>
        </defs>
        <rect width="36" height="20" rx="3.5" fill="url(#amexBgGrad)" stroke="url(#amexGoldGrad)" strokeWidth="0.5"/>
        <rect x="1" y="1" width="34" height="18" rx="2.5" fill="none" stroke="#ffffff" strokeWidth="0.3" strokeOpacity="0.4"/>
        <path d="M3.5 14.5l0.8-2.3h2.1l0.8 2.3h1.4l-2.4-6.5H4.8l-2.4 6.5h1.1zm2.1-5.5l0.7 2.1H4.9l0.7-2.1zm8.3 5.5V8H11.7l1.3 3.3 1.3-3.3h-2.2v6.5h1.8zm5.5 0V8h-3v6.5h3zm-1.8-4.3h1.2V9h-1.2v1.2zm0 2.2h1.5v-1.1h-1.5v1.1zm9.2 2.1l1-1.6c.3-.5.5-.8.7-1.2-.2.3-.4.7-.6 1l-1 1.8h1.2l.6-1.1c.3-.6.6-1.1.9-1.7-.3.6-.6 1.1-.9 1.7l-.6 1.1h1.3l.9-1.8c.4-.7.7-1.4 1.1-2.2H31l-.9 1.7c-.4.7-.7 1.4-1.1 2.2H29l-.9-1.7-.9-1.7h1.4l.6 1.1z" fill="#ffffff" />
    </svg>
);

// Official Mastercard Brand Icon (Glossy Translucent Interlock style)
export const MastercardIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="mcRedGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EB001B"/>
                <stop offset="100%" stopColor="#B30010"/>
            </linearGradient>
            <linearGradient id="mcOrangeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F79E1B"/>
                <stop offset="100%" stopColor="#D98110"/>
            </linearGradient>
            <linearGradient id="mcYellowGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF5F00"/>
                <stop offset="100%" stopColor="#E04F00"/>
            </linearGradient>
        </defs>
        <circle cx="8" cy="8" r="7.5" fill="url(#mcRedGrad)"/>
        <circle cx="16" cy="8" r="7.5" fill="url(#mcOrangeGrad)"/>
        <path d="M 12 2.17 A 7.5 7.5 0 0 0 9.17 8 A 7.5 7.5 0 0 0 12 13.83 A 7.5 7.5 0 0 0 14.83 8 A 7.5 7.5 0 0 0 12 2.17 Z" fill="url(#mcYellowGrad)" opacity="0.95"/>
    </svg>
);

export const AppleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.94 0 2.75-1.08 4.64-.92 1.93.18 3.59 1.17 4.59 2.62-4.08 2.1-3.41 8.35 1.37 10.05zM13 3.5c.86-1.09 1.97-1.68 3.16-1.63.1 1.28-.69 2.53-1.55 3.53-.94 1.1-2.17 1.63-3.26 1.67-.12-1.22.75-2.5 1.65-3.57z"/></svg>
);

export const GooglePlayIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 20.5v-17L17 12 3 20.5zM18.5 12l-1.5-1L6 4.5 18.5 12z" /></svg>
);

// High-Fidelity Luxurious 3D EMV Smart Chip with Golden contact lines and textured pathways
export const EmvChipIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 30" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
            <linearGradient id="chipGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="30%" stopColor="#FFD54F" />
                <stop offset="70%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#FFA000" />
            </linearGradient>
            <linearGradient id="chipPathways" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5D4037" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3E2723" stopOpacity="0.9" />
            </linearGradient>
        </defs>
        <rect width="40" height="30" rx="5" fill="url(#chipGoldGrad)" stroke="#C59B27" strokeWidth="0.8" />
        <rect x="1.5" y="1.5" width="37" height="27" rx="3.5" fill="none" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.3" />
        
        {/* Core circuitry lanes */}
        <rect x="6" y="5" width="28" height="20" rx="2" fill="none" stroke="url(#chipPathways)" strokeWidth="1" />
        <line x1="20" y1="5" x2="20" y2="25" stroke="url(#chipPathways)" strokeWidth="1" />
        <line x1="6" y1="15" x2="34" y2="15" stroke="url(#chipPathways)" strokeWidth="1" />
        
        <path d="M 12 5 L 12 11 L 6 11 M 12 25 L 12 19 L 6 19" stroke="url(#chipPathways)" strokeWidth="1" />
        <path d="M 28 5 L 28 11 L 34 11 M 28 25 L 28 19 L 34 19" stroke="url(#chipPathways)" strokeWidth="1" />
        
        {/* Silicon central core cap */}
        <circle cx="20" cy="15" r="4.5" fill="url(#chipGoldGrad)" stroke="url(#chipPathways)" strokeWidth="1" />
        <circle cx="16.5" cy="15" r="0.5" fill="#3D2622" />
        <circle cx="23.5" cy="15" r="0.5" fill="#3D2622" />
        <circle cx="20" cy="11.5" r="0.5" fill="#3D2622" />
        <circle cx="20" cy="18.5" r="0.5" fill="#3D2622" />
    </svg>
);

// High Realism Stacked Cards Apple Wallet Pass Icon
export const AppleWalletIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
            <linearGradient id="walletGoldNeon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE259" />
                <stop offset="100%" stopColor="#FFA751" />
            </linearGradient>
            <linearGradient id="walletBlueNeon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F2FE" />
                <stop offset="100%" stopColor="#4FACFE" />
            </linearGradient>
            <linearGradient id="walletCarbonDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#141E30" />
                <stop offset="100%" stopColor="#243B55" />
            </linearGradient>
        </defs>
        {/* Dynamic stacked structure */}
        <rect x="8" y="4" width="18" height="18" rx="2" fill="url(#walletBlueNeon)" opacity="0.6" transform="rotate(-6 17 13)" />
        <rect x="7" y="6" width="20" height="18" rx="3" fill="url(#walletGoldNeon)" opacity="0.8" transform="rotate(-3 17 15)" />
        <rect x="5" y="10" width="22" height="17" rx="3.5" fill="url(#walletCarbonDark)" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.8" />
        
        {/* Mini details for realism */}
        <rect x="5" y="13" width="22" height="2.5" fill="#000" opacity="0.4" />
        <rect x="8" y="18" width="3.5" height="2.5" rx="0.4" fill="#FFE082" />
        <path d="M 19.5 18 A 1 1 0 0 1 19.5 19.5 M 21 16.5 A 2 2 0 0 1 21 21 M 22.5 15 A 3.2 3.2 0 0 1 22.5 22.5" stroke="#FFF" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
);

export const IdentificationIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-1.294-1.54 6.721 6.721 0 01-1.294 1.54c-1.006.87-2.303 1.289-3.706 1.289h-.75v-1.15c0-1.63 1.153-3.1 2.809-3.414 1.206-.23 2.128-1.258 2.128-2.51v-.53a2.625 2.625 0 00-5.25 0v.53c0 1.252.922 2.28 2.128 2.51 1.656.314 2.809 1.785 2.809 3.414v1.15h-.75c-1.403 0-2.7-.419-3.706-1.289z" />
    </svg>
);

export const XSocialIcon = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
export const LinkedInIcon = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;
export const InstagramIcon = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;

// Official FDIC Insured Medal Icon
export const FdicIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
            <linearGradient id="fdicGoldCircle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F3E1C5" />
                <stop offset="50%" stopColor="#D5B065" />
                <stop offset="100%" stopColor="#9E7B35" />
            </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="#0C2540" stroke="url(#fdicGoldCircle)" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="19" fill="none" stroke="#FFF" strokeWidth="0.6" strokeOpacity="0.25" />
        
        {/* Federal Ribbon and Logo */}
        <path d="M 11 16 C 16 18.5 24 19 24 21 C 24 19 32 18.5 37 16" stroke="url(#fdicGoldCircle)" strokeWidth="1.5" strokeLinecap="round" />
        <text x="24" y="28" fontFamily="'Cinzel', 'Playfair Display', 'Inter', serif" fontSize="9.5" fontWeight="900" fill="url(#fdicGoldCircle)" textAnchor="middle" letterSpacing="0.6px">FDIC</text>
        <text x="24" y="35" fontFamily="'Inter', sans-serif" fontSize="3.8" fontWeight="800" fill="#FFF" textAnchor="middle" letterSpacing="1.2px" fillOpacity="0.75">INSURED</text>
    </svg>
);

// Official Equal Housing Lender Shield/Badge Icon
export const EqualHousingLenderIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
            <linearGradient id="ehlGoldBadging" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4D388" />
                <stop offset="100%" stopColor="#A07932" />
            </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="6" fill="#0A1D33" stroke="url(#ehlGoldBadging)" strokeWidth="2.5" />
        
        {/* Physical House framing with Equal sign inside */}
        <path d="M 9 27 L 24 12 L 39 27 H 33 V 38 H 15 V 27 Z" stroke="url(#ehlGoldBadging)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="29.5" x2="30" y2="29.5" stroke="url(#ehlGoldBadging)" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="34" x2="30" y2="34" stroke="url(#ehlGoldBadging)" strokeWidth="3" strokeLinecap="round" />
        <text x="24" y="44" fontFamily="'Inter', sans-serif" fontSize="4.5" fontWeight="900" fill="url(#ehlGoldBadging)" textAnchor="middle" letterSpacing="0.4px">LENDER</text>
    </svg>
);

export const AnimatedCheckCircleIcon = CheckCircle2;

// Official Bitcoin colored visual coin with subtle glow and physical rim details
export const BtcIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
        <defs>
            <linearGradient id="btcGoldBadge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA62E" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14.5" fill="url(#btcGoldBadge)" filter="drop-shadow(0 2px 4px rgba(247,147,26,0.3))" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.32" />
        <path fill="#FFF" d="M19.5 13.6c.3-1.8-1.1-2.8-3-3.4l.6-2.5-1.5-.4-.6 2.4c-.4-.1-.8-.2-1.2-.3l.6-2.4-1.5-.4-.6 2.5c-.3-.1-.7-.1-1-.2l.0-.0-2-.5-.4 1.6s1.1.2 1.1.3c.6.1.7.5.7.8l-1.7 6.7c-.1.0-.2.0-.3-.1l.4-1.5-2.3.6.4 1.8c.0.3-.1.8-.7.6.0.0-1.1-.3-1.1-.3l-.7 1.7 1.9.5c.4.1.7.2 1.1.3l-.6 2.5 1.5.4.6-2.5c.4.1.8.2 1.2.3l-.6 2.4 1.5.4.6-2.5c2.5.5 4.4.3 5.3-2 .6-1.8.0-2.9-1.3-3.6 2.4-.3 2.9-1.6 2.6-3.4zm-4.7 5.1c-.4 1.8-3.4.8-4.4.6l.8-3.2c1 .2 4 .7 3.6 2.6zm.4-5.3c-.4 1.6-2.9.8-3.7.6l.7-3c.8.2 3.4.6 3 2.4z" />
    </svg>
);

// High Realism Ethereum colored crystal coin
export const EthIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
        <defs>
            <linearGradient id="ethCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8C9EFF" />
                <stop offset="50%" stopColor="#627EEA" />
                <stop offset="100%" stopColor="#2F44AA" />
            </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14.5" fill="url(#ethCoinGrad)" filter="drop-shadow(0 2px 4px rgba(98,126,234,0.3))" />
        <g fill="#FFF" fillOpacity="0.95">
            <path d="M16 5 L10 15 L16 18 L22 15 Z" />
            <path d="M16 6.5 L12.2 14.5 L16 16.3 L19.8 14.5 Z" fillOpacity="0.65" />
            <path d="M16 19.5 L10 16.5 L16 27 L22 16.5 Z" fillOpacity="0.8" />
            <path d="M16 19.5 L16 25 L19.8 17.7 Z" fillOpacity="0.5" />
        </g>
    </svg>
);

// Solana modern diagonal vectors logo
export const SolIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
        <defs>
            <linearGradient id="solCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14F195" />
                <stop offset="50%" stopColor="#5B21B6" />
                <stop offset="100%" stopColor="#9945FF" />
            </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14.5" fill="url(#solCoinGrad)" />
        <g fill="#FFF">
            <path d="M 8.5 10.5 L 23.5 10.5 L 20.5 13.5 L 5.5 13.5 Z" />
            <path d="M 5.5 14.5 L 20.5 14.5 L 23.5 17.5 L 8.5 17.5 Z" opacity="0.85" />
            <path d="M 8.5 18.5 L 23.5 18.5 L 20.5 21.5 L 5.5 21.5 Z" opacity="0.7" />
        </g>
    </svg>
);

export const UsdcIcon = DollarSign;
export const AdaIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
);
export const DotIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="2" />
    </svg>
);
export const XrpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5.25 5.25l13.5 13.5M5.25 18.75L18.75 5.25" />
    </svg>
);
export const BnbIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className={className}>
        <path d="M12 4.5L16.5 9 12 13.5 7.5 9 12 4.5zm0 9L16.5 18 12 22.5 7.5 18 12 13.5z" />
    </svg>
);
export const TwtIcon = Wallet;

export const OnfidoIcon = ShieldCheck;
export const StarIconFilled = ({ className }: { className?: string }) => (
    <Star className={className} fill="currentColor" />
);
export const StarbucksIcon = ({ className }: { className?: string }) => (
    <BrandLogo name="Starbucks" domain="starbucks.com" fallback={CoffeeIcon} className={className} />
);
export const UberIcon = ({ className }: { className?: string }) => (
    <BrandLogo name="Uber" domain="uber.com" fallback={Truck} className={className} />
);

// --- High-Fidelity 3D Modern Vector Bank Icons ---

// Chase Bank 3D Prism Octagon Logo
export const ChaseBank3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="chaseBlue3D" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#117ACA" />
                <stop offset="50%" stopColor="#0B5299" />
                <stop offset="100%" stopColor="#052F5C" />
            </linearGradient>
            <linearGradient id="chaseGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
            </linearGradient>
            <filter id="chaseShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.4" />
            </filter>
        </defs>
        <circle cx="50" cy="50" r="46" fill="#0B132B" stroke="url(#chaseGlow)" strokeWidth="1.5" filter="url(#chaseShadow)" />
        <g transform="translate(18, 18) scale(0.64)">
            {/* 3D Octagonal Facets of Chase Logo */}
            <path d="M 50 10 L 90 10 L 90 40 L 60 40 Z" fill="url(#chaseBlue3D)" opacity="0.95" />
            <path d="M 90 50 L 90 90 L 60 90 L 60 60 Z" fill="url(#chaseBlue3D)" opacity="0.85" />
            <path d="M 50 90 L 10 90 L 10 60 L 40 60 Z" fill="url(#chaseBlue3D)" opacity="0.9" />
            <path d="M 10 50 L 10 10 L 40 10 L 40 40 Z" fill="url(#chaseBlue3D)" opacity="1" />
            <circle cx="50" cy="50" r="8" fill="#FFFFFF" opacity="0.9" />
        </g>
    </svg>
);

// Bank of America 3D Flag Ribbon Grid Logo
export const BofA3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="bofaRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>
            <linearGradient id="bofaBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E40AF" />
                <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#030712" stroke="#334155" strokeWidth="1.5" />
        <g transform="translate(15, 25) scale(0.7)">
            <rect x="10" y="10" width="12" height="30" rx="2" fill="url(#bofaRed)" />
            <rect x="26" y="10" width="12" height="30" rx="2" fill="url(#bofaBlue)" />
            <rect x="42" y="10" width="12" height="30" rx="2" fill="url(#bofaRed)" />
            <rect x="58" y="10" width="12" height="30" rx="2" fill="url(#bofaBlue)" />
            <rect x="74" y="10" width="12" height="30" rx="2" fill="url(#bofaRed)" />
            <rect x="10" y="44" width="76" height="12" rx="2" fill="#FFFFFF" opacity="0.9" />
        </g>
    </svg>
);

// Wells Fargo 3D Gold Stagecoach Crest Logo
export const WellsFargo3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="wfRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>
            <linearGradient id="wfGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="url(#wfRed)" stroke="url(#wfGold)" strokeWidth="2" />
        <text x="50" y="58" fontFamily="Georgia, serif" fontSize="32" fontWeight="900" fill="url(#wfGold)" textAnchor="middle" letterSpacing="1">WELLS</text>
    </svg>
);

// Citibank 3D Glowing Red Umbrella Arc Logo
export const Citi3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="citiBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="#030712" stroke="#0284C7" strokeWidth="1.5" />
        <path d="M 22 42 C 22 24, 78 24, 78 42" stroke="#EF4444" strokeWidth="7" strokeLinecap="round" fill="none" />
        <text x="50" y="65" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="900" fill="url(#citiBlue)" textAnchor="middle">citi</text>
    </svg>
);

// Capital One 3D Swoosh Shield Logo
export const CapitalOne3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="100" height="100" rx="24" fill="#0B132B" stroke="#3B82F6" strokeWidth="1.5" />
        <path d="M 15 50 C 40 25, 80 30, 85 45 C 70 65, 30 75, 15 50 Z" fill="#EF4444" opacity="0.9" />
        <text x="50" y="58" fontFamily="sans-serif" fontSize="18" fontWeight="900" fill="#FFFFFF" textAnchor="middle">Capital</text>
    </svg>
);

// FedNow 3D Instant Settlement Node
export const FedNow3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="fedNowGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="#040914" stroke="url(#fedNowGlow)" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" stroke="#06B6D4" strokeWidth="0.5" strokeDasharray="4 4" />
        <path d="M 52 18 L 30 52 L 48 52 L 44 82 L 70 44 L 52 44 Z" fill="#22D3EE" filter="drop-shadow(0 0 8px #06B6D4)" />
    </svg>
);

// SWIFT Global Financial Messaging 3D Node
export const Swift3DIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#0A0F1D" stroke="#6366F1" strokeWidth="1.5" />
        <path d="M 20 50 A 30 30 0 0 1 80 50 A 30 30 0 0 1 20 50" stroke="#818CF8" strokeWidth="1" strokeDasharray="3 3" fill="none" />
        <path d="M 50 20 A 30 30 0 0 1 50 80 A 30 30 0 0 1 50 20" stroke="#818CF8" strokeWidth="1" strokeDasharray="3 3" fill="none" />
        <text x="50" y="58" fontFamily="sans-serif" fontSize="20" fontWeight="900" fill="#EEF2FF" textAnchor="middle" letterSpacing="1">SWIFT</text>
    </svg>
);


// --- Brand Logo Component with 3D Glass & Metallic Styling ---
export const BrandLogo = ({ 
    domain, 
    name, 
    fallback: Fallback, 
    className 
}: { 
    domain?: string; 
    name: string; 
    fallback: React.ComponentType<{ className?: string }>; 
    className?: string 
}) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        let isMounted = true;
        setImgState('loading');
        setLogoUrl(null);
        
        if (!domain) {
            if (isMounted) setImgState('error');
            return;
        }

        const loadLogo = async () => {
            // Priority 1: Clearbit (High Res Vector)
            const clearbitUrl = `https://logo.clearbit.com/${domain}?size=512`;
            
            const img = new Image();
            img.src = clearbitUrl;
            
            img.onload = () => {
                if (isMounted) {
                    setLogoUrl(clearbitUrl);
                    setImgState('loaded');
                }
            };

            img.onerror = () => {
                if (isMounted) {
                    // Priority 2: Google High Res Favicon
                    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
                    setLogoUrl(googleUrl);
                    setImgState('loaded');
                }
            };
        };

        loadLogo();
        return () => { isMounted = false; };
    }, [domain]);

    // Check if we have a direct custom 3D SVG icon for key banks
    const lowerName = name.toLowerCase();
    if (lowerName.includes('chase')) {
        return <ChaseBank3DIcon className={className} />;
    }
    if (lowerName.includes('america') || lowerName === 'bofa') {
        return <BofA3DIcon className={className} />;
    }
    if (lowerName.includes('wells') || lowerName.includes('fargo')) {
        return <WellsFargo3DIcon className={className} />;
    }
    if (lowerName.includes('citi')) {
        return <Citi3DIcon className={className} />;
    }
    if (lowerName.includes('capital one')) {
        return <CapitalOne3DIcon className={className} />;
    }
    if (lowerName.includes('fednow')) {
        return <FedNow3DIcon className={className} />;
    }
    if (lowerName.includes('swift')) {
        return <Swift3DIcon className={className} />;
    }

    if (imgState === 'error' || !logoUrl) {
        return <Fallback className={className} />;
    }

    return (
        <div className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black p-1 border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)] group overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-amber-500/10 pointer-events-none"></div>
            <img 
                src={logoUrl} 
                alt={name} 
                className={`${className} object-contain rounded-xl transition-all duration-300 transform group-hover:scale-105 ${imgState === 'loaded' ? 'opacity-100' : 'opacity-0'}`} 
                onLoad={() => setImgState('loaded')}
                onError={() => setImgState('error')}
                referrerPolicy="no-referrer"
            />
        </div>
    );
};

// --- Comprehensive Domain Registry for US & Global Banking Institutions ---

const BANK_DOMAINS: Record<string, string> = {
    'Chase Bank': 'chase.com',
    'JPMorgan Chase': 'jpmorganchase.com',
    'Bank of America': 'bankofamerica.com',
    'Wells Fargo': 'wellsfargo.com',
    'Citibank': 'citi.com',
    'Capital One': 'capitalone.com',
    'PNC Bank': 'pnc.com',
    'US Bank': 'usbank.com',
    'Truist': 'truist.com',
    'Goldman Sachs': 'goldmansachs.com',
    'Morgan Stanley': 'morganstanley.com',
    'Charles Schwab': 'schwab.com',
    'TD Bank': 'td.com',
    'First Republic': 'firstrepublic.com',
    'Citizens Bank': 'citizensbank.com',
    'Fifth Third Bank': '53.com',
    'KeyBank': 'key.com',
    'Ally Bank': 'ally.com',
    'Huntington Bank': 'huntington.com',
    'M&T Bank': 'mtb.com',
    'Discover Bank': 'discover.com',
    'BMO Harris': 'bmo.com',
    'Silicon Valley Bank': 'svb.com',
    'Union Bank': 'unionbank.com',
    'HSBC': 'hsbc.com',
    'Barclays': 'barclays.co.uk',
    'Lloyds Bank': 'lloydsbank.com',
    'NatWest': 'natwest.com',
    'Santander UK': 'santander.co.uk',
    'Monzo': 'monzo.com',
    'Revolut': 'revolut.com',
    'Deutsche Bank': 'db.com',
    'Commerzbank': 'commerzbank.de',
    'N26': 'n26.com',
    'BNP Paribas': 'mabanque.bnpparibas',
    'Société Générale': 'societegenerale.fr',
    'Crédit Agricole': 'credit-agricole.fr',
    'DBS Bank': 'dbs.com.sg',
    'OCBC Bank': 'ocbc.com',
    'UOB': 'uob.com.sg',
    'First Pacific Enclave': 'lawrenceconsultantsorg.org'
};

const SERVICE_DOMAINS: Record<string, string> = {
    'PayPal': 'paypal.com',
    'CashApp': 'cash.app',
    'Venmo': 'venmo.com',
    'Wise': 'wise.com',
    'Western Union': 'westernunion.com',
    'MoneyGram': 'moneygram.com',
    'Zelle': 'zellepay.com',
    'Payoneer': 'payoneer.com',
    'Skrill': 'skrill.com',
    'FedNow': 'federalreserve.gov',
    'SWIFT': 'swift.com',
    'ACH Direct Debit': 'nacha.org',
    'Apple Pay': 'apple.com',
    'Google Pay': 'google.com'
};

export const getBankIcon = (bankName: string) => {
    return ({ className }: { className?: string }) => {
        const domain = BANK_DOMAINS[bankName] || `${bankName.toLowerCase().replace(/\s/g, '')}.com`;
        return <BrandLogo domain={domain} name={bankName} fallback={Landmark} className={className} />;
    };
};

export const getServiceIcon = (serviceName: string) => {
    return ({ className }: { className?: string }) => {
        const domain = SERVICE_DOMAINS[serviceName] || `${serviceName.toLowerCase().replace(/\s/g, '')}.com`;
        return <BrandLogo domain={domain} name={serviceName} fallback={Globe} className={className} />;
    };
};

export const getUtilityBillerIcon = (billerName: string) => {
    return ({ className }: { className?: string }) => {
        const domain = `${billerName.toLowerCase().replace(/\s/g, '')}.com`;
        return <BrandLogo domain={domain} name={billerName} fallback={Zap} className={className} />;
    };
};

export const getAirtimeProviderIcon = (providerName: string) => {
    return ({ className }: { className?: string }) => {
        const domain = `${providerName.toLowerCase().replace(/\s/g, '')}.com`;
        return <BrandLogo domain={domain} name={providerName} fallback={Phone} className={className} />;
    };
};


// --- Helper Components ---
export const StatusBadge = ({ status, theme = 'light' }: { status: string; theme?: 'light' | 'dark' }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
        status === 'Funds Arrived' || status === 'Completed' || status === 'Active'
        ? (theme === 'dark' ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-800')
        : (theme === 'dark' ? 'bg-yellow-900 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
    }`}>
        {status === 'Funds Arrived' || status === 'Completed' || status === 'Active' 
            ? <CheckCircle2 className="w-3 h-3 mr-1"/> 
            : <Clock className="w-3 h-3 mr-1"/>
        }
        {status}
    </span>
);

export const SendIcon = ({ className }: { className?: string }) => <ArrowRight className={className} />;

export const PrinterIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
);

export const BarcodeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 100 30" preserveAspectRatio="none" className={className}>
        <path d="M2 0h2v30H2zm4 0h1v30H6zm3 0h3v30H9zm5 0h1v30h-1zm3 0h2v30h-2zm4 0h1v30h-1zm3 0h3v30h-3zm5 0h1v30h-1zm3 0h2v30h-2zm4 0h1v30h-1zm3 0h3v30h-3zm5 0h1v30h-1zm3 0h2v30h-2zm4 0h1v30h-1zm3 0h3v30h-3zm5 0h1v30h-1zm3 0h2v30h-2zm4 0h1v30h-1zm3 0h3v30h-3z" />
    </svg>
);

