import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BellIcon,
  GlobeAmericasIcon,
  SearchIcon,
  MoonIcon,
  SunIcon,
  XIcon,
  UserCircleIcon,
  WalletIcon,
  UserGroupIcon,
  ActivityIcon,
  BankIcon,
  FirstPacificLogo,
  SendIcon,
  Cog8ToothIcon,
  MenuIcon,
} from "./Icons";
import {
  Notification,
  View,
  UserProfile,
  Account,
  Transaction,
  Recipient,
} from "../types";
import { MegaMenu } from "./MegaMenu";
import { NotificationsPanel } from "./NotificationsPanel";
import { useLanguage } from "../contexts/LanguageContext";
import { ProfileDropdown } from "./ProfileDropdown";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useCurrency } from "../contexts/CurrencyContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSystemOptions } from "../hooks/useSystemOptions";
import { Lock, Megaphone, Monitor, Camera as LucideCamera, AlertTriangle, Smartphone, Download } from "lucide-react";
import { db } from "../services/database";
import { AppDownloadModal } from "./AppDownloadModal";
import { Haptics } from "../utils/haptics";

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  onOpenLogoutConfirm: () => void;
  notifications: Notification[];
  onMarkNotificationsAsRead: () => void;
  userProfile: UserProfile;
  onOpenLanguageSelector: () => void;
  onOpenGlobalPrefs: () => void;
  onUpdateProfilePicture: (url: string) => void;
  onOpenSendMoneyFlow: (
    initialTab?: "send" | "split" | "deposit",
    openQr?: boolean,
  ) => void;
  onOpenWireTransfer: (data?: any) => void;
  onOpenAdminDashboard?: () => void;
  accounts: Account[];
  transactions: Transaction[];
  recipients: Recipient[];
  onLockSession?: () => void;
  platformSettings?: any;
  onUpdatePlatformSettings?: (settings: any) => void;
  totalNetWorth?: number;
}

const MarketTicker = () => (
  <div className="bg-slate-50 dark:bg-[#0c111c] text-[#0F172A] dark:text-white text-xs py-2 overflow-hidden border-b border-slate-200 dark:border-white/10 relative z-50">
    <div className="flex items-center animate-marquee whitespace-nowrap">
      <div className="flex space-x-12 px-6">
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            S&P 500
          </span>{" "}
          5,245.12 <span className="text-emerald-400 ml-2">▲ 0.45%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            NASDAQ
          </span>{" "}
          16,428.82 <span className="text-emerald-400 ml-2">▲ 0.82%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            EUR/USD
          </span>{" "}
          1.0842 <span className="text-red-400 ml-2">▼ 0.12%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            GBP/USD
          </span>{" "}
          1.2635 <span className="text-emerald-400 ml-2">▲ 0.05%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            GOLD
          </span>{" "}
          2,345.50 <span className="text-emerald-400 ml-2">▲ 0.30%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            BTC/USD
          </span>{" "}
          68,420.10 <span className="text-emerald-400 ml-2">▲ 1.20%</span>
        </span>
        {/* Repeat for seamless loop */}
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            S&P 500
          </span>{" "}
          5,245.12 <span className="text-emerald-400 ml-2">▲ 0.45%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            NASDAQ
          </span>{" "}
          16,428.82 <span className="text-emerald-400 ml-2">▲ 0.82%</span>
        </span>
        <span className="flex items-center font-mono">
          <span className="font-bold text-[#0F172A] dark:text-white mr-2 tracking-wider">
            EUR/USD
          </span>{" "}
          1.0842 <span className="text-red-400 ml-2">▼ 0.12%</span>
        </span>
      </div>
    </div>
  </div>
);

export const SyncStatusIndicator: React.FC = () => {
  const [state, setState] = useState<'synced' | 'syncing' | 'offline'>(
    navigator.onLine ? 'synced' : 'offline'
  );
  const [checksum, setChecksum] = useState<string>('PRB-MAIN');

  useEffect(() => {
    const handleOnline = () => setState('synced');
    const handleOffline = () => setState('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSyncState = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.state) {
        setState(customEvent.detail.state);
        if (customEvent.detail.checksum) {
          setChecksum(customEvent.detail.checksum);
        }
      }
    };

    // Also trigger brief sync pulse on any db updates
    const triggerSyncPulse = () => {
      setState('syncing');
      const timer = setTimeout(() => {
        setState(navigator.onLine ? 'synced' : 'offline');
        // Generate a random-looking short ledger checksum
        const randHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
        setChecksum(`PRB-${randHex}`);
      }, 1500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('ledger_sync_state', handleSyncState);
    window.addEventListener('db_accounts_updated', triggerSyncPulse);
    window.addEventListener('db_transactions_updated', triggerSyncPulse);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ledger_sync_state', handleSyncState);
      window.removeEventListener('db_accounts_updated', triggerSyncPulse);
      window.removeEventListener('db_transactions_updated', triggerSyncPulse);
    };
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-900[0.02] border border-slate-200 dark:border-white/[0.05] pl-2.5 pr-3.5 py-1 sm:py-1.5 rounded-xl cursor-default group animate-fade-in" title={`Ledger node synchronized. Code: ${checksum}`}>
      <span className="relative flex h-2 w-2">
        {state === 'synced' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        )}
        {state === 'syncing' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </>
        )}
        {state === 'offline' && (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500 dark:bg-slate-900"></span>
        )}
      </span>
      <div className="flex flex-col text-left">
        <span className="text-[7px] font-sans font-bold text-[#0F172A] dark:text-white uppercase tracking-widest leading-none">
          GLOBAL LEDGER
        </span>
        <span className={`text-[9px] font-mono font-bold leading-none mt-1 uppercase tracking-tight ${
          state === 'synced' ? 'text-emerald-500' :
          state === 'syncing' ? 'text-amber-500' :
          'text-[#0F172A]'
        }`}>
          {state === 'synced' && `ONLINE • ${checksum}`}
          {state === 'syncing' && 'SYNCING...'}
          {state === 'offline' && 'OFFLINE CACHE'}
        </span>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  isMenuOpen,
  onOpenLogoutConfirm,
  notifications,
  onMarkNotificationsAsRead,
  userProfile,
  onOpenLanguageSelector,
  onOpenGlobalPrefs,
  onUpdateProfilePicture,
  onOpenSendMoneyFlow,
  onOpenWireTransfer,
  onOpenAdminDashboard,
  accounts,
  transactions,
  recipients,
  onLockSession,
  platformSettings,
  onUpdatePlatformSettings,
  totalNetWorth,
}) => {
  const systemOptions = useSystemOptions();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);

  const [headerImgError, setHeaderImgError] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'FP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handlePanicFreeze = async () => {
    try {
      await db.updateUserProfile(userProfile.email, { isFrozen: true });
      setIsPanicModalOpen(false);
      // Optional: force a page reload or let real-time listener update state.
    } catch (e) {
      console.error('Failed to freeze account', e);
    }
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    accounts: Account[];
    recipients: Recipient[];
    transactions: Transaction[];
  }>({ accounts: [], recipients: [], transactions: [] });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !isSearchFocused) {
      setSearchResults({ accounts: [], recipients: [], transactions: [] });
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();

    const filteredAccounts = accounts.filter(
      (acc) =>
        acc.nickname?.toLowerCase().includes(lowerQuery) ||
        acc.accountNumber.includes(lowerQuery) ||
        acc.type.toLowerCase().includes(lowerQuery),
    );

    const filteredRecipients = recipients.filter(
      (rec) =>
        rec.fullName.toLowerCase().includes(lowerQuery) ||
        rec.nickname?.toLowerCase().includes(lowerQuery) ||
        rec.bankName.toLowerCase().includes(lowerQuery) ||
        rec.id.toLowerCase().includes(lowerQuery), // Added ID check
    );

    const filteredTransactions = transactions.filter(
      (tx) =>
        tx.description.toLowerCase().includes(lowerQuery) ||
        tx.recipient.fullName.toLowerCase().includes(lowerQuery) ||
        String(tx.sendAmount).includes(lowerQuery) ||
        tx.purpose?.toLowerCase().includes(lowerQuery), // Added purpose check
    );

    setSearchResults({
      accounts: filteredAccounts,
      recipients: filteredRecipients,
      transactions: filteredTransactions,
    });
  }, [searchQuery, isSearchFocused, accounts, recipients, transactions]);

  const handlePictureClick = () => {
    profilePicInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please select an image smaller than 2MB.");
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setTimeout(() => {
          onUpdateProfilePicture(reader.result as string);
          setIsUploading(false);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <MegaMenu
        isOpen={isMenuOpen}
        onClose={onMenuToggle}
        userProfile={userProfile}
        onOpenSendMoneyFlow={onOpenSendMoneyFlow}
        onOpenWireTransfer={onOpenWireTransfer}
        onOpenLogoutConfirm={onOpenLogoutConfirm}
      />

      <header className="sticky top-0 z-40 bg-[var(--bg-color)]/95  border-b border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300 header-cq-root @container">
        <MarketTicker />

        {systemOptions?.platformAnnouncement?.active && (
          <div
            className={`py-2 px-4 flex items-center justify-center gap-3 text-white shadow-lg relative z-50 text-center ${
              systemOptions.platformAnnouncement.type === "critical"
                ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-600"
                : systemOptions.platformAnnouncement.type === "warning"
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-[#0F172A]"
                  : "bg-gradient-to-r primary- via-sky-500 primary-"
            }`}
          >
            <Megaphone
              className={`w-5 h-5 flex-shrink-0 animate-pulse ${systemOptions.platformAnnouncement.type === "warning" ? "text-[#0F172A]" : "text-white"}`}
            />
            <div
              className={`text-[11px] sm:text-xs font-sans font-black tracking-widest leading-tight uppercase ${systemOptions.platformAnnouncement.type === "warning" ? "text-[#0F172A]" : "text-white"}`}
              dangerouslySetInnerHTML={{
                __html: systemOptions.platformAnnouncement.message,
              }}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-[1720px] px-2.5 sm:px-4 md:px-6 lg:px-8">
          <div className="flex min-h-[3.75rem] py-1.5 items-center justify-between gap-2 sm:gap-3 flex-wrap md:flex-nowrap">
            {/* Left Side: Logo (Responsive Flex Capsule) */}
            <div className="flex items-center shrink-0 min-w-0 gap-2 sm:gap-3">
              <Link
                to="/dashboard"
                className="flex flex-row items-center gap-2 group transition-opacity shrink-0"
              >
                <div className="flex items-center bg-slate-100 dark:bg-slate-900[0.03] hover:bg-slate-200 dark:hover:bg-white[0.08] border border-slate-200 dark:border-white/10 pl-2 pr-2.5 sm:pr-3 py-1.5 rounded-xl gap-1.5 sm:gap-2 transition-all duration-300 shadow-sm">
                  <FirstPacificLogo className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:rotate-12 transition-transform duration-500 shrink-0" />
                  <span className="font-sans font-black text-[9px] sm:text-[10px] text-[#0F172A] dark:text-white tracking-[0.25em] sm:tracking-[0.3em] uppercase leading-none mt-0.5 whitespace-nowrap">
                    FIRST
                    <span className="font-light text-[#0F172A] dark:text-white">
                      PACIFIC
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Search (Desktop & Tablet) - Fluid Dynamic Expansion without fixed widths */}
            <div className="hidden md:flex flex-1 min-w-0 max-w-md lg:max-w-lg xl:max-w-xl mx-2 lg:mx-4 relative items-center header-cq-search-tablet">
              <div className="relative group w-full">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transform text-slate-400 group-focus-within:text-primary transition-colors h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search portfolios, transactions, or contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                  className="w-full rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 py-2 sm:py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
                />
              </div>
              {/* Search Results Dropdown */}
              {isSearchFocused && searchQuery.length > 1 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#0c111c]/95  rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-fade-in-up">
                  <ul className="max-h-96 overflow-y-auto custom-scrollbar">
                    {searchResults.accounts.length > 0 && (
                      <li className="px-4 pt-3 pb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        Accounts
                      </li>
                    )}
                    {searchResults.accounts.map((acc) => (
                      <li key={acc.id}>
                        <Link
                          to="/accounts"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-white text-sm text-[#0F172A] dark:text-white dark:bg-slate-800"
                        >
                          <BankIcon className="w-4 h-4 text-emerald-500" />
                          {acc.nickname || acc.type}
                        </Link>
                      </li>
                    ))}

                    {searchResults.recipients.length > 0 && (
                      <li className="px-4 pt-3 pb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        Recipients
                      </li>
                    )}
                    {searchResults.recipients.map((rec) => (
                      <li key={rec.id}>
                        <Link
                          to="/recipients"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-white text-sm text-[#0F172A] dark:text-white dark:bg-slate-800"
                        >
                          <UserGroupIcon className="w-4 h-4 text-primary" />
                          {rec.fullName}
                        </Link>
                      </li>
                    ))}

                    {searchResults.transactions.length > 0 && (
                      <li className="px-4 pt-3 pb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        Transactions
                      </li>
                    )}
                    {searchResults.transactions.map((tx) => (
                      <li key={tx.id}>
                        <Link
                          to="/history"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-white text-sm text-[#0F172A] dark:text-white dark:bg-slate-800"
                        >
                          <ActivityIcon className="w-4 h-4 text-amber-500" />
                          {tx.description}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Side: Actions (Adaptive Flexbox Wrapping Strategy) */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 ml-auto shrink-0 flex-wrap justify-end">
              <div className="header-nav-container flex items-center gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap justify-end">
                {/* Quick Scan QR Payment Button */}
                <button
                  onClick={() => onOpenSendMoneyFlow("send", true)}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors border border-primary/20 shrink-0"
                  title="Quick Scan P2P Payment"
                >
                  <LucideCamera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  <span className="hidden sm:inline text-xs font-bold tracking-wide">
                    Quick Scan
                  </span>
                </button>

                <div className="hidden sm:flex items-center gap-0.5 shrink-0 header-cq-hide-compact header-cq-item">
                  <LanguageSelector className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white scale-90" />
                  <CurrencySelector
                    selectedCurrency={displayCurrency}
                    onSelect={setDisplayCurrency}
                    label="Change Currency"
                    className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white scale-90"
                  />
                </div>

                <button
                  onClick={onOpenGlobalPrefs}
                  className="p-1.5 rounded-full text-[#0F172A] dark:text-white hover:text-primary hover:bg-slate-100 dark:hover:bg-white transition-colors hidden sm:block shrink-0 header-cq-hide-compact header-cq-item dark:bg-slate-800"
                  title="Global Preferences"
                >
                  <Cog8ToothIcon className="h-5 w-5" />
                </button>

                <button
                  onClick={() => {
                    if (onUpdatePlatformSettings) {
                      const currentThemeMode =
                        platformSettings?.themeMode || "dark";
                      const nextThemeMode =
                        currentThemeMode === "dark"
                          ? "light"
                          : currentThemeMode === "light"
                            ? "system"
                            : "dark";
                      onUpdatePlatformSettings({ themeMode: nextThemeMode });
                    } else {
                      setTheme(theme === "dark" ? "light" : "dark");
                    }
                  }}
                  className="p-1.5 rounded-full text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white transition-colors hidden sm:block relative group shrink-0 header-cq-hide-compact header-cq-item dark:bg-slate-800"
                  title="Toggle Theme"
                >
                  {(platformSettings?.themeMode || theme) === "dark" ? (
                    <MoonIcon className="h-5 w-5" />
                  ) : (platformSettings?.themeMode || theme) === "light" ? (
                    <SunIcon className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Monitor className="h-5 w-5 text-emerald-500" />
                  )}
                  <span className="absolute bottom-[-32px] right-1/2 translate-x-1/2 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-lg text-[7px] font-black uppercase tracking-widest text-primary scale-0 group-hover:scale-100 transition-all z-[9999] whitespace-nowrap">
                    Mode: {platformSettings?.themeMode || theme}
                  </span>
                </button>

                {onLockSession && (
                  <button
                    onClick={onLockSession}
                    className="p-1.5 rounded-full text-[#0F172A] dark:text-white hover:text-rose-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-white transition-colors relative group shrink-0 header-cq-item dark:bg-slate-800"
                    title="Lock Session Port (Manual Inactivity Simulation)"
                  >
                    <Lock className="h-5 w-5 group-hover:text-rose-400 group-hover:scale-105 transition-all" />
                    <span className="absolute bottom-[-32px] right-1/2 translate-x-1/2 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-lg text-[7px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 scale-0 group-hover:scale-100 transition-all z-[9999] whitespace-nowrap">
                      Lock Session
                    </span>
                  </button>
                )}

                {/* Download / Install Native App Button */}
                <button
                  onClick={() => {
                    Haptics.tap();
                    setIsAppDownloadOpen(true);
                  }}
                  className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-300 transition-all duration-300 shadow-sm active:scale-95 shrink-0 header-cq-hide-tablet header-cq-item"
                  title="Download / Install Native Banking App"
                >
                  <Smartphone className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span className="font-sans font-black text-[9px] tracking-widest uppercase leading-none mt-0.5 hidden xs:inline">
                    APP
                  </span>
                </button>

                {/* Menu Button - Always visible, compact, and styled with premium consistency */}
                <button
                  onClick={onMenuToggle}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900[0.04] border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-slate-200 dark:hover:bg-white text-[#0F172A] dark:text-white transition-all duration-300 shadow-sm active:scale-95 shrink-0"
                  title="Open Mega Menu"
                >
                  <MenuIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-sans font-black text-[9px] tracking-widest uppercase leading-none mt-0.5">
                    MENU
                  </span>
                </button>

                {/* Mobile Search Toggle */}
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-1.5 rounded-full text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white transition-colors md:hidden shrink-0 dark:bg-slate-800"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>

                {/* Panic/Freeze Button */}
                <button
                  onClick={() => setIsPanicModalOpen(true)}
                  className="hidden sm:block p-1.5 rounded-full text-red-500 hover:bg-red-500 transition-colors relative group shrink-0 header-cq-hide-compact"
                  title="Panic / Freeze Account"
                >
                  <AlertTriangle className="h-5 w-5" />
                </button>

                <div ref={notificationsRef} className="relative shrink-0">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) {
                        onMarkNotificationsAsRead();
                      }
                    }}
                    className="p-1.5 rounded-full text-[#0F172A] dark:text-white hover:text-primary hover:bg-slate-100 dark:hover:bg-white transition-colors relative group dark:bg-slate-800"
                    title="Notifications"
                  >
                    <BellIcon className="h-5 w-5 group-hover:text-primary transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-[#0c111c] shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationsPanel
                      notifications={notifications}
                      onClose={() => setShowNotifications(false)}
                      onMarkNotificationsAsRead={onMarkNotificationsAsRead}
                    />
                  )}
                </div>

                <div ref={profileRef} className="relative shrink-0">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2 p-1 rounded-full text-[#0F172A] dark:text-[#1E293B] hover:bg-slate-100 dark:hover:bg-white transition-all ring-2 ring-emerald-500/30 hover:ring-emerald-400 dark:ring-white/10 dark:hover:ring-emerald-400/50 shadow-sm group relative cursor-pointer dark:bg-slate-800"
                    title={`${userProfile.name} (${userProfile.role === 'super_admin' ? 'Super Admin' : userProfile.position || 'Verified Customer'})`}
                  >
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-sm bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      {userProfile.profilePictureUrl && !headerImgError ? (
                        <img
                          src={userProfile.profilePictureUrl}
                          alt={userProfile.name || "User Profile"}
                          onError={() => setHeaderImgError(true)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white font-black text-xs sm:text-sm flex items-center justify-center tracking-wider shadow-inner">
                          {getInitials(userProfile.name)}
                        </div>
                      )}
                      
                      {/* Live Status Verified Dot */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white dark:border-[#0c111c] rounded-full shadow-sm" />
                    </div>

                    {/* Compact Name/Role Tag on Desktop */}
                    <div className="hidden xl:flex flex-col items-start pr-2 text-left">
                      <span className="text-[11px] font-bold text-[#0F172A] dark:text-white leading-none truncate max-w-[100px]">
                        {userProfile.name.split(' ')[0]}
                      </span>
                      <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 leading-none mt-1 uppercase tracking-wider">
                        {userProfile.role === 'super_admin' ? 'Super Admin' : userProfile.position || 'Verified'}
                      </span>
                    </div>
                  </button>
                  <input
                    type="file"
                    ref={profilePicInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  {showProfile && (
                    <ProfileDropdown
                      userProfile={userProfile}
                      onClose={() => setShowProfile(false)}
                      onOpenLogoutConfirm={onOpenLogoutConfirm}
                      onUpdateProfilePicture={onUpdateProfilePicture}
                      isUploading={isUploading}
                      handlePictureClick={handlePictureClick}
                      onOpenAdminDashboard={onOpenAdminDashboard}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900  animate-fade-in lg:hidden">
            <div className="p-4">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transform text-[#0F172A] dark:text-white h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                  className="w-full rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-[#0F172A] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>
              {searchQuery.length > 1 && (
                <div className="mt-4 max-h-[70vh] overflow-y-auto">
                  <ul className="space-y-1">
                    {searchResults.accounts.length > 0 && (
                      <li className="px-2 pt-3 pb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        Accounts
                      </li>
                    )}
                    {searchResults.accounts.map((acc) => (
                      <li key={acc.id}>
                        <Link
                          to="/accounts"
                          onClick={() => setIsMobileSearchOpen(false)}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-white text-sm text-[#0F172A] dark:text-white rounded-lg dark:bg-slate-800"
                        >
                          <BankIcon className="w-4 h-4" />
                          {acc.nickname || acc.type}
                        </Link>
                      </li>
                    ))}
                    {searchResults.recipients.length > 0 && (
                      <li className="px-2 pt-3 pb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        Recipients
                      </li>
                    )}
                    {searchResults.recipients.map((rec) => (
                      <li key={rec.id}>
                        <Link
                          to="/recipients"
                          onClick={() => setIsMobileSearchOpen(false)}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-white text-sm text-[#0F172A] dark:text-white rounded-lg dark:bg-slate-800"
                        >
                          <UserGroupIcon className="w-4 h-4" />
                          {rec.fullName}
                        </Link>
                      </li>
                    ))}
                    {searchResults.transactions.length > 0 && (
                      <li className="px-2 pt-3 pb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        Transactions
                      </li>
                    )}
                    {searchResults.transactions.map((tx) => (
                      <li key={tx.id}>
                        <Link
                          to="/history"
                          onClick={() => setIsMobileSearchOpen(false)}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-white text-sm text-[#0F172A] dark:text-white rounded-lg dark:bg-slate-800"
                        >
                          <ActivityIcon className="w-4 h-4" />
                          {tx.description}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#0F172A] dark:text-white"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        )}
      </header>

      {/* Panic / Freeze Modal */}
      {isPanicModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50  p-4 dark:bg-slate-900">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-white/10 overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-xl font-bold font-serif">Emergency Freeze</h3>
              </div>
              <p className="text-sm text-[#0F172A] dark:text-white mb-6 leading-relaxed">
                Activating the freeze protocol will immediately lock all your accounts and linked cards.
                All outgoing transaction capabilities will be disabled until you complete an identity verification.
                To proceed, please verify your identity by typing <strong>FREEZE</strong> below.
              </p>

              <input 
                type="text" 
                placeholder="Type FREEZE"
                className="w-full bg-slate-50 dark:bg-[#0c111c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold uppercase"
                id="freeze-input-verification"
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsPanicModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    const input = document.getElementById('freeze-input-verification') as HTMLInputElement;
                    if (input && input.value.trim().toUpperCase() === 'FREEZE') {
                      handlePanicFreeze();
                    } else {
                      alert('Please type FREEZE to verify.');
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/30 transition-all"
                >
                  Confirm Freeze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Native App Download / Install Modal */}
      <AppDownloadModal
        isOpen={isAppDownloadOpen}
        onClose={() => setIsAppDownloadOpen(false)}
      />
    </>
  );
};
