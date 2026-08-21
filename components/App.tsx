import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  HashRouter,
} from "react-router-dom";
import {
  UserProfile,
  Account,
  Transaction,
  CreateTransactionInput,
  Recipient,
  Card,
  VirtualCard,
  CryptoAsset,
  Notification,
  NotificationType,
  LoanApplication,
  FlightBooking,
  Shipment,
  Donation,
  AdvancedTransferLimits,
  SecuritySettings,
  TrustedDevice,
  PushNotificationSettings,
  PrivacySettings,
  SubscriptionService,
  AppleCardDetails,
  AppleCardTransaction,
  UtilityBill,
  UtilityBiller,
  AirtimePurchase,
  Alert,
  CryptoHolding,
  View,
  LoanApplicationStatus,
  TravelPlan,
  Task,
  VerificationLevel,
  TransactionStatus,
  PlatformSettings,
  TravelPlanStatus,
  AccountType,
} from "../types";
import {
  USER_PROFILE,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_RECIPIENTS,
  INITIAL_CARDS,
  INITIAL_VIRTUAL_CARDS,
  INITIAL_CRYPTO_HOLDINGS,
  INITIAL_LOAN_APPLICATIONS,
  INITIAL_FLIGHT_BOOKINGS,
  INITIAL_SHIPMENT,
  INITIAL_ADVANCED_TRANSFER_LIMITS,
  INITIAL_SECURITY_SETTINGS,
  INITIAL_TRUSTED_DEVICES,
  INITIAL_PUSH_SETTINGS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_APPLE_CARD_DETAILS,
  INITIAL_APPLE_CARD_TRANSACTIONS,
  INITIAL_UTILITY_BILLS,
  UTILITY_BILLERS,
  AIRTIME_PROVIDERS,
  INITIAL_AIRTIME_PURCHASES,
  getInitialCryptoAssets,
  INITIAL_CARD_TRANSACTIONS,
  INITIAL_TASKS,
} from "./constants";
import * as Icons from "./Icons";
import { db } from "../services/database";
import { supabase } from "../services/supabase";
import { synchronizeTransactionDeduction } from "../services/balanceSyncService";
import { socket, registerUserSocket } from "../services/socket";
import { auth, db as firebaseDb, db as firestore } from "../services/firebase";
import { onSnapshot, collection, query, where, doc } from "firebase/firestore";
import {
  sendTransactionNotification,
  sendCardAlertSms,
  sendLoanApplicationSms,
  sendTravelBookingSms,
  sendLogisticsUpdateSms,
  sendDonationReceiptSms,
  sendSecurityAlertSms,
  sendLoginAlert,
  sendLocationChangeAlert,
  getClientTelemetry,
} from "../utils/notificationService";
import { useInactivityTimer } from "../hooks/useInactivityTimer";
import { applyThemeColor, resetThemeColor } from "../utils/themeColor";
import { BackgroundManager } from "./BackgroundManager";
import { AppSection } from "../config/backgroundConfig";
import { triggerSafetyGuardHaptic, Haptics } from "../utils/haptics";

// Components
import { OutstandingTransferPrompt } from "./OutstandingTransferPrompt";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { Dashboard } from "./Dashboard";
import { Deposits } from "./Deposits";
import { Withdrawals } from "./Withdrawals";
import { Accounts } from "./Accounts";
import { JointAccounts } from "./JointAccounts";
import { JointAccountFormFlow } from "./JointAccountFormFlow";
import { Verification } from "./Verification";
import { CardManagement } from "./CardManagement";
import { Recipients } from "./Recipients";
import { ActivityLog } from "./ActivityLog";
import { DocumentViewer } from "./DocumentViewer";
import { Investments } from "./Investments";
import { CryptoDashboard } from "./CryptoDashboard";
import { ServicesDashboard } from "./ServicesDashboard";
import { Security } from "./Security";
import { BiometricShieldBarrier } from "./BiometricShieldBarrier";
import { Support } from "./Support";
import { ComplianceCenter } from "./ComplianceCenter";
import { RealTimeSyncProvider } from "../contexts/RealTimeSyncContext";
import { MultiSigWallet } from "./MultiSigWallet";
import { AdminDashboard } from "./AdminDashboard";
import { Welcome } from "./Welcome";
import { JointHumanitarianAccountFlow } from "./JointHumanitarianAccountFlow";
import { OpeningSequence } from "./OpeningSequence";
import { AdvancedFirstPage } from "./AdvancedFirstPage";
import { LoggedOut } from "./LoggedOut";
import { InactivityLockScreen } from "./InactivityLockScreen";
import { InactivityModal } from "./InactivityModal";
import { LiveChatFloating } from "./LiveChatFloating";
import { LogoutConfirmationModal } from "./LogoutConfirmationModal";
import { ApkUpdateChecker } from "./ApkUpdateChecker";
import { PushNotificationToast } from "./PushNotificationToast";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { SendMoneyFlow } from "./SendMoneyFlow";
import { InteractiveTutorial } from "./InteractiveTutorial";
import { WireTransfer } from "./WireTransfer";
import { WireTransferPage } from "./WireTransferPage";
import { AddFundsModal } from "./AddFundsModal";
import { AddRecipientPage } from "./AddRecipientPage";
import { LinkBankAccountModal } from "./LinkBankAccountModal";
import { CurrencyConverterModal } from "./CurrencyConverterModal";
import { ReceiveMoneyModal } from "./ReceiveMoneyModal";
import { ContactSupportModal } from "./ContactSupportModal";
import { GlobalPreferencesModal } from "./GlobalPreferencesModal";
import { FloatingTranslator } from "./FloatingTranslator";
import { VerificationScreen } from "./VerificationScreen";
import { Loans } from "./Loans";
import { Flights } from "./Flights";
import { Logistics } from "./Logistics";
import { GlobalAid } from "./GlobalAid";
import { About } from "./About";
import { Careers } from "./Careers";
import { Contact } from "./Contact";
import { DigitalWallet } from "./DigitalWallet";
import { DigitalStore } from "./DigitalStore";
import { Ratings } from "./Ratings";
import { GlobalBankingNetwork } from "./GlobalBankingNetwork";
import { AlertsCenter } from "./AlertsCenter";
import { EmailTransactionAlerts } from "./EmailTransactionAlerts";
import { CertificatesCenter } from "./CertificatesCenter";
import { AtmLocator } from "./AtmLocator";
import { Quickteller } from "./Quickteller";
import { QrScanner } from "./QrScanner";
import { QuickQRPay } from "./QuickQRPay";
import { PrivacyCenter } from "./PrivacyCenter";
import { InboxDashboard } from "./InboxDashboard";
import { SovereignCasino } from "./SovereignCasino";
import { TravelCheckIn } from "./TravelCheckIn";
import { SecureMessageCenter } from "./SecureMessageCenter";
import { PlatformFeatures } from "./PlatformFeatures";
import { Insurance } from "./Insurance";
import { Integrations } from "./Integrations";
import { MobileAppPortal } from "./MobileAppPortal";
import { Footer } from "./Footer";
import { AccountCreationFlow } from "./AccountCreationFlow";
import { FinancialAdvisor } from "./FinancialAdvisor";
import { GeminiIntelligence } from "./GeminiIntelligence";
import { FinancialTasks } from "./FinancialTasks";
import { VideoMediaLibrary } from "./VideoMediaLibrary";
import { LegalModal } from "./LegalModal";
import { getFinancialAnalysis } from "../services/geminiService";
import { VoiceCommandAssistant } from "./VoiceCommandAssistant";
import { UndoTransferToast } from "./UndoTransferToast";

import { UserProfilePage } from "./UserProfilePage";
import { useRealTime } from "../hooks/useRealTime";
import { PremiumGlobalLoader } from "./PremiumGlobalLoader";
import OneSignal from "react-onesignal";

export const App = () => {
  return (
    <BackgroundWrapper>
      <AppContent />
    </BackgroundWrapper>
  );
};

const BackgroundWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getAppSection = (pathname: string): AppSection => {
    if (pathname === '/' || pathname === '/advanced') return 'WelcomePage';
    if (pathname.startsWith('/login') || pathname.startsWith('/create-account')) return 'Auth';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/transfers') || pathname.startsWith('/quickteller') || pathname.startsWith('/send')) return 'Transfers';
    if (pathname.startsWith('/cards')) return 'Cards';
    if (pathname.startsWith('/atm-locator')) return 'AtmLocator';
    if (pathname.startsWith('/investments') || pathname.startsWith('/crypto')) return 'Investments';
    if (pathname.startsWith('/loans') || pathname.startsWith('/commercial')) return 'Corporate';
    if (pathname.startsWith('/settings') || pathname.startsWith('/security') || pathname.startsWith('/profile')) return 'Settings';
    if (pathname.startsWith('/vault') || pathname.startsWith('/multisig')) return 'Vault';
    if (pathname.startsWith('/banner') || pathname.startsWith('/media-library')) return 'BannerSystem';
    return 'WelcomePage'; // Default fallback
  };

  return (
    <>
      <BackgroundManager section={getAppSection(location.pathname)} />
      {children}
    </>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineOverride, setOfflineOverride] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fpb_offline_mode_override') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const runOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "2caa52bf-36c7-4575-b014-e4451c32db3d",
          allowLocalhostAsSecureOrigin: true,
        });
        OneSignal.Slidedown.promptPush();
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes("already initialized") || errStr.includes("not configured")) {
          // Ignore expected errors during dev/preview
        } else {
          console.error("OneSignal initialization failed", err);
        }
      }
    };
    runOneSignal();
  }, []);

  useEffect(() => {
    const handleOfflineModeChange = (e: any) => {
      setOfflineOverride(e.detail.enabled);
    };
    window.addEventListener('offline-mode-change', handleOfflineModeChange);
    return () => {
      window.removeEventListener('offline-mode-change', handleOfflineModeChange);
    };
  }, []);

  // Primary State Declarations moved to top to prevent Block-Scoped Lexical hoisting (TDZ) errors
  const initialUserProfile = useMemo(() => {
    if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
      return null;
    }
    try {
      const stored = sessionStorage.getItem("active_user_profile");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const [userProfile, setUserProfile] = useState<UserProfile>(
    initialUserProfile || USER_PROFILE,
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [triggeredBudgetWarnings, setTriggeredBudgetWarnings] = useState<Record<string, boolean>>({});

  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createAccountType, setCreateAccountType] = useState<
    "standard" | "joint_humanitarian" | "wealth" | "business"
  >("standard");

  // Main App Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>(
    getInitialCryptoAssets(Icons),
  );
  const [cryptoHoldings, setCryptoHoldings] = useState<CryptoHolding[]>(
    INITIAL_CRYPTO_HOLDINGS,
  );
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>(
    INITIAL_LOAN_APPLICATIONS,
  );
  const [flightBookings, setFlightBookings] = useState<FlightBooking[]>(
    INITIAL_FLIGHT_BOOKINGS,
  );
  const [shipment, setShipment] = useState<Shipment>(INITIAL_SHIPMENT);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [airtimePurchases, setAirtimePurchases] = useState<AirtimePurchase[]>(
    INITIAL_AIRTIME_PURCHASES,
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [pendingUndoTx, setPendingUndoTx] = useState<{
    transaction: Transaction;
    onUndo: (tx: Transaction) => void;
    onFinalize: (tx: Transaction) => void;
    durationMs?: number;
  } | null>(null);

  // Settings
  const [advancedLimits, setAdvancedLimits] = useState<AdvancedTransferLimits>(
    INITIAL_ADVANCED_TRANSFER_LIMITS,
  );
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(
    INITIAL_SECURITY_SETTINGS,
  );
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>(
    INITIAL_TRUSTED_DEVICES,
  );
  const [pushSettings, setPushSettings] = useState<PushNotificationSettings>(
    INITIAL_PUSH_SETTINGS,
  );
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    ads: false,
    sharing: false,
    email: { transactions: true, security: true, promotions: false },
    sms: { transactions: true, security: true, promotions: false },
  });
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(
    () => {
      const saved = localStorage.getItem("platform_settings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn("[App] Failed to parse saved platform settings", e);
        }
      }
      return {
        theme: "blue",
        themeMode: "dark",
        hapticsEnabled: true,
        hapticsIntensity: 80,
        privacyMode: false,
        hftMode: false,
        documentStatementTheme: "Classic",
        documentSealColor: "#D4AF37",
      };
    },
  );
  const [linkedServices, setLinkedServices] = useState<Record<string, any>>({});
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(
    VerificationLevel.LEVEL_2,
  );

  // UI Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushNotification, setPushNotification] = useState<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    code?: string;
  } | null>(null);
  const [flaggedNotification, setFlaggedNotification] = useState<{
    message: string;
    amount: string;
    transactionId: string;
  } | null>(null);
  const [isGlobalPrefsOpen, setIsGlobalPrefsOpen] = useState(false);

  const [isGlobalPageLoading, setIsGlobalPageLoading] = useState(false);

  const [isComplianceFrozen, setIsComplianceFrozen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const prevMaintenanceModeRef = React.useRef(isMaintenanceMode);
  const [showLanding, setShowLanding] = useState(
    initialUserProfile ? false : true,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialUserProfile ? true : false,
  );
  const [isBooting, setIsBooting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const syncRef = React.useRef<any>(null);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [isInitialQrScanOpen, setIsInitialQrScanOpen] = useState(false);
  const [hasOutstandingTransfer, setHasOutstandingTransfer] = useState(false);
  const [isWireTransferOpen, setIsWireTransferOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false);
  const [isReceiveMoneyOpen, setIsReceiveMoneyOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  // --- Derived State ---
  const totalNetWorth = useMemo(() => {
    if (!accounts || !Array.isArray(accounts) || !cryptoHoldings || !cryptoAssets) return 0;
    const accountsTotal = (accounts || []).reduce((acc, curr) => acc + (curr?.balance || 0), 0);
    const cryptoTotal = (cryptoHoldings || []).reduce((acc, curr) => {
      const asset = (cryptoAssets || []).find((a) => a?.id === curr?.assetId);
      return acc + (curr?.amount || 0) * (asset?.price || 0);
    }, 0);
    return accountsTotal + cryptoTotal;
  }, [accounts, cryptoHoldings, cryptoAssets]);

  const addNotification = React.useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      linkTo?: View,
      metadata?: any,
    ) => {
      const newNotif: Notification = {
        id: `notif_${Date.now()}`,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        linkTo,
        reportedToSecurity: false,
        metadata,
      } as any;
      setNotifications((prev) => [newNotif, ...prev]);
      setPushNotification({
        id: newNotif.id,
        type,
        title,
        message,
        ...metadata,
      });

      // Dedicated 'Regulatory Alert' audio effect (Web Audio API)
      const isRegulatory =
        type === "security" ||
        type === "alert" ||
        /compliance|regulatory|authorization|letter|halt|clearance|warning|restrict/i.test(
          title,
        ) ||
        /compliance|regulatory|authorization|letter|halt|clearance|warning|restrict/i.test(
          message,
        );

      if (isRegulatory) {
        try {
          const AudioCtxClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            const ctx = new AudioCtxClass();
            const playRegulatoryTone = () => {
              const now = ctx.currentTime;
              // Sound generator function: Multi-layered, low-frequency warning pulses
              const triggerWarningNode = (
                frequency: number,
                delayTime: number,
                duration: number,
                volume: number,
              ) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                filter.type = "lowpass";
                filter.frequency.setValueAtTime(800, now); // warmer, dense analog feel

                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(frequency, now + delayTime);
                osc.frequency.linearRampToValueAtTime(
                  frequency * 0.75,
                  now + delayTime + duration,
                ); // heavy descending siren sweep

                gain.gain.setValueAtTime(0, now + delayTime);
                gain.gain.linearRampToValueAtTime(
                  volume,
                  now + delayTime + 0.05,
                );
                gain.gain.exponentialRampToValueAtTime(
                  0.001,
                  now + delayTime + duration,
                );

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + delayTime);
                osc.stop(now + delayTime + duration);
              };

              // Double pulse of low, warning sweeps:
              triggerWarningNode(160.0, 0, 0.45, 0.08);
              triggerWarningNode(140.0, 0.35, 0.55, 0.08);
            };

            if (ctx.state === "suspended") {
              const resumeAndPlay = () => {
                ctx.resume().then(() => {
                  if (ctx.state === "running") playRegulatoryTone();
                });
                document.removeEventListener("click", resumeAndPlay);
              };
              document.addEventListener("click", resumeAndPlay);
            } else {
              playRegulatoryTone();
            }
          }
        } catch (err) {
          console.warn("[Regulatory Audio Blocked]", err);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const handleAddVerifiedNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        addNotification(
          detail.type as any,
          detail.title,
          detail.message,
          detail.linkTo,
          detail.metadata,
        );
      }
    };
    window.addEventListener(
      "ADD_VERIFIED_INBOX_NOTIFICATION",
      handleAddVerifiedNotification,
    );
    return () =>
      window.removeEventListener(
        "ADD_VERIFIED_INBOX_NOTIFICATION",
        handleAddVerifiedNotification,
      );
  }, [addNotification]);

  useEffect(() => {
    if (prevMaintenanceModeRef.current === true && isMaintenanceMode === false) {
      addNotification(
        NotificationType.ALERT,
        "Core System Maintenance Completed",
        "We deeply appreciate your support and commitment. Our enhanced multi-rail infrastructure and sovereign wealth management services are fully functional and back online after a brief upgrade period.",
      );
    }
    prevMaintenanceModeRef.current = isMaintenanceMode;
  }, [isMaintenanceMode, addNotification]);
  const [emergencyAlert, setEmergencyAlert] = useState<{
    message: string;
    severity: string;
  } | null>(null);

  // Premium Real-time WhatsApp Notification Overlay Simulation
  const [simulatedWhatsApp, setSimulatedWhatsApp] = useState<{
    sender: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleSimulatedWhatsApp = (e: any) => {
      const detail = e.detail || e;
      setSimulatedWhatsApp(detail);

      try {
        const AudioContextObj =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextObj) {
          const ctx = new AudioContextObj();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch (err) {
        // AudioContext is restricted until user interacts with the page (Standard Browser Safety)
      }
    };

    window.addEventListener(
      "WHATSAPP_NOTIFICATION_SIMULATED" as any,
      handleSimulatedWhatsApp,
    );
    return () => {
      window.removeEventListener(
        "WHATSAPP_NOTIFICATION_SIMULATED" as any,
        handleSimulatedWhatsApp,
      );
    };
  }, []);

  useEffect(() => {
    if (simulatedWhatsApp) {
      const timer = setTimeout(() => {
        setSimulatedWhatsApp(null);
      }, 7000); // 7-second on-screen persistent readout
      return () => clearTimeout(timer);
    }
  }, [simulatedWhatsApp]);

  const userProfileRef = React.useRef<any>(null);
  React.useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  const transactionsRef = React.useRef<any[]>([]);
  React.useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const realTimeCallbacks = React.useMemo(
    () => {
      const isBackendServiceAvailable = Boolean(db && (firebaseDb || supabase || firestore));
      if (!isBackendServiceAvailable) {
        console.warn("[App] External database or messaging services pending initialization before realTimeCallbacks allocation.");
      }
      return {
      onAccountFrozen: () => {
        setIsComplianceFrozen(true);
      },
      onAccountUnfrozen: () => {
        setIsComplianceFrozen(false);
      },
      onBalanceUpdated: (data: {
        accountId: string;
        newBalance: number;
        reason?: string;
      }) => {
        let oldBalance = 0;
        let updatedAccount: Account | null = null;
        setAccounts((prev) => {
          const targetAcc = prev.find(
            (acc) =>
              acc.id === data.accountId ||
              (acc.type === AccountType.CHECKING &&
                data.accountId.endsWith("_chk")) ||
              (acc.type === AccountType.SAVINGS &&
                data.accountId.endsWith("_sav"))
          );
          if (targetAcc) {
            oldBalance = (targetAcc?.balance || 0);
          }

          // Verify with local transaction ledger entries for completeness
          const localTxs = transactionsRef.current.filter(
            (tx) => tx.accountId === data.accountId
          );
          console.log(
            `[Ledger Verification] Reconciling central balance sync. Current local cache balance: ${oldBalance}, Central requested balance: ${data.newBalance}, Associated local ledger transaction entries count: ${localTxs.length}`
          );

          return prev.map((acc) => {
            // Match checking/savings endpoints or accounts matching ID
            if (
              acc.id === data.accountId ||
              (acc.type === AccountType.CHECKING &&
                data.accountId.endsWith("_chk")) ||
              (acc.type === AccountType.SAVINGS &&
                data.accountId.endsWith("_sav"))
            ) {
              updatedAccount = { ...acc, balance: data.newBalance };
              return updatedAccount;
            }
            return acc;
          });
        });
        
        if (updatedAccount && userProfile?.email) {
          db.saveUserAccount(userProfile.email, updatedAccount);
        }

        // Trigger transaction history highlight animation for real-time reflection
        window.dispatchEvent(
          new CustomEvent("BALANCE_ADJUSTMENT_TRIGGERED", {
            detail: {
              accountId: data.accountId,
              oldBalance,
              newBalance: data.newBalance,
            },
          })
        );

        addNotification(
          NotificationType.ALERT,
          "Ledger Reconciled in Real-time",
          `Your account balance was adjusted to $${data.newBalance.toLocaleString()} by the administrator: ${data.reason || "Sovereign balance adjustment"}`,
        );
      },
      onInterventionResolved: (data: {
        txId: string;
        email: string;
        resolution: "approved" | "rejected";
        message?: string;
      }) => {
        console.log("[App.tsx] Real-time Resolution Received:", data);
        // Dispatch event so that SendMoneyFlow.tsx or other components can react
        window.dispatchEvent(
          new CustomEvent("REALTIME_INTERVENTION_RESOLVED", { detail: data }),
        );
      },
      onCustomSystemAlert: (data: {
        message: string;
        severity: string;
        timestamp: string;
        category?: string;
        targetSegment?: {
          type: 'all' | 'kycStatus' | 'txVolume' | 'combined';
          value: string;
        };
      }) => {
        // Segment targeting check
        if (data.targetSegment && data.targetSegment.type !== 'all') {
          const { type, value } = data.targetSegment;
          const currentProfile = userProfileRef.current;
          
          if (type === 'kycStatus') {
            const currentKyc = currentProfile?.kycStatus || 'unverified';
            if (currentKyc !== value) {
              console.log(`[WS SEGMENT] Targeted "${value}", but user is "${currentKyc}". Skipping alert.`);
              return;
            }
          } else if (type === 'txVolume') {
            const userTxs = transactionsRef.current || [];
            const userEmail = currentProfile?.email;
            
            // Calculate total transaction volume for this user
            const userVolume = userTxs
              .filter(t => t.accountId === userEmail || t.recipient?.email === userEmail)
              .reduce((sum, t) => sum + (t.sendAmount || 0), 0);
              
            const isHigh = userVolume > 5000;
            const targetHigh = value === 'high';
            
            if (isHigh !== targetHigh) {
              console.log(`[WS SEGMENT] Targeted volume "${value}" (High: ${targetHigh}), but user volume is $${userVolume} (isHigh: ${isHigh}). Skipping alert.`);
              return;
            }
          } else if (type === 'combined') {
            const [targetKyc, targetVolume] = value.split(':');
            const currentKyc = currentProfile?.kycStatus || 'unverified';
            if (currentKyc !== targetKyc) {
              console.log(`[WS SEGMENT] Combined filter kyc mismatch: targeted "${targetKyc}", user is "${currentKyc}". Skipping alert.`);
              return;
            }
            
            const userTxs = transactionsRef.current || [];
            const userEmail = currentProfile?.email;
            
            // Calculate total transaction volume for this user
            const userVolume = userTxs
              .filter(t => t.accountId === userEmail || t.recipient?.email === userEmail)
              .reduce((sum, t) => sum + (t.sendAmount || 0), 0);
              
            const isHigh = userVolume > 5000;
            const targetHigh = targetVolume === 'high';
            
            if (isHigh !== targetHigh) {
              console.log(`[WS SEGMENT] Combined filter volume mismatch: targeted "${targetVolume}" (High: ${targetHigh}), but user volume is $${userVolume} (isHigh: ${isHigh}). Skipping alert.`);
              return;
            }
          }
        }

        addNotification(
          NotificationType.SECURITY,
          "Security Bulletin Alert",
          data.message,
          undefined,
          { category: data.category }
        );
        setEmergencyAlert({ message: data.message, severity: data.severity });
      },
      onMaintenanceMode: (isEnabled: boolean) => {
        setIsMaintenanceMode(isEnabled);
      },
      onFixedAll: () => {
        setIsComplianceFrozen(false);
        window.dispatchEvent(
          new CustomEvent("REALTIME_INTERVENTION_RESOLVED", {
            detail: { resolution: "approved" },
          }),
        );
        addNotification(
          NotificationType.ALERT,
          "Supreme Security Status",
          "Emergency status fixes deployed. All blocks cleared globally.",
        );
      },
      onUserBanned: () => {
        setUserProfile((prev) => ({ ...prev, isBanned: true }));
        // Stop everything, show banned modal
      },
      onUserUnbanned: () => {
        setUserProfile((prev) => ({ ...prev, isBanned: false }));
        addNotification(
          NotificationType.SECURITY,
          "Profile Remediated",
          "Your account profile restrictions have been lifted.",
        );
      },
      onUserSuspended: () => {
        setUserProfile((prev) => ({ ...prev, isSuspended: true }));
        addNotification(
          NotificationType.SECURITY,
          "Security Hold",
          "A temporary hold has been placed on outgoing transactions.",
        );
      },
      onUserUnsuspended: () => {
        setUserProfile((prev) => ({ ...prev, isSuspended: false }));
        addNotification(
          NotificationType.SECURITY,
          "Security Hold Removed",
          "Temporary hold has been removed from your account.",
        );
      },
      onUserWarned: (data: { warning: string }) => {
        setUserProfile((prev) => ({
          ...prev,
          warnings: [...(prev.warnings || []), data.warning],
        }));
        addNotification(
          NotificationType.SECURITY,
          "Compliance Alert",
          `Attention required: ${data.warning}`,
        );
        setEmergencyAlert({ message: data.warning, severity: "warning" });
      },
      onPaymentStatusUpdated: (data: {
        txId: string;
        status: string;
        message: string;
      }) => {
        setTransactions((prev) => {
          const targetTx = prev.find((t) => t.id === data.txId);
          if (!targetTx) return prev;

          if (
            data.status === TransactionStatus.COMPLETED &&
            targetTx.status !== TransactionStatus.COMPLETED
          ) {
            const targetAccount = accounts.find(
              (a) => a.id === targetTx.accountId,
            );
            const currentBalance = targetAccount ? (targetAccount?.balance || 0) : totalNetWorth;
            const fullTx = { ...targetTx, status: TransactionStatus.COMPLETED };
            // Trigger real-time receipt simulation
            import("../utils/notificationService").then(
              ({ sendTransactionNotification }) => {
                sendTransactionNotification(
                  fullTx,
                  true,
                  userProfile.email,
                  currentBalance,
                  userProfile.name,
                  fullTx.complianceFee
                );
              },
            );
          } else if (
            data.status === TransactionStatus.FAILED &&
            targetTx.status !== TransactionStatus.FAILED
          ) {
            // Refund the balance if it was a debit
            if (targetTx.type === "debit") {
              const refundAmount = targetTx.sendAmount + (targetTx.fee || 0);
              const targetAccount = accounts.find(
                (a) => a.id === targetTx.accountId,
              );
              if (targetAccount) {
                db.updateAccountBalance(
                  userProfile.email,
                  targetAccount.id,
                  (targetAccount?.balance || 0) + refundAmount,
                );
                setAccounts((accs) =>
                  accs.map((a) =>
                    a.id === targetAccount.id
                      ? { ...a, balance: (a?.balance || 0) + refundAmount }
                      : a,
                  ),
                );
              }
            }
          }

          return prev.map((t) =>
            t.id === data.txId ? { ...t, status: data.status as any } : t,
          );
        });

        if (data.status === TransactionStatus.COMPLETED) {
          addNotification(
            NotificationType.ALERT,
            "Payment Cleared",
            "A submitted payment has been federally authorized and cleared. Congratulations, your transaction was successful!",
          );
        } else if (data.status === TransactionStatus.FAILED) {
          addNotification(
            NotificationType.SECURITY,
            "Payment Halted",
            "A submitted payment was stopped and funds have been restored. Please contact support.",
          );
        } else if (data.status === "COMPLETED_SECURE") {
          addNotification(
            NotificationType.SECURITY,
            "Secure Gateway Clearance",
            data.message ||
              "Encrypted transaction has been successfully routed and verified.",
          );
        }

        // Dispatch global event
        window.dispatchEvent(
          new CustomEvent("REALTIME_PAYMENT_STATUS", { detail: data }),
        );
      },
      onUserMfaToggled: (data: { enabled: boolean }) => {
        setUserProfile((prev) => {
          const currentSec = prev.securitySettings || INITIAL_SECURITY_SETTINGS;
          return {
            ...prev,
            securitySettings: {
              ...currentSec,
              mfa: {
                ...currentSec.mfa,
                enabled: data.enabled,
              },
            },
          };
        });
        setSecuritySettings((prev) => ({
          ...prev,
          mfa: {
            ...prev.mfa,
            enabled: data.enabled,
          },
        }));
        addNotification(
          NotificationType.SECURITY,
          "OTP Security Reflection",
          `Security protocol updated your Dynamic OTP requirement to: ${data.enabled ? "ENABLED" : "DISABLED"} in real time.`,
        );
      },
      onTransactionCompleted: (data: { transaction: any }) => {
        console.log('⚡ [App.tsx] Real-time transaction completed event:', data);
        const newTx = data.transaction;
        db.saveTransaction(newTx).catch(err => console.warn('Failed to save real-time tx', err));
        setTransactions((prevTxs) => {
          if (prevTxs.some((t) => t.id === newTx.id)) {
            return prevTxs.map((t) => (t.id === newTx.id ? newTx : t));
          }
          return [newTx, ...prevTxs];
        });
        addNotification(
          NotificationType.TRANSACTION,
          "Transaction Settled",
          `Transfer of $${newTx.sendAmount.toLocaleString()} to ${newTx.recipient?.fullName || 'beneficiary'} completed. Ledger reconciled.`
        );
      },
    };
  },
  [addNotification, setAccounts, setTransactions, accounts, userProfile, totalNetWorth],
);

  // --- NEW Flow Control State ---

  // --- Offline Synchronization & Ledger Persistence Hooks ---

  const pendingSyncCount = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    return transactions.filter(t => t?.syncState === 'pending').length;
  }, [transactions]);

  const triggerOfflineSync = React.useCallback(async (isManual: boolean = false) => {
    if (!isAuthenticated || !userProfile?.email || isSyncing) return;
    
    const hasPending = pendingSyncCount > 0;
    
    // Background automatic sync is entirely silent & returns if there are no pending transactions.
    if (!isManual && !hasPending) {
      return;
    }
    
    setIsSyncing(true);
    addNotification(
      NotificationType.ALERT,
      "Synchronizing Ledger",
      "Establishing secure satellite link to synchronize pending offline transactions...",
    );
    
    try {
      const result = await db.syncPendingState(userProfile.email);
      setSyncCount(result.syncedTransactions);
      
      if (result.syncedTransactions > 0) {
        addNotification(
          NotificationType.ALERT,
          "Ledger Sync Completed",
          `Successfully synchronized ${result.syncedTransactions} transactions. Incremental deltas have been transmitted and local state will update automatically via live listeners.`,
        );
      } else if (isManual) {
        addNotification(
          NotificationType.ALERT,
          "Ledger Up to Date",
          "All offline records are fully synchronized with remote secure database ledger.",
        );
      }
    } catch (err: any) {
      console.error("[App Sync] Sync failed:", err);
      addNotification(
        NotificationType.SECURITY,
        "Sync Interrupt",
        "Failed to complete satellite ledger sync: " + err.message,
      );
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, userProfile, isSyncing, addNotification, pendingSyncCount]);

  useEffect(() => {
    syncRef.current = triggerOfflineSync;
  }, [triggerOfflineSync]);

  useEffect(() => {
    if (isOnline && !offlineOverride && isAuthenticated) {
      const timer = setTimeout(() => {
        syncRef.current(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineOverride, isAuthenticated]);

  // System Options
  const [systemOptions, setSystemOptions] = useState<any>(null);

  useEffect(() => {
    const fetchSystemConfig = async () => {
      const config = await db.getSystemOptions();
      setSystemOptions(config);
    };
    fetchSystemConfig();

    socket.on("admin:system_options_updated", (config) => {
      if (config && Object.keys(config).length > 0) {
        setSystemOptions(config);
      } else {
        fetchSystemConfig();
      }
    });
  }, []);

  // User & Data State
  useEffect(() => {
    if (userProfile && isAuthenticated) {
      sessionStorage.setItem(
        "active_user_profile",
        JSON.stringify(userProfile),
      );
    }
  }, [userProfile, isAuthenticated]);

  // --- REAL-TIME HIGH-FIDELITY CHAT NOTIFICATION SOUND ---
  useEffect(() => {
    const handleChatMessage = (msg: any) => {
      // Ensure the message is sent specifically by an admin (not user, and not system automated triggers, and not ourselves)
      const isIncomingAdminMsg =
        msg &&
        msg.senderId !== "user" &&
        msg.senderId !== "system" &&
        msg.senderId !== userProfile.email;

      if (isIncomingAdminMsg) {
        console.log(
          "[App.tsx Real-Time Audio] Admin Support Message Detected. Synthesizing High-Fidelity Notification:",
          msg,
        );

        // Display visual in-app banner toast so they can interact immediately
        addNotification(
          NotificationType.SECURITY,
          `Support reply from ${msg.senderName || "Compliance Desk Officer"}`,
          msg.content ||
            "Your active high-priority support terminal has a new direct update.",
        );

        // Synthesize distinct high-fidelity sovereign chime using pure Web Audio API
        try {
          const AudioCtxClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            const ctx = new AudioCtxClass();

            // Audio sound playback trigger with dynamic gain parameters
            const playSovereignBellChime = () => {
              const now = ctx.currentTime;

              // Synthesizes a crystalline, rich multi-layered melodic note
              const triggerBellNode = (
                frequency: number,
                delayTime: number,
                duration: number,
                balanceVolume: number,
                waveType: "sine" | "triangle" = "sine",
              ) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = waveType;
                // Set precise pitch and premium micro-vibrato sweep
                osc.frequency.setValueAtTime(frequency, now + delayTime);
                osc.frequency.exponentialRampToValueAtTime(
                  frequency * 1.008,
                  now + delayTime + duration,
                );

                // Smooth asset envelope attack/decay curves
                gain.gain.setValueAtTime(0, now + delayTime);
                gain.gain.linearRampToValueAtTime(
                  balanceVolume,
                  now + delayTime + 0.04,
                );
                gain.gain.exponentialRampToValueAtTime(
                  0.001,
                  now + delayTime + duration,
                );

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + delayTime);
                osc.stop(now + delayTime + duration);
              };

              // Progressive executive harmony (G Major / C Maj 9 premium bell chords)
              triggerBellNode(392.0, 0, 0.4, 0.03, "sine"); // G4 base anchor
              triggerBellNode(587.33, 0.08, 0.5, 0.04, "sine"); // D5 stable core
              triggerBellNode(783.99, 0.16, 0.6, 0.04, "sine"); // G5 crisp chord tone
              triggerBellNode(987.77, 0.24, 0.7, 0.05, "triangle"); // B5 beautiful ring timbre
              triggerBellNode(1174.66, 0.32, 0.9, 0.06, "sine"); // D6 high crystal chime
            };

            // Browser Autoplay Policy Protection
            if (ctx.state === "suspended") {
              console.log(
                "[Autoplay Policy] AudioContext is suspended. Registering deferred user gesture event listener.",
              );

              const resumeAndPlay = () => {
                ctx
                  .resume()
                  .then(() => {
                    if (ctx.state === "running") {
                      playSovereignBellChime();
                    }
                  })
                  .catch((e) =>
                    console.warn("[Audio Playback Policy Fail]", e),
                  );

                // Cleanup listener once user gestures have authorized the play state
                document.removeEventListener("click", resumeAndPlay);
                document.removeEventListener("keydown", resumeAndPlay);
                document.removeEventListener("touchstart", resumeAndPlay);
              };

              document.addEventListener("click", resumeAndPlay);
              document.addEventListener("keydown", resumeAndPlay);
              document.addEventListener("touchstart", resumeAndPlay);
            } else {
              playSovereignBellChime();
            }
          }
        } catch (audioErr) {
          console.warn(
            "[Web Audio Autoplay Defense Caught] Playback deferred securely:",
            audioErr,
          );
        }
      }
    };

    // Register global live support chat callback
    socket.on("chat:receive_message", handleChatMessage);
    return () => {
      socket.off("chat:receive_message", handleChatMessage);
    };
  }, [userProfile.email, addNotification]);

  useEffect(() => {
    if (userProfile?.email) {
        registerUserSocket(userProfile.email);
    }

    const handleNewNotification = (data: any) => {
        addNotification(
            data.type || "SECURITY",
            data.title || "Official Dispatch",
            data.message || "You have a new message."
        );
    };
    
    socket.on('user:new_notification', handleNewNotification);
    
    const handleBalanceUpdated = (data: { accountId?: string; newBalance?: number; [key: string]: any }) => {
        console.log("[App Sync] Balance updated via socket:", data);
        if (data?.accountId && typeof data.newBalance === "number") {
            setAccounts((prevAccounts) =>
                prevAccounts.map((acc) =>
                    acc.id === data.accountId || acc.accountNumber === data.accountId
                        ? { ...acc, balance: data.newBalance! }
                        : acc
                )
            );
        }
        if (userProfile?.email) {
            // Re-fetch transactions and accounts with functional state reconciliation
            db.getAccounts(userProfile.email).then(acc => {
                if (!acc) return;
                setAccounts((prevAccounts) => {
                    const freshMap = new Map(acc.map((a) => [a.id, a]));
                    return prevAccounts.map((prevAcc) => {
                        const fresh = freshMap.get(prevAcc.id);
                        return fresh ? { ...prevAcc, balance: fresh.balance } : prevAcc;
                    });
                });
            });
            if (userProfile.role === 'super_admin' || userProfile.role === 'admin') {
                db.getAllTransactions().then(liveTxs => setTransactions(liveTxs));
            } else {
                db.getTransactionsForUser(userProfile.email).then(liveTxs => setTransactions(liveTxs));
            }
        }
    };
    socket.on('user:balance_updated', handleBalanceUpdated);

    const handleDbAccountsUpdated = (data: any) => {
        console.log("[App Sync] db_accounts_updated received via socket, forcing real-time update:", data);
        window.dispatchEvent(new CustomEvent('db_accounts_updated'));
        if (userProfile?.email) {
            db.getAccounts(userProfile.email).then(acc => setAccounts(acc));
            if (userProfile.role === 'super_admin' || userProfile.role === 'admin') {
                db.getAllTransactions().then(liveTxs => setTransactions(liveTxs));
            } else {
                db.getTransactionsForUser(userProfile.email).then(liveTxs => setTransactions(liveTxs));
            }
        }
    };
    socket.on('server:db_accounts_updated', handleDbAccountsUpdated);
    
    return () => {
        socket.off('user:new_notification', handleNewNotification);
        socket.off('user:balance_updated', handleBalanceUpdated);
        socket.off('server:db_accounts_updated', handleDbAccountsUpdated);
    };
  }, [addNotification, userProfile?.email]);

  useEffect(() => {
    // Predictive Notification Service
    if (!isAuthenticated || transactions.length === 0) return;

    if (sessionStorage.getItem('predictive_notif_shown')) return;

    const subscriptionTxs = transactions.filter(t => 
      t.category === 'Entertainment' || 
      (t.description || '').toLowerCase().includes('netflix') ||
      (t.description || '').toLowerCase().includes('spotify') ||
      (t.description || '').toLowerCase().includes('comcast')
    );

    if (subscriptionTxs.length > 0) {
      const targetTx = subscriptionTxs[0];
      const merchant = targetTx.description.split(' - ')[0] || 'Utility Bill';
      const amount = Math.abs(targetTx.sendAmount);

      sessionStorage.setItem('predictive_notif_shown', 'true');
      
      setTimeout(() => {
        addNotification(
          NotificationType.SUBSCRIPTION,
          "Upcoming Payment Predicted",
          `Predictive analysis indicates a recurring payment of $${amount.toFixed(2)} to ${merchant} is due in approximately 48 hours.`
        );
      }, 5000); 
    }
  }, [transactions, isAuthenticated, addNotification]);

  // Automated Smart Budgeting proactive threshold detection
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.email || transactions.length === 0) return;

    // Filter debit transactions
    const debits = transactions.filter(t => t.type === 'debit' && t.sendAmount > 0);
    if (debits.length === 0) return;

    const now = new Date();
    const currentMonthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Group spending by Month-Year and Tags
    const spendingByMonthAndTag: Record<string, Record<string, number>> = {};
    const allTagsSet = new Set<string>();

    debits.forEach(t => {
      const date = t.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(t.statusTimestamps[TransactionStatus.SUBMITTED]) : null;
      if (!date) return;
      
      const mStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const tags = t.tags || [];
      if (tags.length === 0) return;

      if (!spendingByMonthAndTag[mStr]) {
        spendingByMonthAndTag[mStr] = {};
      }

      tags.forEach(tag => {
        allTagsSet.add(tag);
        spendingByMonthAndTag[mStr][tag] = (spendingByMonthAndTag[mStr][tag] || 0) + t.sendAmount;
      });
    });

    const presetBudgets: Record<string, number> = {
      'Tax-Deductible': 1000,
      'Business Expense': 1500,
      'Personal': 800,
      'Medical': 500,
      'Travel': 1200,
      'Utilities': 400,
      'Entertainment': 250,
      'Shopping': 500,
      'Investments': 2000,
    };

    const newTriggered = { ...triggeredBudgetWarnings };
    let hasNewAlert = false;

    allTagsSet.forEach(tag => {
      let sumOfPrevMonths = 0;
      let countOfPrevMonths = 0;

      Object.entries(spendingByMonthAndTag).forEach(([mStr, tagSpending]) => {
        if (mStr !== currentMonthStr) {
          if (tagSpending[tag]) {
            sumOfPrevMonths += tagSpending[tag];
          }
          countOfPrevMonths++;
        }
      });

      let typicalBudget = countOfPrevMonths > 0 ? (sumOfPrevMonths / countOfPrevMonths) : 0;
      if (typicalBudget <= 0) {
        typicalBudget = presetBudgets[tag] || 600;
      }

      const currentSpending = (spendingByMonthAndTag[currentMonthStr] && spendingByMonthAndTag[currentMonthStr][tag]) || 0;
      const threshold = typicalBudget * 0.8;

      if (currentSpending >= threshold) {
        const warningKey = `${userProfile.email}_${currentMonthStr}_${tag}`;
        if (!triggeredBudgetWarnings[warningKey]) {
          const pct = Math.round((currentSpending / typicalBudget) * 100);
          addNotification(
            NotificationType.ALERT,
            `⚠️ Smart Budget Alert: #${tag}`,
            `Your spending of $${currentSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on #${tag} has reached ${pct}% of your typical monthly budget of $${typicalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
            "analytics" as any,
            { isBudgetWarning: true, tag }
          );
          newTriggered[warningKey] = true;
          hasNewAlert = true;
        }
      }
    });

    if (hasNewAlert) {
      setTriggeredBudgetWarnings(newTriggered);
    }
  }, [transactions, isAuthenticated, userProfile?.email, addNotification, triggeredBudgetWarnings]);

  // RealTime-dependent state variables and settings have been refactored to top-level of App to resolve TDZ issues.

  // Trigger ultra modern premium loading features on page transition (First Pacific Bank Coin Engine)
  useEffect(() => {
    if (isAuthenticated && location.pathname) {
      setIsGlobalPageLoading(true);
      const timer = setTimeout(() => {
        setIsGlobalPageLoading(false);
      }, 1250);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isAuthenticated]);

  // Real-time Automated Low Balance Guard checker
  const triggeredLowBalanceAlertsRef = React.useRef<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const handleTransactionToggled = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id && detail.status) {
        if (detail.status === "paused") {
          addNotification(
            NotificationType.SECURITY,
            "Transaction Paused",
            `Transaction ${detail.id.slice(-8)} has been placed on hold.`,
          );
        } else if (detail.status === "resumed") {
          addNotification(
            NotificationType.SECURITY,
            "Transaction Resumed",
            `Transaction ${detail.id.slice(-8)} is processing again.`,
          );
        }
      }
    };
    window.addEventListener(
      "TRANSACTION_STATUS_TOGGLED",
      handleTransactionToggled,
    );
    return () =>
      window.removeEventListener(
        "TRANSACTION_STATUS_TOGGLED",
        handleTransactionToggled,
      );
  }, []);

  useEffect(() => {
    if (!platformSettings.lowBalanceAlertEnabled) {
      // Keep trackers clear or reset them if disabled
      triggeredLowBalanceAlertsRef.current = {};
      return;
    }

    const threshold =
      platformSettings.lowBalanceThreshold !== undefined
        ? platformSettings.lowBalanceThreshold
        : 1000;
    const targetAccountId = platformSettings.lowBalanceAccountId || "all";

    accounts.forEach((acc) => {
      const isMatch = targetAccountId === "all" || targetAccountId === acc.id;
      const isBelow = (acc?.balance || 0) < threshold;

      if (isMatch) {
        if (isBelow) {
          if (!triggeredLowBalanceAlertsRef.current[acc.id]) {
            // Mark as triggered so we don't spam
            triggeredLowBalanceAlertsRef.current[acc.id] = true;

            // Trigger visual push notification & secure inbox database item
            const formattedBalance = (acc?.balance || 0).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
            const formattedThreshold = threshold.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
            const alertTitle = `⚠️ Critical Low Balance Alert`;
            const alertMessage = `Portfolio account ${acc.nickname || acc.type} (••••${acc.accountNumber.slice(-4)}) balance is ${formattedBalance}, falling below your configured safety guard of ${formattedThreshold}.`;

            // Refined tactile haptic alert using Capacitor Haptics
            if (platformSettings.hapticsEnabled !== false) {
              triggerSafetyGuardHaptic(platformSettings.hapticsIntensity ?? 80);
            }

            addNotification(
              "system" as any,
              alertTitle,
              alertMessage,
              "accounts",
            );

            // Trigger SMS/WhatsApp using Twilio Integration Gateway
            const userPhone = userProfile?.phone || "3159150854";
            const time = new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            const smsBody = `FPB GUARD ⚠️: Low balance detected!\n\nAccount: ${acc.nickname || acc.type} (*${acc.accountNumber.slice(-4)})\nBalance: ${formattedBalance}\nThreshold: ${formattedThreshold}\nTime: ${time}\n\nPlease top up immediately to maintain standard multi-rail capabilities.`;

            // 1. WhatsApp real-time dispatch via Gateway
            import("../services/smsService").then(({ sendTwilioWhatsApp }) => {
              sendTwilioWhatsApp(userPhone, smsBody)
                .then((res) => {
                  if (res.success) {
                    console.log(
                      "[LOW_BALANCE_ALERTS] WhatsApp alert dispatched successfully.",
                    );
                  }
                })
                .catch((err) =>
                  console.warn(
                    "[LOW_BALANCE_ALERTS] WhatsApp dispatch error:",
                    err,
                  ),
                );
            });

            // 2. Real-time SMS dispatch via Gateway
            import("../services/smsService").then(({ sendTwilioSms }) => {
              sendTwilioSms(userPhone, smsBody)
                .then((res) => {
                  if (res.success) {
                    console.log(
                      "[LOW_BALANCE_ALERTS] Real-time SMS alert dispatched.",
                    );
                  }
                })
                .catch((err) =>
                  console.warn("[LOW_BALANCE_ALERTS] SMS dispatch error:", err),
                );
            });

            // 3. Dispatch WHATSAPP_NOTIFICATION_SIMULATED for visual on-screen flair
            window.dispatchEvent(
              new CustomEvent("WHATSAPP_NOTIFICATION_SIMULATED", {
                detail: {
                  sender: "First Pacific Low Balance Guard",
                  message: `⚠️ Alert: ${acc.nickname || acc.type} balance dropped below configured safety threshold of ${formattedThreshold}!`,
                },
              }),
            );
          }
        } else {
          // Reset single account tracker when balance goes back above safety zone or on threshold increase
          if (triggeredLowBalanceAlertsRef.current[acc.id]) {
            triggeredLowBalanceAlertsRef.current[acc.id] = false;
          }
        }
      }
    });
  }, [
    accounts,
    platformSettings.lowBalanceAlertEnabled,
    platformSettings.lowBalanceThreshold,
    platformSettings.lowBalanceAccountId,
    userProfile?.phone,
    addNotification,
  ]);

  const { marketData } = useRealTime(
    userProfile?.email,
    addNotification,
    realTimeCallbacks,
  );

  // Transaction UI State
  const [sendMoneyTab, setSendMoneyTab] = useState<
    "send" | "bridge" | "split" | "deposit"
  >("send");
  const [preselectedRecipient, setPreselectedRecipient] =
    useState<Recipient | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("prb_send_money_autosave");
      if (saved && !isSendMoneyOpen) {
        const parsed = JSON.parse(saved);
        if (
          parsed.amount ||
          parsed.selectedRecipientId ||
          parsed.internalAccountNumber
        ) {
          setHasOutstandingTransfer(true);
        }
      }
    } catch (e) {
      console.error("Error checking outstanding transfer:", e);
    }
  }, [isSendMoneyOpen]);

  // Voice command direct handler for transaction pre-populations
  useEffect(() => {
    const handleVoiceSendMoney = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      const { recipient, amount } = detail;
      // Search standard recipients list for matches
      const matched = recipients.find(
        (r) =>
          (r.fullName || '').toLowerCase().includes((recipient || '').toLowerCase()) ||
          r.nickname?.toLowerCase().includes((recipient || '').toLowerCase()),
      );
      if (matched) {
        setPreselectedRecipient(matched);
      } else {
        // Instantly generate a secure dynamic recipient if payee doesn't exist
        const dynamicRecipient: Recipient = {
          id: `rec_voice_${Date.now()}`,
          fullName: recipient,
          bankName: "First Pacific Strategic Clearance Desk",
          accountNumber: `FPB-LN-${Math.floor(100000 + Math.random() * 900000)}`,
          isFavorite: false,
          userId: userProfile?.email,
          country: {
            name: "United States",
            code: "US",
            currency: "USD",
            symbol: "$",
          },
          realDetails: {
            accountNumber: "FPB-CORE-CLEAR",
            swiftBic: "FPBUS33",
            bankAddress: "Sovereign Node Suite 101, San Francisco",
          },
        };
        setRecipients((prev) => [...prev, dynamicRecipient]);
        db.saveRecipient(dynamicRecipient);
        setPreselectedRecipient(dynamicRecipient);
      }

      // Set the active modal state
      setSendMoneyTab("send");
      setIsSendMoneyOpen(true);
    };

    window.addEventListener("TRIGGER_VOICE_SEND_MONEY", handleVoiceSendMoney);
    return () =>
      window.removeEventListener(
        "TRIGGER_VOICE_SEND_MONEY",
        handleVoiceSendMoney,
      );
  }, [recipients]);

  // Voice command direct support form shortcut triggers
  useEffect(() => {
    const handleVoiceSupport = () => {
      setIsContactSupportOpen(true);
    };
    window.addEventListener("TRIGGER_VOICE_SUPPORT", handleVoiceSupport);
    return () =>
      window.removeEventListener("TRIGGER_VOICE_SUPPORT", handleVoiceSupport);
  }, []);

  // Voice command card toggle
  useEffect(() => {
    const handleVoiceToggleCard = () => {
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          controls: { ...c.controls, isFrozen: !c.controls?.isFrozen },
        }))
      );
    };
    window.addEventListener("TRIGGER_VOICE_TOGGLE_CARD", handleVoiceToggleCard);
    return () =>
      window.removeEventListener("TRIGGER_VOICE_TOGGLE_CARD", handleVoiceToggleCard);
  }, []);

  const [transactionToRepeat, setTransactionToRepeat] =
    useState<Transaction | null>(null);
  const [wireTransferInitialData, setWireTransferInitialData] =
    useState<any>(null);
  const [supportTransactionId, setSupportTransactionId] = useState<
    string | undefined
  >(undefined);
  const [isLinkBankAccountModalOpen, setIsLinkBankAccountModalOpen] =
    useState(false);
  const [legalModalContent, setLegalModalContent] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // AI Advisor State
  const [advisorAnalysis, setAdvisorAnalysis] = useState<any>(null);

  // --- Derived State ---

  const btcBalance = useMemo(
    () => {
      if (!cryptoHoldings || !Array.isArray(cryptoHoldings)) return 0;
      return cryptoHoldings.find((h) => h?.assetId === "btc")?.amount || 0;
    },
    [cryptoHoldings],
  );
  const portfolioChange24h = useMemo(() => 1.25, []);

  // --- Effects & Hooks ---

  useEffect(() => {
    if (marketData && marketData.crypto) {
      setCryptoAssets((prevAssets) =>
        prevAssets.map((asset) => {
          const rtPrice = (marketData.crypto as Record<string, number>)[
            asset.symbol.toUpperCase()
          ];
          if (rtPrice) {
            const newHistory = [...asset.priceHistory.slice(1), rtPrice];
            return { ...asset, price: rtPrice, priceHistory: newHistory };
          }
          return asset;
        }),
      );
    }
  }, [marketData]);

  const activeInactivityTimeout = securitySettings.forceLockEnabled
    ? securitySettings.forceLockTimeout || 30000
    : 300000;

  const warningCountdownDuration = Math.min(50, Math.max(10, Math.floor(activeInactivityTimeout / 1000) - 10));
  const warningTriggerTimeout = activeInactivityTimeout - (warningCountdownDuration * 1000);

  useInactivityTimer(
    () => {
      if (isAuthenticated && !isSessionLocked && !showInactivityWarning) {
        setShowInactivityWarning(true);
      }
    },
    warningTriggerTimeout,
    isAuthenticated && !isSessionLocked && !showInactivityWarning,
  );

  // Capture and audit route navigation automatically
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      db.logUserAction("navigate_view", { pathname: location.pathname });
    }
  }, [location.pathname, isAuthenticated, !!userProfile]);

  // Asynchronously load account database records on authentication
  useEffect(() => {
    if (isAuthenticated && userProfile?.email) {
      const loadUserDatabaseContent = async () => {
        try {
          setIsAccountsLoading(true);
          const [userAccs, userRecipients, userLoans] = await Promise.all([
            db.getAccounts(userProfile.email),
            db.getRecipients(userProfile.email),
            db.getLoanApplications()
          ]);
          if (userAccs && userAccs.length > 0) {
            setAccounts(userAccs);
          }
          setRecipients(userRecipients);
          setLoanApplications(userLoans);
        } catch (err) {
          console.error(
            "[App] Failed to asynchronously load system records:",
            err,
          );
        } finally {
          setIsAccountsLoading(false);
        }
      };
      
      loadUserDatabaseContent();
    } else {
      setAccounts([]);
      setTransactions([]);
      setIsAccountsLoading(false);
    }
  }, [isAuthenticated, userProfile?.email]);

  useEffect(() => {
    if (offlineOverride || !isOnline) {
      try {
        const cachedAccountsStr = localStorage.getItem('fpb_cached_accounts');
        const cachedTransactionsStr = localStorage.getItem('fpb_cached_transactions');
        if (cachedAccountsStr) {
          const cachedAccounts = JSON.parse(cachedAccountsStr);
          setAccounts(cachedAccounts);
          setIsAccountsLoading(false);
        }
        if (cachedTransactionsStr) {
          const cachedTransactions = JSON.parse(cachedTransactionsStr);
          setTransactions(cachedTransactions);
        }
      } catch (e) {
        console.error("Failed to load cached offline data", e);
      }
    } else if (isAuthenticated && userProfile?.email) {
      db.getAccounts(userProfile.email).then(liveAccs => {
        if (liveAccs && liveAccs.length > 0) {
          setAccounts(liveAccs);
        }
        setIsAccountsLoading(false);
      }).catch(err => {
        console.error("Error loading live accounts on reconnection:", err);
        setIsAccountsLoading(false);
      });
      
      if (userProfile.role === 'super_admin') {
        db.getAllTransactions().then(liveTxs => setTransactions(liveTxs));
      } else {
        db.getTransactionsForUser(userProfile.email).then(liveTxs => setTransactions(liveTxs));
      }
    }
  }, [offlineOverride, isOnline, isAuthenticated, userProfile?.email, userProfile?.role]);

  // --- Memoized Batch Transaction Processor for High-Frequency Updates (1000+ Users) ---
  const pendingTxBatchRef = useRef<Transaction[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const batchProcessTransactions = useCallback((incomingTxs: Transaction[]) => {
    pendingTxBatchRef.current = incomingTxs;
    if (batchTimerRef.current) return;
    batchTimerRef.current = setTimeout(() => {
      batchTimerRef.current = null;
      const batch = pendingTxBatchRef.current;
      if (!batch || batch.length === 0) return;

      setTransactions((prev) => {
        const txMap = new Map<string, Transaction>(prev.map((t) => [t.id, t]));
        let hasChanges = false;
        for (const t of batch) {
          const existing = txMap.get(t.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
            txMap.set(t.id, t);
            hasChanges = true;
          }
        }
        if (!hasChanges && prev.length === txMap.size) return prev;
        return Array.from(txMap.values()).sort(
          (a, b) => new Date(b.timestamp || Date.now()).getTime() - new Date(a.timestamp || Date.now()).getTime()
        );
      });
    }, 120);
  }, []);

  // Real-Time Global Firestore Database & Multi-User Account Listener Synchronization
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.email) return;

    let unsubUserDoc: (() => void) | null = null;
    let unsubAccountDoc: (() => void) | null = null;
    let unsubTxCollection: (() => void) | null = null;

    if (userProfile?.email) {
      const currentEmail = userProfile.email.toLowerCase().trim();

      try {
        // 1. Live Firestore User Profile Listener across active multi-user sessions
        const userQ = query(collection(firestore, "users"), where("email", "==", currentEmail));
        unsubUserDoc = onSnapshot(userQ, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data() as any;
            if (userData && userData.profile) {
              console.log("⚡ [App Live Firestore Sync] Real-time User Profile updated across session:", userData.profile);
              setUserProfile((prev) => (prev ? { ...prev, ...userData.profile } : userData.profile));
              sessionStorage.setItem("active_user_profile", JSON.stringify(userData.profile));
              if (userData.profile.securitySettings) {
                setSecuritySettings(userData.profile.securitySettings);
              }
            }
          }
        }, (err) => console.warn('[App Firestore] User listener note:', err.message));

        // 2. Live Firestore Accounts & Balance Syncing Listener
        const accQ = query(collection(firestore, "accounts"), where("email", "==", currentEmail));
        unsubAccountDoc = onSnapshot(accQ, (snapshot) => {
          if (!snapshot.empty) {
            const accData = snapshot.docs[0].data();
            if (accData && Array.isArray(accData.accounts)) {
              console.log("⚡ [App Live Firestore Sync] Real-time Accounts & Balances synced across session:", accData.accounts.length);
              setAccounts(accData.accounts);
              setIsAccountsLoading(false);
            }
          }
        }, (err) => console.warn('[App Firestore] Accounts listener note:', err.message));

        // 3. Live Firestore Transactions Listener with Memoized Batching (1000+ users)
        const txCol = collection(firestore, "transactions");
        unsubTxCollection = onSnapshot(txCol, (snapshot) => {
          const liveDocs: Transaction[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Transaction));

          if (liveDocs.length > 0) {
            if (userProfile.role === 'super_admin' || userProfile.role === 'admin') {
              batchProcessTransactions(liveDocs);
            } else {
              const userTxs = liveDocs.filter(t => {
                const isSender = (t as any).senderEmail?.toLowerCase().trim() === currentEmail || t.accountId === currentEmail;
                const isRecipient = t.recipient?.email?.toLowerCase().trim() === currentEmail || (t as any).recipientEmail?.toLowerCase().trim() === currentEmail;
                return isSender || isRecipient;
              });
              batchProcessTransactions(userTxs);
            }
          }
        }, (err) => console.warn('[App Firestore] Transactions listener note:', err.message));

      } catch (fsErr) {
        console.warn('[App Firestore] Listener setup note:', fsErr);
      }
    }

    const handleUsersUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (userProfile?.email) {
        const currentEmail = userProfile.email.toLowerCase().trim();
        let targetProfile: UserProfile | undefined;

        if (detail) {
          if (detail[currentEmail] && detail[currentEmail].profile) {
            targetProfile = detail[currentEmail].profile;
          } else if (detail.oldEmail && detail.oldEmail.toLowerCase().trim() === currentEmail) {
            targetProfile = detail.profile;
          } else if (detail.email && detail.email.toLowerCase().trim() === currentEmail) {
            targetProfile = detail.profile;
          }
        }

        if (targetProfile) {
          console.log("⚡ [App Sync] Real-time Profile update received from db_users_updated:", targetProfile);
          setUserProfile(targetProfile);
          sessionStorage.setItem("active_user_profile", JSON.stringify(targetProfile));
          if (targetProfile.securitySettings) {
            setSecuritySettings(targetProfile.securitySettings);
          }
        } else {
          db.getUserProfile(userProfile.email).then(updatedProfile => {
            if (updatedProfile) {
              setUserProfile(updatedProfile);
              sessionStorage.setItem("active_user_profile", JSON.stringify(updatedProfile));
              if (updatedProfile.securitySettings) {
                setSecuritySettings(updatedProfile.securitySettings);
              }
            }
          });
        }
      }
    };

    const handleAccountsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (userProfile?.email) {
        const currentEmail = userProfile.email.toLowerCase().trim();
        let updatedAccounts: Account[] | undefined;

        if (detail) {
          if (Array.isArray(detail)) {
            updatedAccounts = detail;
          } else if (Array.isArray(detail[currentEmail])) {
            updatedAccounts = detail[currentEmail];
          } else if (detail.email && detail.email.toLowerCase().trim() === currentEmail && Array.isArray(detail.accounts)) {
            updatedAccounts = detail.accounts;
          }
        }

        if (updatedAccounts) {
          setAccounts(updatedAccounts);
          setIsAccountsLoading(false);
        } else {
          db.getAccounts(userProfile.email).then(accs => {
            if (accs) setAccounts(accs);
            setIsAccountsLoading(false);
          }).catch(() => setIsAccountsLoading(false));
        }
      }
    };

    const handleTransactionsUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        batchProcessTransactions(detail);
      } else {
        if (userProfile?.email) {
          if (userProfile.role === 'super_admin' || userProfile.role === 'admin') {
            db.getAllTransactions().then(txs => batchProcessTransactions(txs));
          } else {
            let userTransactions = await db.getTransactionsForUser(userProfile.email);
            batchProcessTransactions(userTransactions);
          }
        }
      }
    };

    const handleRecipientsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        if (userProfile?.email) {
          const emailKey = userProfile.email.toLowerCase().trim();
          setRecipients(detail.filter((r: any) => {
            const isSystemSeeded = ['rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5'].includes(r.id);
            return isSystemSeeded || (r.userId && r.userId.toLowerCase().trim() === emailKey);
          }));
        } else {
          setRecipients(detail.filter((r: any) => ['rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5'].includes(r.id)));
        }
      }
    };

    const handleLoansUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setLoanApplications(detail);
      }
    };

    const handleRealtimeLedgerUpdate = async () => {
      if (userProfile?.email) {
        try {
          const emailKey = userProfile.email.toLowerCase().trim();
          // @ts-ignore
          if (db.accounts) {
            // @ts-ignore
            db.accounts.delete(emailKey);
          }
          
          const liveAccs = await db.getAccounts(userProfile.email);
          setAccounts(liveAccs);
          
          if (userProfile.role === "super_admin" || userProfile.role === "admin") {
            const liveTxs = await db.getAllTransactions();
            batchProcessTransactions(liveTxs);
          } else {
            db.getTransactionsForUser(userProfile.email).then(liveTxs => batchProcessTransactions(liveTxs));
          }
        } catch (err) {
          console.error("Error refreshing ledger in REALTIME_LEDGER_UPDATE:", err);
        }
      }
    };

    window.addEventListener("db_users_updated", handleUsersUpdate);
    window.addEventListener("db_accounts_updated", handleAccountsUpdate);
    window.addEventListener("db_transactions_updated", handleTransactionsUpdate);
    window.addEventListener("db_recipients_updated", handleRecipientsUpdate);
    window.addEventListener("db_loans_updated", handleLoansUpdate);
    window.addEventListener("REALTIME_LEDGER_UPDATE", handleRealtimeLedgerUpdate);

    // Periodic Reconciliation Check
    const reconciliationInterval = setInterval(() => {
      handleRealtimeLedgerUpdate();
    }, 60000);

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubAccountDoc) unsubAccountDoc();
      if (unsubTxCollection) unsubTxCollection();
      clearInterval(reconciliationInterval);
      window.removeEventListener("db_users_updated", handleUsersUpdate);
      window.removeEventListener("db_accounts_updated", handleAccountsUpdate);
      window.removeEventListener("db_transactions_updated", handleTransactionsUpdate);
      window.removeEventListener("db_recipients_updated", handleRecipientsUpdate);
      window.removeEventListener("db_loans_updated", handleLoansUpdate);
      window.removeEventListener("REALTIME_LEDGER_UPDATE", handleRealtimeLedgerUpdate);
    };
  }, [isAuthenticated, userProfile?.email, batchProcessTransactions]);

  // --- Background Compliance Observer ---
  // Watches for new/resolved compliance codes associated with AWAITING_PAYMENT_VERIFICATION transactions
  const processedComplianceCodeTxIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !transactions || transactions.length === 0) return;

    const checkAndResolveComplianceCodes = async () => {
      // Look for transactions in AWAITING_PAYMENT_VERIFICATION status
      const awaitingTxs = transactions.filter(tx => 
        (tx.status === TransactionStatus.AWAITING_PAYMENT_VERIFICATION || 
         tx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE ||
         (tx as any).status === 'Awaiting Payment Verification' ||
         (tx as any).status === 'Flagged (Awaiting Clearance)') &&
        !processedComplianceCodeTxIds.current.has(tx.id)
      );

      if (awaitingTxs.length === 0) return;

      for (const tx of awaitingTxs) {
        let latestTx = tx;
        try {
          const allDbTxs = await db.getAllTransactions();
          const match = allDbTxs.find(t => t.id === tx.id);
          if (match) latestTx = match;
        } catch (e) {
          console.warn("[Compliance Observer] Reading DB error:", e);
        }

        const authCode = latestTx.regulatoryAuthCode || (latestTx as any).complianceCode || (latestTx as any).authCode;
        const isResolved = Boolean(
          authCode && (
            (latestTx as any).codeResolved === true ||
            (latestTx as any).isCodeVerified === true ||
            latestTx.status === TransactionStatus.COMPLETED
          )
        );

        if (isResolved) {
          processedComplianceCodeTxIds.current.add(tx.id);
          console.log(`🛡️ [Background Observer] Resolved compliance code detected for tx ${tx.id}. Auto-updating status to COMPLETED.`);

          const updatedTx: Transaction = {
            ...latestTx,
            status: TransactionStatus.COMPLETED,
            statusTimestamps: {
              ...(latestTx.statusTimestamps || {}),
              [TransactionStatus.COMPLETED]: new Date()
            }
          };

          try {
            await db.saveTransaction(updatedTx);
            await db.updateTransactionStatus(tx.id, TransactionStatus.COMPLETED);

            setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));

            window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { detail: [updatedTx] }));
            window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: [updatedTx] }));

            const amtFormatted = (tx.sendAmount || tx.receiveAmount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            addNotification(
              NotificationType.SECURITY,
              "Compliance Code Resolved & Funds Cleared",
              `Compliance clearance granted for transaction ${tx.id} (${amtFormatted}). Status updated to COMPLETED.`
            );

            // Send detailed compliance code resolution breakdown via SecureMessageCenter
            try {
              const recipientUserEmail = (tx as any).senderEmail || (tx as any).senderDetails?.email || (await db.getEmailByAccountId(tx.accountId)) || userProfile?.email;
              if (recipientUserEmail) {
                const codeValue = authCode || 'HALT-CLEARED';
                const beneficiaryName = tx.recipient?.fullName || (tx as any).recipientName || 'External Beneficiary';
                const recipientCountry = tx.recipient?.country?.name || tx.recipient?.country?.code || 'International';
                const timestampStr = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

                const flagReasonDescription = (tx as any).holdReason || (tx as any).flagReason || 
                  "Transaction held under Federal Banking Regulation AML/BSA Article 4A due to high-value interbank liquidity routing, cross-border settlement controls, or mandatory authorization code requirements.";

                const resolutionDescription = (tx.paymentProof || (tx as any).screenshotProof) ?
                  `Clearance code (${codeValue}) and uploaded settlement payment proof were verified by our automated compliance audit module and cleared for instant ledger release.` :
                  `Compliance authorization key (${codeValue}) was successfully validated and approved by the Compliance Audit Division. Status toggled to COMPLETED.`;

                const detailedBreakdownHtml = `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; margin-bottom: 4px;">First Pacific Bank & Trust — Operations & Security</div>
                      <h2 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #ffffff;">Compliance Clearance Audit Report</h2>
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Official Settlement Notice • Reference #${tx.id}</div>
                    </div>

                    <div style="padding: 24px;">
                      <p style="font-size: 14px; color: #334155; margin-top: 0; line-height: 1.5;">
                        Dear Valued Client,
                      </p>
                      <p style="font-size: 13px; color: #334155; line-height: 1.6;">
                        This official notice confirms that the regulatory compliance hold associated with your transaction <strong>#${tx.id}</strong> has been <strong>successfully resolved and cleared</strong>. All security restrictions have been lifted, and the transaction is now <span style="color: #059669; font-weight: bold;">COMPLETED</span>.
                      </p>

                      <!-- Transaction Summary Box -->
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <h4 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #475569; font-weight: 800;">Transaction Settlement Summary</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                          <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Transaction ID:</td>
                            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${tx.id}</td>
                          </tr>
                          <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Settlement Amount:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 800; color: #0f172a; font-size: 14px;">${amtFormatted}</td>
                          </tr>
                          <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Beneficiary Name:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${beneficiaryName} (${recipientCountry})</td>
                          </tr>
                          <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Compliance Auth Code:</td>
                            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0284c7;">${codeValue}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Resolution Timestamp:</td>
                            <td style="padding: 8px 0; text-align: right; color: #475569; font-weight: 600;">${timestampStr}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Flagging Reason Section -->
                      <div style="background-color: #fffbebfb; border-left: 4px solid #d97706; padding: 14px; border-radius: 4px; margin: 16px 0;">
                        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px; margin-bottom: 4px;">Initial Hold & Flagging Reason</div>
                        <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.5;">${flagReasonDescription}</p>
                      </div>

                      <!-- Resolution Breakdown Section -->
                      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; border-radius: 4px; margin: 16px 0;">
                        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: 0.5px; margin-bottom: 4px;">Resolution & Clearance Method</div>
                        <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.5;">${resolutionDescription}</p>
                      </div>

                      <p style="font-size: 12px; color: #64748b; margin-top: 20px; line-height: 1.5;">
                        Your account ledger and balance have been updated immediately to reflect this clearance. You can view full transaction receipts and audit trail timestamps in your account dashboard.
                      </p>
                    </div>

                    <div style="background-color: #f8fafc; padding: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
                      First Pacific Bank & Trust Compliance Division • Automated Ledger Protection System
                    </div>
                  </div>
                `;

                await db.sendSecureMessage({
                  senderId: 'compliance@firstpaba.com',
                  receiverId: recipientUserEmail,
                  subject: `Compliance Code Resolution Report: Transaction #${tx.id} Cleared`,
                  content: detailedBreakdownHtml,
                  isPriority: true
                });
                console.log(`[Compliance Observer] Dispatched detailed breakdown message for tx ${tx.id} to ${recipientUserEmail}`);
              }
            } catch (msgErr) {
              console.warn("[Compliance Observer] Error sending secure message breakdown:", msgErr);
            }
          } catch (err) {
            console.error("[Compliance Observer] Error auto-completing tx:", err);
          }
        }
      }
    };

    checkAndResolveComplianceCodes();

    const handleCodeResolvedEvent = () => {
      checkAndResolveComplianceCodes();
    };

    window.addEventListener('COMPLIANCE_CODE_RESOLVED', handleCodeResolvedEvent);
    window.addEventListener('admin:resolve_intervention', handleCodeResolvedEvent);

    return () => {
      window.removeEventListener('COMPLIANCE_CODE_RESOLVED', handleCodeResolvedEvent);
      window.removeEventListener('admin:resolve_intervention', handleCodeResolvedEvent);
    };
  }, [transactions, isAuthenticated, addNotification]);

  // Fast sync of card holder names to currently active profile
  useEffect(() => {
    if (userProfile && userProfile.name) {
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          cardholderName: userProfile.name.toUpperCase(),
        })),
      );
      setVirtualCards((prev) =>
        prev.map((c) => ({
          ...c,
          nickname: userProfile.name.toUpperCase() + " VIRTUAL",
        })),
      );
    }
  }, [userProfile?.name]);

  // Listen for custom simulated SMS events from the notification service
  // REMOVED: Simulated OTP listener removed to enforce real Twilio SMS usage as per user request.

  useEffect(() => {
    if (
      !showLanding &&
      !isAuthenticated &&
      !isBooting &&
      location.pathname !== "/" &&
      !verificationEmail &&
      !isCreatingAccount
    ) {
      navigate("/");
    }
  }, [
    showLanding,
    isAuthenticated,
    isBooting,
    location,
    verificationEmail,
    isCreatingAccount,
    navigate,
  ]);

  // Listen to Supabase auth state changes (handles automatic login on email verification links)
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "[App] Supabase auth state change listener:",
        event,
        session?.user?.email,
      );
      if (session?.user) {
        // If they have an unconfirmed email, redirect them to the verify screen and don't sign in
        if (!session.user.email_confirmed_at) {
          setVerificationEmail(session.user.email || null);
          setIsAuthenticated(false);
          return;
        }

        // If confirmed, auto-fetch profile and sign them in!
        const email = session.user.email!;
        const metadata = session.user.user_metadata || {};
        const profile: UserProfile = {
          name: metadata.full_name || "User",
          email: email,
          phone: metadata.phone || "",
          profilePictureUrl:
            metadata.profile_picture_url ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop",
          lastLogin: { date: new Date(), from: "Supabase Verification Link" },
        };

        // Sync with the database service
        await db.syncUserProfile(email);

        // Complete log in sequence
        setUserProfile(profile);
        setVerificationEmail(null);
        setIsCreatingAccount(false);
        setShowLanding(false);

        // Boot standard flow if not already authenticated
        if (!isAuthenticated) {
          setIsAuthenticated(true);
          setIsBooting(true);
          await db.logUserAction("auth_login_verified_link", { email });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const applyTheme = (mode: "light" | "dark" | "system" = "dark") => {
      document.documentElement.classList.remove("dark");
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else if (mode === "system") {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          document.documentElement.classList.add("dark");
        }
      }
    };

    applyTheme(platformSettings.themeMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme(platformSettings.themeMode);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [platformSettings.themeMode]);

  useEffect(() => {
    localStorage.setItem("platform_settings", JSON.stringify(platformSettings));
  }, [platformSettings]);

  useEffect(() => {
    if (platformSettings.customPrimaryColor) {
      applyThemeColor(platformSettings.customPrimaryColor);
    } else {
      resetThemeColor();
    }
  }, [platformSettings.customPrimaryColor]);

  // --- Handlers ---

  const handleLogin = async (profile: UserProfile) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
    setShowLanding(false);
    sessionStorage.setItem("active_user_profile", JSON.stringify(profile));
    if (profile.securitySettings) {
      setSecuritySettings(profile.securitySettings);
    }
    setVerificationEmail(null);
    setIsLoggedOut(false);

    // Fetch accounts and transactions asynchronously
    db.getAccounts(profile.email)
      .then((userAccounts) => {
        setAccounts(userAccounts);
      })
      .catch((err) => {
        console.error("[App] Async accounts prefetch failed:", err);
      });

    db.getTransactionsForUser(profile.email)
      .then((userTxs) => {
        setTransactions(userTxs);
      })
      .catch((err) => {
        console.error("[App] Async tx prefetch failed:", err);
      });

    // Log successful login action
    await db.logUserAction("auth_login", {
      email: profile.email,
      name: profile.name,
      role: profile.role,
    });

    // Stage 2 to Stage 3 Transition: Successful Login triggers Boot Sequence
    setIsBooting(true);

    // REAL BANK BEHAVIOR: Trigger Security Alerts on Login with dynamic telemetry alerts sent directly to registered email
    setTimeout(async () => {
      try {
        const telemetry = await getClientTelemetry();
        // Send the rich device telemetry specifically to the logged-in user's registered email
        await sendLoginAlert(telemetry, profile.email);

        const storedLoc =
          profile.lastLogin?.from || "Guntersville, AL (United States)";
        if (
          telemetry.location &&
          storedLoc &&
          !telemetry.location
            .toLowerCase()
            .includes(storedLoc.split(",")[0].toLowerCase().trim())
        ) {
          setTimeout(() => {
            sendLocationChangeAlert(storedLoc, telemetry.location);
          }, 4000);
        }
      } catch (err) {
        console.error(
          "[Telemetry] Failed to resolve live device telemetry. Falling back gracefully.",
          err,
        );
        // Graceful legacy fallback
        const storedLoc = profile.lastLogin?.from || "Guntersville, AL";
        sendLoginAlert("iPhone 15 Pro", storedLoc, profile.email);
      }
    }, 1500);
  };

  const handleLogout = async () => {
    if (userProfile) {
      await db.logUserAction("auth_logout", { email: userProfile.email });
    }
    sessionStorage.removeItem("active_user_profile");
    setIsAuthenticated(false);
    setIsBooting(false);
    setIsLoggedOut(true);
    setVerificationEmail(null);
    setIsLogoutConfirmOpen(false);
    setIsMenuOpen(false);
  };

  const runFinancialAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(false);
    const snapshot = {
      netWorth: totalNetWorth,
      accounts: accounts.map((a) => ({ type: a.type, balance: (a?.balance || 0) })),
      recentTransactions: transactions
        .slice(0, 10)
        .map((t) => ({
          amount: t.sendAmount,
          category: t.purpose || "General",
          type: t.type,
        })),
      crypto: cryptoHoldings.map((h) => ({
        asset: h.assetId,
        amount: h.amount,
      })),
      loans: loanApplications.map((l) => ({
        product: l.loanProduct.name,
        amount: l.amount,
      })),
    };

    await db.logUserAction("run_financial_analysis", {
      netWorth: totalNetWorth,
    });

    const result = await getFinancialAnalysis(JSON.stringify(snapshot));
    if (result.isError) setAnalysisError(true);
    else setAdvisorAnalysis(result.analysis);
    setIsAnalyzing(false);
  };

  const handleCreateTransaction = async (
    tx: CreateTransactionInput,
    prefix: string = "TX",
  ): Promise<Transaction | null> => {
    let status = TransactionStatus.SUBMITTED;
    let timestamps: any = { [TransactionStatus.SUBMITTED]: new Date() };
    let matchedInternalUser: any = null;

    if (userProfile.isSuspended || userProfile.isFrozen) {
      addNotification(
        NotificationType.SECURITY,
        "Transaction Blocked",
        userProfile.isFrozen ? "Your account is currently frozen. No outgoing transactions are permitted." : "Your account is currently suspended from making outgoing transactions.",
      );
      return null; // Or throw Error
    }

    // --- REAL-TIME INTUITIVE SAME-BANK VS EXTERNAL DETECTOR ---
    let isSameBankTransfer = false;

    // 1. If it's a transfer between the user's own accounts or category is set as local transfer:
    if (!tx.recipient || (tx.recipient as any).isSelf || tx.type === "transfer") {
      isSameBankTransfer = true;
    }

    // 2. Or if recipient's bank explicitly references First Pacific internal structures
    const targetBank = (tx.recipient?.bankName || "").toLowerCase();
    if (
      targetBank.includes("first pacific") ||
      targetBank.includes("firstpacific") ||
      targetBank.includes("fpb") ||
      targetBank.includes("sovereign")
    ) {
      isSameBankTransfer = true;
    }

    // 3. Look up registered bank database users to match P2P instant transfers
    try {
      const allAppUsers = await db.getAllUsers();
      const recipientEmail = (
        tx.recipient?.email ||
        tx.recipient?.serviceIdentifier ||
        ""
      )
        .toLowerCase()
        .trim();
      const recipientAcctNumber = (
        tx.recipient?.realDetails?.accountNumber ||
        tx.recipient?.accountNumber ||
        ""
      ).replace(/\s/g, "");

      let targetUser = allAppUsers.find((u) => {
        const entryEmail = (u.email || '').toLowerCase().trim();
        return (
          entryEmail &&
          (entryEmail === recipientEmail ||
            (u.profile.phone && u.profile.phone === tx.recipient?.phone))
        );
      });

      if (!targetUser && recipientAcctNumber) {
        for (const u of allAppUsers) {
          const uAccounts = await db.getAccounts(u.email);
          const hasMatchingAccount = uAccounts.some((acc) => {
            const cleanFull = (
              acc.fullAccountNumber ||
              acc.accountNumber ||
              ""
            ).replace(/\s/g, "");
            return cleanFull && cleanFull === recipientAcctNumber;
          });
          if (hasMatchingAccount) {
            targetUser = u;
            break;
          }
        }
      }
      if (targetUser) {
        isSameBankTransfer = true;
        matchedInternalUser = targetUser;
      }
    } catch (e) {
      console.warn("[DB Lookup Same-Bank Detect] ", e);
    }

    const isMandatoryApproval = !!userProfile.requireAdminApprovalForPayments;
    const isAwaitingVerification = !!userProfile.awaitingPaymentVerificationEnabled;

    // Same-Bank transfers settle instantly. External transfers are subject to clearance/compliance locks.
    const isBankToBankTransfer = false;
    let authCode: string | undefined = undefined;

    if (isAwaitingVerification) {
      status = TransactionStatus.AWAITING_PAYMENT_VERIFICATION;
      timestamps[TransactionStatus.AWAITING_PAYMENT_VERIFICATION] = new Date();
      console.log(
        "[Clearance] Transaction staged in Awaiting Payment Verification due to active user-specific security override."
      );
    } else if (isSameBankTransfer || isBankToBankTransfer) {
      status = TransactionStatus.CLEARANCE_GRANTED;
      timestamps[TransactionStatus.CLEARANCE_GRANTED] = new Date();
      timestamps[TransactionStatus.COMPLETED] = new Date();
      console.log(
        "[Clearance] Internal bank transfer satisfied compliance pre-checks: CLEARANCE_GRANTED status assigned instantly.",
      );
    } else {
      // Real-time external transaction compliance monitoring logic for traditional external banks
      const isInternational = tx.recipient?.country && tx.recipient.country.code !== 'US';
      if (
        isMandatoryApproval ||
        (securitySettings.transactionMonitoringEnabled && tx.sendAmount >= 5000) ||
        (isInternational && tx.sendAmount >= 100)
      ) {
        status = TransactionStatus.FLAGGED_AWAITING_CLEARANCE;
        timestamps[TransactionStatus.FLAGGED_AWAITING_CLEARANCE] = new Date();

        const formattedAmount = tx.sendAmount.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        const message = isMandatoryApproval
          ? `Your transfer of ${formattedAmount} requires manual security clearance. Please review the clearance instructions sent to your secure inbox or contact compliance support.`
          : `Your transfer of ${formattedAmount} has triggered a regulatory clearance hold. To release your funds and complete the transfer, please review the clearance instructions sent to your secure inbox or contact compliance support at contact@firstpaba.com.`;

        setFlaggedNotification({
          message,
          amount: formattedAmount,
          transactionId: `${prefix}-${Date.now()}`,
        });
        setTimeout(() => setFlaggedNotification(null), 30000);

        addNotification(
          NotificationType.SECURITY,
          "Transaction Flagged & Held",
          message,
        );
        sendSecurityAlertSms("Transaction Flagged & Held");
      }

      const exceedsThreshold =
        pushSettings.alertOnAmountEnabled &&
        tx.sendAmount >= (pushSettings.alertAmountThreshold || 1000);
      const isFlagged = status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE;

      if (
        exceedsThreshold ||
        (isFlagged && pushSettings.alertOnFlaggedEnabled)
      ) {
        const formattedAmount = tx.sendAmount.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });

        if (isFlagged && pushSettings.alertOnFlaggedEnabled) {
          const title = "⚠️ TRANSACTION HELD / FLAGGED";
          const pushMsg = `Your transfer of ${formattedAmount} requires senior clearance and was held for compliance review.`;
          addNotification(NotificationType.SECURITY, title, pushMsg);

          const smsMsg = `First Pacific Global Alert 🚨: Compliance hold applied to transfer.\n\nTrx ID: ${prefix}-${Date.now()}\nAmount: ${formattedAmount}\nStatus: STAGED FOR AUDIT\n\nAccess firstpaba.com/secure to authorize.`;
          import("../services/smsService")
            .then(({ sendTwilioSms }) => {
              sendTwilioSms(userProfile.phone || "3159150854", smsMsg)
                .then((res) => {
                  if (!res.success && res.error) {
                    addNotification(
                      NotificationType.ALERT,
                      "SMS Delivery Failed",
                      "Twilio API Server Error: " + res.error,
                    );
                  }
                })
                .catch(console.error);
            })
            .catch(console.error);
        } else if (exceedsThreshold) {
          const title = "💸 HIGH-VALUE TRANSACTION ALERT";
          const pushMsg = `An automated alert was triggered for your transaction of ${formattedAmount} meeting threshold rules.`;
          addNotification(NotificationType.ALERT, title, pushMsg);

          const smsMsg = `First Pacific Security 🛡️: Outbound asset flow detected.\n\nAmount: ${formattedAmount}\nReceiver: ${tx.recipient?.fullName || tx.description || "Verified Receiver"}\n\nIf unauthorized, freeze terminal immediately via your client Security Dashboard.`;
          import("../services/smsService")
            .then(({ sendTwilioSms }) => {
              sendTwilioSms(userProfile.phone || "3159150854", smsMsg)
                .then((res) => {
                  if (!res.success && res.error) {
                    addNotification(
                      NotificationType.ALERT,
                      "SMS Delivery Failed",
                      "Twilio API Server Error: " + res.error,
                    );
                  }
                })
                .catch(console.error);
            })
            .catch(console.error);
        }
      }
    }

    let category = tx.category || undefined;
    let tags = tx.tags || undefined;
    let confidence = tx.confidence || undefined;

    try {
      const aiResponse = await fetch("/api/gemini/auto-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: tx.description || "Outbound transfer",
          amount: tx.sendAmount,
          recipientName: tx.recipient?.nickname || tx.recipient?.fullName || "",
        }),
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        category = aiData.category;
        tags = aiData.tags;
        confidence = aiData.confidence;
      }
    } catch (err) {
      console.warn(
        "[AI Categorization] Error fetching auto-categorization:",
        err,
      );
    }

    const srcAccount =
      accounts.find((a) => a.id === tx.accountId) ||
      accounts.find((a) => a.accountNumber === tx.accountId || a.fullAccountNumber === tx.accountId) ||
      accounts.find((a) => a.type === AccountType.CHECKING) ||
      accounts[0];

    // Detect if this is an internal transfer between the user's own accounts
    const selfTargetAccount = accounts.find(
      (a) =>
        srcAccount &&
        a.id !== srcAccount.id &&
        (a.id === tx.recipient?.accountNumber ||
          a.accountNumber === tx.recipient?.accountNumber ||
          a.fullAccountNumber === tx.recipient?.accountNumber ||
          a.id === tx.recipient?.id ||
          (a.nickname && tx.recipient?.fullName && a.nickname.toLowerCase() === tx.recipient.fullName.toLowerCase()))
    );

    const defaultRecipient: Recipient = tx.recipient || ({
      id: `self_${tx.accountId}`,
      fullName: userProfile.name || "Self Transfer",
      email: userProfile.email || "",
      bankName: "First Pacific Bank",
      accountNumber: tx.accountId,
      routingNumber: "121000358",
      country: { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
      realDetails: {
        accountNumber: tx.accountId,
        routingNumber: "121000358",
      },
    } as unknown as Recipient);

    const transactionType = (tx as any).type === "INCOMING_TRANSFER" ? "credit" : ((tx as any).type || "debit");

    const newTx: Transaction = {
      ...tx,
      id: `${prefix}-${Date.now()}`,
      accountId: tx.accountId,
      recipient: defaultRecipient,
      sendAmount: tx.sendAmount,
      receiveAmount: tx.receiveAmount || tx.sendAmount,
      fee: tx.fee || 0,
      complianceFee: tx.complianceFee || 0,
      exchangeRate: tx.exchangeRate || 1,
      estimatedArrival: tx.estimatedArrival || new Date(),
      description: tx.description || tx.purpose || (transactionType === "credit" ? "Incoming Deposit" : "Outbound Transfer"),
      status,
      statusTimestamps: timestamps,
      type: transactionType as "debit" | "credit",
      category: (category || tx.category || "General Transfers") as any,
      tags,
      confidence,
      senderName: userProfile.name,
      regulatoryAuthCode: authCode,
      senderDetails: {
        legalName: userProfile.name,
        financialInstitution: "First Pacific Premium Reserved Bank",
        accountNumberMasked: `•••• ${srcAccount?.accountNumber.slice(-4) || "1184"}`,
        countryCode: "US",
      },
    };

    let incomingTx: any = null;
    let incomingEmail: string | null = null;
    let targetAccountIdForDeduction: string | null = null;

    if (srcAccount) {
      const complianceFeeVal = newTx.complianceFee || 0;
      const feeVal = newTx.fee || 0;

      // --- DETECT P2P INTERNAL TRANSFER TO ANOTHER REGISTERED BANK MEMBER ---
      try {
        const targetUser = matchedInternalUser;

        if (
          targetUser &&
          (targetUser.email || '').toLowerCase().trim() !==
            userProfile.email.toLowerCase().trim()
        ) {
          console.log(
            "[P2P Transfer] Internal recipient matched in database!",
            targetUser.email,
          );
          const targetAccounts = await db.getAccounts(targetUser.email);
          if (targetAccounts && targetAccounts.length > 0) {
            const targetAccount = targetAccounts[0]; // Credit the checking/primary account
            targetAccountIdForDeduction = targetAccount.id;
            
            // Concurrent credit ledger entry for recipient
            const incomingTxId = "P2P-INCOMING-" + Date.now();
            incomingTx = {
              id: incomingTxId,
              accountId: targetAccount.id,
              recipient: {
                id: "sender-" + userProfile.email.replace(/[@.]/g, "-"),
                fullName: userProfile.name,
                bankName: "First Pacific Premium Reserved Bank",
                accountNumber: `•••• ${srcAccount?.accountNumber.slice(-4) || "1184"}`,
                country: {
                  code: "US",
                  name: "United States",
                  currency: "USD",
                  symbol: "$",
                },
                realDetails: {
                  accountNumber: srcAccount?.accountNumber || "",
                  swiftBic: srcAccount?.swiftBic || "",
                },
              },
              sendAmount: newTx.receiveAmount,
              receiveAmount: newTx.receiveAmount,
              fee: 0,
              exchangeRate: 1,
              type: "credit" as const,
              description:
                newTx.description || `Transfer from ${userProfile.name}`,
              status: isSameBankTransfer ? TransactionStatus.CLEARANCE_GRANTED : TransactionStatus.AWAITING_PAYMENT_VERIFICATION,
              estimatedArrival: new Date(),
              statusTimestamps: {
                [TransactionStatus.SUBMITTED]: new Date(),
                ...(isSameBankTransfer ? {
                  [TransactionStatus.CLEARANCE_GRANTED]: new Date(),
                  [TransactionStatus.COMPLETED]: new Date(),
                } : {
                  [TransactionStatus.AWAITING_PAYMENT_VERIFICATION]: new Date(),
                })
              },
              senderName: userProfile.name,
              senderDetails: {
                legalName: userProfile.name,
                financialInstitution: "First Pacific Premium Reserved Bank",
                accountNumberMasked: `•••• ${srcAccount?.accountNumber.slice(-4) || "1184"}`,
                countryCode: "US",
              },
              settlementDetails: {
                traceId:
                  "IMAD-IN-" +
                  Math.floor(100000 + Math.random() * 900000).toString(),
                uetr:
                  Math.random().toString(36).substring(2, 10).toUpperCase() +
                  "-" +
                  Math.random().toString(36).substring(2, 6).toUpperCase(),
                clearingSystemRef: "BOOK-TRANSFER-INTERNAL",
                valueDate: new Date().toISOString(),
              },
              transactionDetails: {
                memo: newTx.description || `P2P peer transfer`,
                senderName: userProfile.name,
              },
            };
            incomingEmail = targetUser.email;
          }
        }
      } catch (err) {
        console.error(
          "[P2P Transfer Error] Failed to execute concurrent internal transfer setup:",
          err,
        );
      }

      const isInternalCleared = status === TransactionStatus.CLEARANCE_GRANTED || isSameBankTransfer;

      // Execute single atomic Firestore transaction to save transaction and adjust balances
      await db.executeTransactionWithDeduction(
        userProfile.email,
        newTx,
        srcAccount.id,
        newTx.sendAmount,
        feeVal,
        complianceFeeVal,
        incomingTx,
        incomingEmail,
        isInternalCleared && matchedInternalUser ? targetAccountIdForDeduction : null
      );

      console.log("[Clearance] Atomic transaction saved and balance updated successfully.");

      // Calculate net balance change for primary account
      const isCreditTx = newTx.type === "credit";
      const netAmountChange = isCreditTx 
        ? (newTx.sendAmount - complianceFeeVal - feeVal)
        : -(newTx.sendAmount + complianceFeeVal + feeVal);

      let selfTargetNewBal = 0;
      if (selfTargetAccount) {
        selfTargetNewBal = parseFloat(((selfTargetAccount.balance || 0) + newTx.receiveAmount).toFixed(2));
        db.updateAccountBalance(userProfile.email, selfTargetAccount.id, selfTargetNewBal).catch(console.warn);
      }

      setAccounts(prevAccounts => 
        prevAccounts.map(acc => {
          if (acc.id === srcAccount.id) {
            const updatedBal = parseFloat(Math.max(0, (acc.balance || 0) + netAmountChange).toFixed(2));
            return { ...acc, balance: updatedBal };
          }
          if (selfTargetAccount && acc.id === selfTargetAccount.id) {
            return { ...acc, balance: selfTargetNewBal };
          }
          return acc;
        })
      );
    }

    // Instantly append new transaction to local React state for global ledger and clearance
    const txEventsList = [newTx, ...(incomingTx ? [incomingTx] : [])];
    setTransactions(prev => [...txEventsList, ...prev.filter(t => !txEventsList.some(e => e.id === t.id))]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { detail: txEventsList }));
      window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: txEventsList }));
    }

    // Log transaction creation
    await db.logUserAction("create_transaction", {
      transactionId: newTx.id,
      accountId: newTx.accountId,
      amount: newTx.sendAmount,
      recipient: newTx.recipient?.fullName,
      status: newTx.status,
      type: newTx.type,
    });

    const postBalance = srcAccount
      ? (srcAccount?.balance || 0) - (newTx.sendAmount + (newTx.fee || 0) + (newTx.complianceFee || 0))
      : 0;
    sendTransactionNotification(
      newTx,
      true,
      userProfile.email,
      postBalance,
      userProfile.name,
      newTx.complianceFee
    );

    // Send real-time active email notification to the recipient of direct transfer
    const recEmail = (
      newTx.recipient?.email ||
      newTx.recipient?.serviceIdentifier ||
      ""
    )
      .toLowerCase()
      .trim();
    const isValidEmail =
      recEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recEmail);
    if (isValidEmail) {
      import("../utils/notificationService")
        .then(({ sendRecipientTransferNotification }) => {
          sendRecipientTransferNotification({
            recipientEmail: recEmail,
            recipientName:
              newTx.recipient?.fullName ||
              newTx.recipient?.nickname ||
              "Beneficiary Partner",
            senderName: userProfile.name || "Sovereign Holder",
            senderEmail: userProfile.email,
            amount: newTx.sendAmount,
            transactionId: newTx.id,
            isInternal: !!matchedInternalUser,
            paymentRail: newTx.transferMethod || "ACH Direct Transfer",
            beneficiaryEmailTone:
              platformSettings.beneficiaryEmailTone || "Detailed",
            recipientDetails: newTx.recipient,
          }).catch((err) =>
            console.error(
              "[Notification] Failed to notify target recipient:",
              err,
            ),
          );
        })
        .catch((err) => console.error("[Notification] Import failed:", err));
    }

    // Trigger 5-second Undo Toast for immediate cancellation before final DB confirmation
    if (newTx.type === "debit" && newTx.status !== TransactionStatus.FAILED) {
      setPendingUndoTx({
        transaction: newTx,
        durationMs: 5000,
        onUndo: async (txToUndo) => {
          try {
            const cancelledTx: Transaction = {
              ...txToUndo,
              status: TransactionStatus.CANCELLED,
              description: `[CANCELLED BY SENDER] ${txToUndo.description}`,
            };
            await db.saveTransaction(cancelledTx);

            if (srcAccount) {
              const refundAmount = txToUndo.sendAmount + (txToUndo.fee || 0) + (txToUndo.complianceFee || 0);
              const restoredBal = parseFloat(((srcAccount.balance || 0) + refundAmount).toFixed(2));
              await db.updateAccountBalance(userProfile.email, srcAccount.id, restoredBal);
              setAccounts(prev =>
                prev.map(acc => acc.id === srcAccount.id ? { ...acc, balance: restoredBal } : acc)
              );
            }

            setTransactions(prev => prev.map(t => t.id === txToUndo.id ? cancelledTx : t));
            window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { detail: [cancelledTx] }));
            window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: [cancelledTx] }));

            addNotification(
              NotificationType.SECURITY,
              "Transfer Cancelled",
              `Your transfer of $${txToUndo.sendAmount.toLocaleString()} to ${txToUndo.recipient?.fullName || 'payee'} was cancelled and funds have been restored.`,
            );
          } catch (err) {
            console.error("Failed to undo transaction:", err);
          }
        },
        onFinalize: (tx) => {
          console.log("[Transfer Cleared & Finalized]", tx.id);
        },
      });
    }

    return newTx;
  };

  // --- Routing & Sequential View Logic ---

  // Stage 1: Public Marketing / Landing Page
  if (
    showLanding &&
    !isAuthenticated &&
    !isBooting &&
    !isCreatingAccount &&
    !verificationEmail &&
    !isLoggedOut
  ) {
    return (
      <AdvancedFirstPage
        onComplete={() => setShowLanding(false)}
        onOpenAccount={() => {
          setShowLanding(false);
          setIsCreatingAccount(true);
          setCreateAccountType("wealth");
        }}
      />
    );
  }

  // Stage 2: Identity Verification (Login)
  if (
    !isAuthenticated &&
    !isBooting &&
    !isCreatingAccount &&
    !verificationEmail
  ) {
    if (isLoggedOut) {
      return (
        <LoggedOut
          user={userProfile}
          onLogin={() => handleLogin(userProfile)}
          onSwitchUser={() => {
            setIsLoggedOut(false);
            navigate("/");
          }}
        />
      );
    }
    return (
      <Welcome
        onLogin={handleLogin}
        onStartCreateAccount={(type) => {
          setIsCreatingAccount(true);
          setCreateAccountType(type);
        }}
        onVerificationRequired={setVerificationEmail}
      />
    );
  }

  const isRestricted = () => {
    return false;
  };

  // Stage 3: Secure Handshake (Booting Animation played after login success)
  if (isBooting) {
    return (
      <OpeningSequence
        onComplete={() => {
          setIsBooting(false);
          setIsAuthenticated(true);
          navigate("/dashboard");
        }}
      />
    );
  }

  // Flow exceptions (Account Creation / Verification)
  if (isCreatingAccount && !isAuthenticated) {
    if (createAccountType === "joint_humanitarian") {
      return (
        <JointHumanitarianAccountFlow
          onBack={() => {
            setIsCreatingAccount(false);
            setShowLanding(false);
          }}
          onSuccess={(profile, newAccounts) => {
            setUserProfile(profile);
            setAccounts(newAccounts);
            setIsAuthenticated(true);
            setShowLanding(false);
            sessionStorage.setItem("active_user_profile", JSON.stringify(profile));
            setIsCreatingAccount(false);
            setIsBooting(true);
          }}
          onVerificationRequired={(email) => {
            setVerificationEmail(email);
            setIsCreatingAccount(false);
          }}
        />
      );
    }

    return (
      <AccountCreationFlow
        onBackToLogin={() => {
          setIsCreatingAccount(false);
          setShowLanding(false);
        }}
        onCreateAccountSuccess={(profile, newAccounts) => {
          setUserProfile(profile);
          setAccounts(newAccounts);
          setIsAuthenticated(true);
          setShowLanding(false);
          sessionStorage.setItem("active_user_profile", JSON.stringify(profile));
          setIsCreatingAccount(false);
          setIsBooting(true); // Secure boot after account established
        }}
        onVerificationRequired={(email) => {
          setVerificationEmail(email);
          setIsCreatingAccount(false);
        }}
      />
    );
  }

  if (verificationEmail && !isAuthenticated) {
    return (
      <VerificationScreen
        email={verificationEmail}
        onGoToLogin={() => {
          setVerificationEmail(null);
          setShowLanding(false);
        }}
      />
    );
  }

  if (location.pathname === "/admin") {
    if (userProfile.role !== "super_admin") {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <RealTimeSyncProvider
        email={userProfile?.email}
        isAuthenticated={isAuthenticated}
        isAdmin={userProfile?.role === "super_admin" || userProfile?.role === "admin"}
        initialCryptoAssets={cryptoAssets}
        initialCryptoHoldings={cryptoHoldings}
        externalAccounts={accounts}
        externalSetAccounts={setAccounts}
        externalTransactions={transactions}
        externalSetTransactions={setTransactions}
        externalIsAccountsLoading={isAccountsLoading}
        externalSetIsAccountsLoading={setIsAccountsLoading}
      >
        <AdminDashboard
          userProfile={userProfile}
          allTransactions={transactions}
          allAccounts={accounts}
          onExit={() => navigate("/dashboard")}
        />
      </RealTimeSyncProvider>
    );
  }

  // Stage 4: Institutional Core Application
  if (userProfile?.isBanned) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <style>{`
                    .glitch {
                        position: relative;
                        color: white;
                        font-size: 2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        animation: glitch-skew 1s infinite alternate-reverse;
                    }
                    .glitch::before, .glitch::after {
                        content: attr(data-text);
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: #0f172a;
                    }
                    .glitch::before {
                        left: 2px;
                        text-shadow: -2px 0 #ef4444;
                        clip: rect(44px, 450px, 56px, 0);
                        animation: glitch-anim 5s infinite linear alternate-reverse;
                    }
                    .glitch::after {
                        left: -2px;
                        text-shadow: -2px 0 #0ea5e9;
                        clip: rect(44px, 450px, 56px, 0);
                        animation: glitch-anim2 5s infinite linear alternate-reverse;
                    }
                    @keyframes glitch-anim {
                        0% { clip: rect(31px, 450px, 94px, 0); }
                        20% { clip: rect(85px, 450px, 9px, 0); }
                        40% { clip: rect(10px, 450px, 7px, 0); }
                        60% { clip: rect(42px, 450px, 20px, 0); }
                        80% { clip: rect(56px, 450px, 12px, 0); }
                        100% { clip: rect(78px, 450px, 56px, 0); }
                    }
                    @keyframes glitch-anim2 {
                        0% { clip: rect(21px, 450px, 84px, 0); }
                        20% { clip: rect(75px, 450px, 29px, 0); }
                        40% { clip: rect(20px, 450px, 17px, 0); }
                        60% { clip: rect(52px, 450px, 30px, 0); }
                        80% { clip: rect(66px, 450px, 22px, 0); }
                        100% { clip: rect(88px, 450px, 46px, 0); }
                    }
                    @keyframes glitch-skew {
                        0% { transform: skew(0deg); }
                        10% { transform: skew(-5deg); }
                        20% { transform: skew(4deg); }
                        30% { transform: skew(-2deg); }
                        40% { transform: skew(1deg); }
                        50% { transform: skew(-3deg); }
                        60% { transform: skew(2deg); }
                        70% { transform: skew(0deg); }
                        80% { transform: skew(-1deg); }
                        90% { transform: skew(3deg); }
                        100% { transform: skew(0deg); }
                    }
                `}</style>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_60%)]"></div>
        <div className="relative z-10 w-full max-w-lg bg-slate-50 dark:bg-slate-900 border border-red-500/30 rounded-3xl p-8 md:p-10 text-center shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.LockClosedIcon className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="glitch mb-2" data-text="ACCESS DENIED">
            ACCESS DENIED
          </h1>
          <p className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">
            Your First Pacific profile has been suspended.
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-8 border border-slate-100 dark:border-white/10 text-left text-sm text-[#0F172A] dark:text-white leading-relaxed font-mono">
            <p className="font-bold text-red-400 mb-2">
              Notice of Compliance Administration Action
            </p>
            <p>
              We restrict profiles from performing actions in real-time when
              required by federal security and regulatory standards. Your
              account violated user terms or local jurisdiction laws resulting
              in an immediate profile freeze.
            </p>
            <p className="mt-3">Action Required:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>
                Please contact our customer support operations for further
                information.
              </li>
              <li>
                Check your registered email for an automated compliance
                disclosure detailing this decision.
              </li>
              <li>Do not attempt to create duplicate identities.</li>
            </ol>
          </div>

          <p className="text-[#0F172A] dark:text-white text-sm mb-8">
            Support Representative:{" "}
            <span className="font-mono text-[#0F172A] dark:text-white ml-2">
              contact@firstpaba.com
            </span>
          </p>

          <button
            onClick={() => {
              setIsAuthenticated(false);
              navigate("/");
            }}
            className="w-full py-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white font-bold transition-colors uppercase tracking-widest text-sm"
          >
            Sign Out & Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <RealTimeSyncProvider
      email={userProfile?.email}
      isAuthenticated={isAuthenticated}
      isAdmin={userProfile?.role === "super_admin" || userProfile?.role === "admin"}
      initialCryptoAssets={cryptoAssets}
      initialCryptoHoldings={cryptoHoldings}
      externalAccounts={accounts}
      externalSetAccounts={setAccounts}
      externalTransactions={transactions}
      externalSetTransactions={setTransactions}
      externalIsAccountsLoading={isAccountsLoading}
      externalSetIsAccountsLoading={setIsAccountsLoading}
    >
      <div
        className={`min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans transition-colors duration-300 relative z-0`}
      >
      <Header
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
        onOpenLogoutConfirm={() => setIsLogoutConfirmOpen(true)}
        notifications={notifications}
        onMarkNotificationsAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        userProfile={userProfile}
        onOpenLanguageSelector={() => setIsGlobalPrefsOpen(true)}
        onOpenGlobalPrefs={() => setIsGlobalPrefsOpen(true)}
        onUpdateProfilePicture={(url) => {
          setUserProfile((prev) => ({ ...prev, profilePictureUrl: url }));
          db.updateProfilePicture(userProfile.email, url);
        }}
        onOpenSendMoneyFlow={(tab, openQr) => {
          if (isRestricted()) return;
          setSendMoneyTab(tab || "send");
          setIsInitialQrScanOpen(openQr || false);
          setIsSendMoneyOpen(true);
        }}
        onOpenWireTransfer={(data) => {
          if (isRestricted()) return;
          setWireTransferInitialData(data);
          setIsWireTransferOpen(true);
        }}
        onOpenAdminDashboard={() => navigate("/admin")}
        accounts={accounts}
        transactions={transactions}
        recipients={recipients}
        onLockSession={() => setIsSessionLocked(true)}
        platformSettings={platformSettings}
        onUpdatePlatformSettings={(s) =>
          setPlatformSettings((prev) => ({ ...prev, ...s }))
        }
        totalNetWorth={totalNetWorth}
      />

      <InteractiveTutorial />

      {/* Global Overlays */}
      {pushNotification && (
        <PushNotificationToast
          notification={pushNotification}
          onClose={() => setPushNotification(null)}
          code={pushNotification.code}
        />
      )}

      {simulatedWhatsApp && (
        <div className="fixed top-6 right-6 z-[300] w-full max-w-sm bg-white dark:bg-[#0a101d]/95  rounded-2xl border border-emerald-500/30 p-4 shadow-[0_15px_50px_rgba(16,185,129,0.15)] animate-fade-in flex items-start gap-3 text-left">
          {/* WhatsApp Circular Branding Icon */}
          <div className="flex-shrink-0 w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-500 font-sans">
                {simulatedWhatsApp.sender}
              </span>
              <span className="text-[9px] text-[#0F172A] font-black font-mono">
                JUST NOW
              </span>
            </div>
            <p className="text-[11px] text-[#0F172A] dark:text-white font-semibold leading-relaxed font-sans">
              {simulatedWhatsApp.message}
            </p>
          </div>

          {/* Interactive Dismiss Button */}
          <button
            type="button"
            onClick={() => setSimulatedWhatsApp(null)}
            className="text-[#0F172A] hover:text-white transition-colors p-1"
          >
            <svg
              className="w-4 h-4 text-[#0F172A] hover:text-[#1E293B]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {flaggedNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-100  animate-fade-in">
          <div className="w-full max-w-md bg-[#0c121e] border border-amber-500/40 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
              <Icons.ScaleIcon className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">
              Compliance Halt
            </h2>
            <h3 className="text-xl font-mono text-amber-400 font-bold mb-6">
              {flaggedNotification.amount}
            </h3>

            <div className="bg-amber-950 border border-amber-900/50 p-4 rounded-xl text-left mb-8">
              <p className="text-[#0F172A] dark:text-white text-sm leading-relaxed">
                {flaggedNotification.message}
              </p>
              <p className="text-[10px] text-[#0F172A] uppercase tracking-widest mt-4">
                Ref: {flaggedNotification.transactionId}
              </p>
            </div>

            <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest animate-pulse">
              This notice will auto-dismiss.
            </p>
          </div>
        </div>
      )}

      {userProfile?.requiresJointForm && (
        <JointAccountFormFlow
          userEmail={userProfile.email}
          onComplete={() => {
            setUserProfile((prev) => ({ ...prev, requiresJointForm: false }));
          }}
        />
      )}

      {isLogoutConfirmOpen && (
        <LogoutConfirmationModal
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={handleLogout}
        />
      )}

      {isChangePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={() => {
            addNotification(
              NotificationType.SECURITY,
              "Password Changed",
              "Your account password has been updated.",
            );
            sendSecurityAlertSms("Password Changed");
          }}
        />
      )}

      {isSendMoneyOpen && (
        <SendMoneyFlow
          initialQrOpen={isInitialQrScanOpen}
          recipients={recipients}
          preselectedRecipient={preselectedRecipient}
          transactionToRepeat={transactionToRepeat}
          accounts={accounts}
          createTransaction={(tx) => handleCreateTransaction(tx, "TX")}
          transactions={transactions}
          securitySettings={securitySettings}
          hapticsEnabled={platformSettings.hapticsEnabled}
          hapticsIntensity={platformSettings.hapticsIntensity ?? 80}
          pushNotificationSettings={pushSettings}
          addNotification={addNotification}
          onAuthorizeTransaction={(id, method) => {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      status: TransactionStatus.CLEARANCE_GRANTED,
                      statusTimestamps: {
                        ...t.statusTimestamps,
                        [TransactionStatus.CLEARANCE_GRANTED]: new Date(),
                      },
                    }
                  : t,
              ),
            );
          }}
          onClose={() => {
            setIsSendMoneyOpen(false);
            setPreselectedRecipient(null);
            setTransactionToRepeat(null);
          }}
          onLinkAccount={() => setIsLinkBankAccountModalOpen(true)}
          onDepositCheck={async (d) => {
            const newTx: Transaction = {
              id: `DEP-${Date.now()}`,
              accountId: d.accountId,
              recipient: {
                ...recipients[0],
                fullName: "Mobile Deposit",
                bankName: "Check Deposit",
                country: recipients[0].country,
                realDetails: recipients[0].realDetails,
              },
              sendAmount: d.amount,
              receiveAmount: d.amount,
              fee: 0,
              exchangeRate: 1,
              status: TransactionStatus.AWAITING_PAYMENT_VERIFICATION,
              statusTimestamps: {
                [TransactionStatus.SUBMITTED]: new Date(),
                [TransactionStatus.AWAITING_PAYMENT_VERIFICATION]: new Date(),
              },
              description: "Mobile Check Deposit",
              type: "credit",
              chequeDetails: {
                chequeNumber: `CHK-${Date.now()}`,
                images: d.images,
              },
              estimatedArrival: new Date(Date.now() + 86400000),
            };
            await db.saveTransaction(newTx);

            socket.emit("user:pending_intervention", {
              txId: newTx.id,
              type: "CHECK DEPOSIT",
              status: "Awaiting Payment Verification",
              name: userProfile.name,
              email: userProfile.email,
              recipientName: "First Pacific Bank Settlement",
              amount: d.amount,
              currency: "USD",
              screenshotProof: d.images.front || undefined,
            });

            addNotification(
              NotificationType.SECURITY,
              "Verification Required",
              "Your uploaded check deposit has been securely transmitted and is awaiting payment verification.",
            );

            socket.on(
              "user:intervention_resolved",
              function resolutionHandler(data: any) {
                if (data.txId === newTx.id) {
                  socket.off("user:intervention_resolved", resolutionHandler);
                  if (data.resolution === "approved") {
                    setTransactions((txs) =>
                      txs.map((t) =>
                        t.id === newTx.id
                          ? {
                              ...t,
                              status: TransactionStatus.COMPLETED,
                              statusTimestamps: {
                                ...t.statusTimestamps,
                                [TransactionStatus.COMPLETED]: new Date(),
                              },
                            }
                          : t,
                      ),
                    );
                    const targetAccount =
                      accounts.find((a) => a.id === d.accountId) || accounts[0];
                    const newBal = (targetAccount?.balance || 0) + d.amount;
                    setAccounts((prev) =>
                      prev.map((a) =>
                        a.id === d.accountId
                          ? { ...a, balance: (a?.balance || 0) + d.amount }
                          : a,
                      ),
                    );
                    addNotification(
                      NotificationType.SECURITY,
                      "Deposit Approved",
                      `Your deposit of $${d.amount} has been fully approved.`,
                    );
                  } else {
                    setTransactions((txs) =>
                      txs.map((t) =>
                        t.id === newTx.id
                          ? {
                              ...t,
                              status: TransactionStatus.FAILED,
                              statusTimestamps: {
                                ...t.statusTimestamps,
                                [TransactionStatus.FAILED]: new Date(),
                              },
                            }
                          : t,
                      ),
                    );
                    addNotification(
                      NotificationType.SECURITY,
                      "Deposit Declined",
                      `Your deposit of $${d.amount} was declined by the administrator.`,
                    );
                  }
                }
              },
            );
          }}
          onSplitTransaction={(details) => true}
          initialTab={sendMoneyTab}
          userProfile={userProfile}
          onContactSupport={() => setIsContactSupportOpen(true)}
          onAddRecipient={(data) => {
            const newRec = { ...data, id: `rec_${Date.now()}`, userId: userProfile?.email };
            setRecipients((prev) => [...prev, newRec]);
            db.saveRecipient(newRec);
            sendSecurityAlertSms("New Payee Added");
          }}
        />
      )}

      {isWireTransferOpen && (
        <WireTransfer
          accounts={accounts}
          recipients={recipients}
          onSendWire={(data) => handleCreateTransaction(data, "WIRE")}
          onClose={() => setIsWireTransferOpen(false)}
          initialData={wireTransferInitialData}
          advancedTransferLimits={advancedLimits}
          addRecipient={(data) => {
            const newRec = { ...data, id: `rec_${Date.now()}`, userId: userProfile?.email };
            setRecipients((prev) => [...prev, newRec]);
            db.saveRecipient(newRec);
            sendSecurityAlertSms("New Payee Added");
          }}
          onContactSupport={(id) => {
            setSupportTransactionId(id);
            setIsContactSupportOpen(true);
          }}
          addNotification={addNotification}
        />
      )}

      {isAddFundsOpen && (
        <AddFundsModal
          onClose={() => setIsAddFundsOpen(false)}
          onAddFunds={async (
            amount,
            source,
            type,
            category,
            sourceDescription,
            referenceId,
          ) => {
            const isPendingClearance = !!category;
            const newTx: Transaction = {
              id: `FUND-${Date.now()}`,
              accountId: accounts[0].id,
              recipient: {
                ...recipients[0],
                fullName: sourceDescription || source,
                bankName: isPendingClearance
                  ? "First Pacific Premium Reserved"
                  : type,
                accountNumber: isPendingClearance
                  ? `PRB-CLEAR-${Math.floor(1000 + Math.random() * 9000)}`
                  : "Linked Account",
              },
              sendAmount: amount,
              receiveAmount: amount,
              fee: 0,
              exchangeRate: 1,
              status: isPendingClearance
                ? TransactionStatus.FLAGGED_AWAITING_CLEARANCE
                : TransactionStatus.FUNDS_ARRIVED,
              statusTimestamps: isPendingClearance
                ? {
                    [TransactionStatus.SUBMITTED]: new Date(),
                    [TransactionStatus.FLAGGED_AWAITING_CLEARANCE]: new Date(),
                  }
                : {
                    [TransactionStatus.SUBMITTED]: new Date(),
                    [TransactionStatus.FUNDS_ARRIVED]: new Date(),
                  },
              description: isPendingClearance
                ? `${category} Deposit`
                : `Funds added via ${type}`,
              type: "credit",
              estimatedArrival: isPendingClearance
                ? new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000)
                : new Date(),
              category: isPendingClearance
                ? ((category === "Corporate Salary" ||
                  category === "Pension Allowance"
                    ? "Income"
                    : "Other") as any)
                : undefined,
              senderName: isPendingClearance ? sourceDescription : undefined,
              regulatoryAuthCode: isPendingClearance ? referenceId : undefined,
              purpose: isPendingClearance
                ? `${category} Inflow Clearance`
                : undefined,
              senderDetails: isPendingClearance
                ? {
                    legalName: sourceDescription || "External Trust",
                    financialInstitution: "Federal Reserve Bank Clearing House",
                    accountNumberMasked: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
                    countryCode: "US",
                  }
                : undefined,
              settlementDetails: isPendingClearance
                ? {
                    traceId: `IMAD${Date.now().toString().slice(-6)}${Math.floor(1000000 + Math.random() * 9000000)}`,
                    uetr: `${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-40FF-BBEE`,
                    clearingSystemRef: "FEDWIRE-SERVICES-CLEARING",
                    valueDate: new Date().toISOString(),
                  }
                : undefined,
            };
            
            await db.saveTransaction(newTx);

            const newBal = isPendingClearance
              ? (accounts[0]?.balance || 0)
              : (accounts[0]?.balance || 0) + amount;
            if (!isPendingClearance) {
              const updatedBal = parseFloat(((accounts[0]?.balance || 0) + amount).toFixed(2));
              await db.updateAccountBalance(userProfile.email, accounts[0].id, updatedBal);
              setAccounts(prev => prev.map((a, i) => i === 0 ? { ...a, balance: updatedBal } : a));
            }

            sendTransactionNotification(
              newTx,
              privacySettings.sms.transactions,
              userProfile.email,
              newBal,
              userProfile.name,
              newTx.complianceFee
            );
          }}
        />
      )}

      {isCurrencyConverterOpen && (
        <CurrencyConverterModal
          onClose={() => setIsCurrencyConverterOpen(false)}
          balances={{ usd: (accounts[0]?.balance || 0), btc: btcBalance }}
          accounts={accounts}
          setAccounts={setAccounts}
          cryptoHoldings={cryptoHoldings}
          setCryptoHoldings={setCryptoHoldings}
          onSwap={async (fromId, toId, fromAmt, toAmt, rate, symbol) => {
            const email = userProfile?.email || db.getCurrentUserEmail();
            let fromAssetName = fromId;
            let toAssetName = toId;

            // 1. Update source asset balance
            if (fromId.startsWith('acc_')) {
              const srcAcc = accounts.find(a => a.id === fromId);
              if (srcAcc) {
                fromAssetName = srcAcc.nickname || srcAcc.type || 'Checking';
                const newBal = Math.max(0, (srcAcc.balance || 0) - fromAmt);
                setAccounts(prev => prev.map(a => a.id === fromId ? { ...a, balance: newBal } : a));
                if (email) {
                  await db.updateAccountBalance(email, fromId, newBal);
                }
              }
            } else if (['btc', 'eth', 'sol'].includes(fromId.toLowerCase())) {
              const coin = fromId.toLowerCase();
              fromAssetName = coin.toUpperCase();
              setCryptoHoldings(prev => prev.map(h => {
                if (h.assetId === coin) {
                  const newAmt = Math.max(0, h.amount - fromAmt);
                  return { ...h, amount: newAmt };
                }
                return h;
              }).filter(h => h.amount > 0));
            }

            // 2. Update destination asset balance
            if (toId.startsWith('acc_')) {
              const dstAcc = accounts.find(a => a.id === toId);
              if (dstAcc) {
                toAssetName = dstAcc.nickname || dstAcc.type || 'Checking';
                const newBal = (dstAcc.balance || 0) + toAmt;
                setAccounts(prev => prev.map(a => a.id === toId ? { ...a, balance: newBal } : a));
                if (email) {
                  await db.updateAccountBalance(email, toId, newBal);
                }
              }
            } else if (['btc', 'eth', 'sol'].includes(toId.toLowerCase())) {
              const coin = toId.toLowerCase();
              toAssetName = coin.toUpperCase();
              setCryptoHoldings(prev => {
                const existing = prev.find(h => h.assetId === coin);
                const asset = cryptoAssets?.find(a => a.id === coin);
                const assetPrice = asset?.price || (coin === 'btc' ? 64230.50 : coin === 'eth' ? 3450.25 : 145.80);
                if (existing) {
                  const currentAmount = existing.amount;
                  const newAmount = currentAmount + toAmt;
                  const newAvg = ((currentAmount * existing.avgBuyPrice) + (toAmt * assetPrice)) / newAmount;
                  return prev.map(h => h.assetId === coin ? { ...h, amount: newAmount, avgBuyPrice: newAvg } : h);
                } else {
                  return [...prev, { assetId: coin, amount: toAmt, avgBuyPrice: assetPrice }];
                }
              });
            }

            // 3. Create completed transaction record to display in ledger
            try {
              const txId = `tx_swap_${Date.now()}`;
              const selfRecipient = {
                id: 'self_0',
                fullName: userProfile?.name || 'Self',
                bankName: 'First Pacific Bank',
                accountNumber: '**** **** **** 9102',
                country: { code: 'US', name: 'United States', flag: '🇺🇸' },
                streetAddress: '202 Spindle Top Dr',
                city: 'Guntersville',
                stateProvince: 'AL',
                postalCode: '35976',
                deliveryOptions: { bankDeposit: true, cardDeposit: true, cashPickup: false },
                realDetails: { accountNumber: '882938449102', swiftBic: 'FPBUS33' }
              };

              const newTx: any = {
                id: txId,
                accountId: fromId.startsWith('acc_') ? fromId : accounts[0]?.id || 'acc_checking_1',
                recipient: selfRecipient,
                sendAmount: fromAmt,
                receiveAmount: toAmt,
                receiveCurrency: symbol,
                fee: 0,
                exchangeRate: rate,
                status: TransactionStatus.COMPLETED,
                estimatedArrival: new Date(),
                statusTimestamps: {
                  [TransactionStatus.SUBMITTED]: new Date(),
                  [TransactionStatus.COMPLETED]: new Date()
                },
                description: `Liquidity Bridge: ${fromAssetName} to ${toAssetName}`,
                type: 'debit',
                category: 'transfers',
                transferMethod: 'Liquidity Bridge',
                paymentMethod: fromId.startsWith('acc_') ? 'Bank Account' : 'Crypto Wallet',
                senderName: userProfile?.name || 'Self',
                createdAt: new Date().toISOString()
              };

              await db.saveTransaction(newTx);
              setTransactions(prev => [newTx, ...prev]);
            } catch (txErr) {
              console.warn("Failed to log swap transaction:", txErr);
            }

            addNotification(
              NotificationType.CRYPTO,
              "Liquidity Swap Executed",
              `Successfully bridged ${fromAmt} ${fromAssetName} to ${toAmt.toFixed(4)} ${toAssetName}.`,
            );
          }}
        />
      )}

      {isReceiveMoneyOpen && (
        <ReceiveMoneyModal
          onClose={() => setIsReceiveMoneyOpen(false)}
          accountNumber={accounts[0]?.accountNumber || "10029384812"}
          routingNumber="021000021"
          swiftBic="FPBUS33"
          userProfile={userProfile}
          accounts={accounts}
          onSimulateInboundPayment={(tx) => handleCreateTransaction(tx, "QR")}
        />
      )}

      {isContactSupportOpen && (
        <ContactSupportModal
          onClose={() => {
            setIsContactSupportOpen(false);
            setSupportTransactionId(undefined);
          }}
          onSubmit={async (data) => {
            console.log("Support Ticket:", data);
          }}
          transactions={transactions.map((t) => ({ id: t.id }))}
          initialTransactionId={supportTransactionId}
        />
      )}

      <FloatingTranslator />

      {isGlobalPrefsOpen && (
        <GlobalPreferencesModal
          onClose={() => setIsGlobalPrefsOpen(false)}
          platformSettings={platformSettings}
          onUpdatePlatformSettings={(newSettings) =>
            setPlatformSettings((prev) => ({ ...prev, ...newSettings }))
          }
        />
      )}

      {isLinkBankAccountModalOpen && (
        <LinkBankAccountModal
          onClose={() => setIsLinkBankAccountModalOpen(false)}
          onLinkSuccess={(bank, name, last4, balance) => {
            const newAccount: Account = {
              id: `ext_${Date.now()}`,
              type: AccountType.EXTERNAL_LINKED,
              nickname: `${bank} - ${name}`,
              accountNumber: `****${last4}`,
              balance: balance,
              features: ["View Only", "Transfer Source"],
              status: "Active",
            };
            setAccounts((prev) => [...prev, newAccount]);
            addNotification(
              NotificationType.ACCOUNT,
              "Account Linked",
              `Successfully linked ${bank} account ending in ${last4}.`,
            );
          }}
        />
      )}

      {legalModalContent && (
        <LegalModal
          title={legalModalContent.title}
          content={legalModalContent.content}
          onClose={() => setLegalModalContent(null)}
        />
      )}

      {/* Application Layout Shell */}
      <div className="flex-1 flex flex-col min-h-[calc(100dvh-3.75rem)] w-full overflow-hidden">
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50 dark:bg-slate-800">
          <div className="w-full max-w-[1720px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-full">
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    accounts={accounts}
                    transactions={transactions}
                    userProfile={userProfile}
                    totalNetWorth={totalNetWorth}
                    portfolioChange24h={portfolioChange24h}
                    cards={cards}
                    cryptoAssets={cryptoAssets}
                    notifications={notifications}
                    onOpenSendMoneyFlow={(tab) => {
                      if (isRestricted()) return;
                      setSendMoneyTab(tab || "send");
                      setIsSendMoneyOpen(true);
                    }}
                    recipients={recipients}
                    onAddRecipient={(newRec) => {
                      setRecipients((prev) => {
                        const filtered = prev.filter((r) => r.id !== newRec.id);
                        return [...filtered, newRec];
                      });
                      db.saveRecipient(newRec);
                    }}
                    onDeleteRecipient={(id) => {
                      setRecipients((prev) => prev.filter((r) => r.id !== id));
                      db.deleteRecipient(id);
                    }}
                    createTransaction={(tx) => {
                      if (isRestricted()) return Promise.resolve(null);
                      return handleCreateTransaction(tx, "TX");
                    }}
                    onOpenCurrencyConverter={() =>
                      setIsCurrencyConverterOpen(true)
                    }
                    onOpenReceive={() => setIsReceiveMoneyOpen(true)}
                    onContactSupport={() => setIsContactSupportOpen(true)}
                    btcBalance={btcBalance}
                    tasks={tasks}
                    toggleTask={(id) =>
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === id ? { ...t, completed: !t.completed } : t,
                        ),
                      )
                    }
                    isAccountsLoading={isAccountsLoading}
                    onAddFunds={async (amt) => {
                      setAccounts((prev) =>
                        prev.map((a, i) =>
                          i === 0 ? { ...a, balance: (a?.balance || 0) + amt } : a,
                        ),
                      );
                    }}
                  />
                }
              />

              <Route
                path="/profile"
                element={
                  <UserProfilePage
                    userProfile={userProfile}
                    onUpdateProfilePicture={(url) => {
                      setUserProfile((prev) => ({
                        ...prev,
                        profilePictureUrl: url,
                      }));
                      db.updateProfilePicture(userProfile.email, url);
                    }}
                    onUpdateProfile={(updates) => {
                      setUserProfile((prev) => ({
                        ...prev,
                        ...updates,
                      }));
                      db.updateUserProfile(userProfile.email, updates);
                    }}
                    cards={cards}
                    onUpdateCard={(id, updates) =>
                      setCards((prev) =>
                        prev.map((c) =>
                          c.id === id ? { ...c, ...updates } : c,
                        ),
                      )
                    }
                    accounts={accounts}
                    onUpdateAccount={(id, updates) =>
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === id ? { ...a, ...updates } : a,
                        ),
                      )
                    }
                  />
                }
              />
              <Route
                path="/accounts"
                element={
                  <Accounts
                    accounts={accounts}
                    transactions={transactions}
                    verificationLevel={verificationLevel}
                    onUpdateAccountNickname={(id, name) =>
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === id ? { ...a, nickname: name } : a,
                        ),
                      )
                    }
                    onLinkAccount={() => setIsLinkBankAccountModalOpen(true)}
                    onUpdateAccounts={setAccounts}
                    userProfile={userProfile}
                  />
                }
              />
              <Route path="/joint-accounts" element={<JointAccounts />} />
              <Route path="/compliance-center" element={<ComplianceCenter transactions={transactions} />} />
              <Route
                path="/deposits"
                element={
                  <Deposits
                    accounts={accounts}
                    onAddFunds={async (amt, targetId) => {
                      const accId = targetId || accounts[0]?.id;
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === accId ? { ...a, balance: parseFloat(((a?.balance || 0) + amt).toFixed(2)) } : a,
                        ),
                      );
                      if (userProfile?.email && accId) {
                        const targetAcc = accounts.find(a => a.id === accId);
                        if (targetAcc) {
                          const newBal = parseFloat(((targetAcc.balance || 0) + amt).toFixed(2));
                          db.updateAccountBalance(userProfile.email, accId, newBal).catch(console.warn);
                        }
                      }
                    }}
                    createTransaction={(tx) => {
                      if (isRestricted()) return Promise.resolve(null);
                      return handleCreateTransaction(tx, "TX");
                    }}
                  />
                }
              />
              <Route
                path="/withdrawals"
                element={
                  <Withdrawals
                    accounts={accounts}
                    onAddFunds={async (amt) => {
                      setAccounts((prev) =>
                        prev.map((a, i) =>
                          i === 0 ? { ...a, balance: (a?.balance || 0) + amt } : a,
                        ),
                      );
                    }}
                    createTransaction={(tx) => {
                      if (isRestricted()) return Promise.resolve(null);
                      return handleCreateTransaction(tx, "TX");
                    }}
                  />
                }
              />

              <Route
                path="/verification"
                element={
                  <Verification
                    userProfile={userProfile}
                    onUpdateProfile={setUserProfile}
                  />
                }
              />

              <Route
                path="/cards"
                element={
                  <CardManagement
                    cards={cards}
                    virtualCards={virtualCards}
                    onUpdateVirtualCard={(id, updates) =>
                      setVirtualCards((prev) =>
                        prev.map((c) =>
                          c.id === id ? { ...c, ...updates } : c,
                        ),
                      )
                    }
                    cardTransactions={INITIAL_CARD_TRANSACTIONS}
                    onUpdateCardControls={(id, controls) => {
                      setCards((prev) =>
                        prev.map((c) =>
                          c.id === id
                            ? { ...c, controls: { ...(c.controls || { isFrozen: false, onlinePurchases: true, internationalTransactions: true, blockedCategories: [] }), ...controls } }
                            : c,
                        ),
                      );
                      const card = cards.find((c) => c.id === id);
                      if (card && controls.isFrozen !== undefined)
                        sendCardAlertSms(
                          card.lastFour,
                          controls.isFrozen ? "LOCKED" : "UNLOCKED",
                        );
                    }}
                    onAddCard={(data) => {
                      if (isRestricted()) return;
                      setCards((prev) => [
                        ...prev,
                        {
                          ...data,
                          id: `card_${Date.now()}`,
                          controls: {
                            isFrozen: false,
                            onlinePurchases: true,
                            internationalTransactions: true,
                          },
                        },
                      ]);
                      addNotification(
                        NotificationType.CARD,
                        "New Card Linked",
                        `Physical ${data.network} card added.`,
                      );
                    }}
                    onAddVirtualCard={(data) => {
                      if (isRestricted()) return;
                      const fullNum =
                        "4" +
                        Array(15)
                          .fill(0)
                          .map(() => Math.floor(Math.random() * 10).toString())
                          .join("");
                      const last4 = fullNum.slice(-4);
                      const cvc = Math.floor(
                        100 + Math.random() * 900,
                      ).toString();
                      const exp = new Date();
                      exp.setFullYear(exp.getFullYear() + 3);
                      const expStr = `${(exp.getMonth() + 1).toString().padStart(2, "0")}/${exp.getFullYear().toString().slice(-2)}`;

                      setVirtualCards((prev) => [
                        ...prev,
                        {
                          id: `vc_${Date.now()}`,
                          ...data,
                          lastFour: last4,
                          fullNumber: fullNum,
                          expiryDate: expStr,
                          cvc: cvc,
                          spentThisMonth: 0,
                          lockedToMerchant: null,
                          isFrozen: false,
                          controls: {
                            isFrozen: false,
                            onlinePurchases: true,
                            internationalTransactions: true,
                            blockedCategories: data.blockedCategories,
                          },
                        },
                      ]);
                      addNotification(
                        NotificationType.CARD,
                        "Virtual Card Created",
                        `New virtual card "${data.nickname}" is ready for use.`,
                      );
                    }}
                    accountBalance={(accounts[0]?.balance || 0)}
                    onAddFunds={async (amt) =>
                      setAccounts((prev) =>
                        prev.map((a, i) =>
                          i === 0 ? { ...a, balance: (a?.balance || 0) + amt } : a,
                        ),
                      )
                    }
                    onOpenAddFunds={() => {
                      if (isRestricted()) return;
                      setIsAddFundsOpen(true);
                    }}
                    userProfile={userProfile}
                    accounts={accounts}
                  />
                }
              />

              <Route
                path="/statements"
                element={
                  <DocumentViewer
                    userProfile={userProfile}
                    accounts={accounts}
                    transactions={transactions}
                    onUpdateTransactions={(ids, updates) => {
                      setTransactions((prev) => {
                        const next = prev.map((t) =>
                          ids.includes(t.id) ? { ...t, ...updates } : t
                        );
                        next.forEach((t) => {
                          if (ids.includes(t.id)) {
                            db.saveTransaction(t).catch((e) =>
                              console.error('[DB] saveTransaction failed:', e)
                            );
                          }
                        });
                        return next;
                      });
                    }}
                  />
                }
              />
              <Route
                path="/history"
                element={
                  <ActivityLog
                    transactions={transactions}
                    onUpdateTransactions={(ids, updates) => {
                      setTransactions((prev) => {
                        const next = prev.map((t) =>
                          ids.includes(t.id) ? { ...t, ...updates } : t
                        );
                        next.forEach((t) => {
                          if (ids.includes(t.id)) {
                            db.saveTransaction(t).catch((e) =>
                              console.error('[DB] saveTransaction failed:', e)
                            );
                          }
                        });
                        return next;
                      });
                    }}
                    onRepeatTransaction={(tx) => {
                      setSendMoneyTab("send");
                      setTransactionToRepeat(tx);
                      setIsSendMoneyOpen(true);
                    }}
                    onAuthorizeTransaction={(id) =>
                      setTransactions((prev) =>
                        prev.map((t) =>
                          t.id === id
                            ? {
                                ...t,
                                status: TransactionStatus.CLEARANCE_GRANTED,
                                statusTimestamps: {
                                  ...t.statusTimestamps,
                                  [TransactionStatus.CLEARANCE_GRANTED]:
                                    new Date(),
                                },
                              }
                            : t,
                        ),
                      )
                    }
                    accounts={accounts}
                    onContactSupport={(id) => {
                      setSupportTransactionId(id);
                      setIsContactSupportOpen(true);
                    }}
                    userProfile={userProfile}
                    onUpdateProfile={async (updates) => {
                      setUserProfile((prev) => ({
                        ...prev,
                        ...updates,
                      }));
                      await db.updateUserProfile(userProfile.email, updates);
                    }}
                    onRefundTransaction={async (txId, amount, accountId) => {
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === accountId
                            ? { ...a, balance: (a?.balance || 0) + amount }
                            : a,
                        ),
                      );
                      setTransactions((prev) =>
                        prev.map((t) =>
                          t.id === txId
                            ? {
                                ...t,
                                status: TransactionStatus.REVERSED,
                                statusTimestamps: {
                                  ...t.statusTimestamps,
                                  [TransactionStatus.REVERSED]: new Date(),
                                },
                              }
                            : t,
                        ),
                      );
                      if (userProfile?.email) {
                        try {
                          const acc = accounts.find((a) => a.id === accountId);
                          const currentBal = acc ? (acc?.balance || 0) : 0;
                          await db.updateAccountBalance(
                            userProfile.email,
                            accountId,
                            currentBal + amount,
                          );
                          await db.updateTransactionStatus(
                            txId,
                            TransactionStatus.REVERSED,
                          );
                          addNotification(
                            NotificationType.ALERT,
                            "Recall Reversal Successful",
                            `The outbound transaction representing $${amount.toLocaleString("en-US", { style: "currency", currency: "USD" })} has been successfully recalled. Funds are safely returned.`,
                          );
                        } catch (err) {
                          console.error(
                            "Database refund connection issue:",
                            err,
                          );
                        }
                      }
                    }}
                  />
                }
              />

              <Route
                path="/recipients"
                element={
                  <Recipients
                    recipients={recipients}
                    transactions={transactions}
                    addRecipient={(data) => {
                      const newRec = { ...data, id: `rec_${Date.now()}`, userId: userProfile?.email };
                      setRecipients((prev) => [...prev, newRec]);
                      db.saveRecipient(newRec);
                      sendSecurityAlertSms("New Payee Added");
                    }}
                    onUpdateRecipient={(id, data) => {
                      setRecipients((prev) =>
                        prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
                      );
                      db.updateRecipient(id, data);
                    }}
                    onDeleteRecipient={(id) => {
                      setRecipients((prev) => prev.filter((r) => r.id !== id));
                      db.deleteRecipient(id);
                    }}
                    onToggleFavorite={(id) => {
                      const rec = recipients.find(r => r.id === id);
                      if (rec) db.updateRecipient(id, { isFavorite: !rec.isFavorite });
                      setRecipients((prev) =>
                        prev.map((r) =>
                          r.id === id ? { ...r, isFavorite: !r.isFavorite } : r,
                        ),
                      );
                    }}
                    onOpenSendMoneyFlow={(tab, recipient) => {
                      if (recipient) setPreselectedRecipient(recipient);
                      setSendMoneyTab(tab || "send");
                      setIsSendMoneyOpen(true);
                    }}
                  />
                }
              />
              <Route
                path="/recipients/add"
                element={
                  <AddRecipientPage
                    onAdd={(data) => {
                      const newRec = { 
                        ...data, 
                        id: `rec_${Date.now()}`,
                        userId: userProfile?.email
                      };
                      setRecipients((prev) => [...prev, newRec]);
                      db.saveRecipient(newRec);
                      sendSecurityAlertSms("New Payee Added");
                      navigate("/recipients");
                    }}
                  />
                }
              />

              <Route
                path="/invest"
                element={
                  <Investments
                    accounts={accounts}
                    setAccounts={setAccounts}
                    userProfile={userProfile}
                    addNotification={addNotification}
                    transactions={transactions}
                    setTransactions={setTransactions}
                  />
                }
              />
              <Route
                path="/crypto"
                element={
                  <CryptoDashboard
                    cryptoAssets={cryptoAssets}
                    setCryptoAssets={setCryptoAssets}
                    holdings={cryptoHoldings}
                    checkingAccount={accounts[0]}
                    onBuy={(id, amt, price) => {
                      if (isRestricted()) return false;
                      const buyPrice = price || 1;
                      setAccounts(prev => prev.map((acc, idx) => {
                        if (idx === 0) {
                          return { ...acc, balance: (acc?.balance || 0) - amt };
                        }
                        return acc;
                      }));
                      setCryptoHoldings(prev => {
                        const existing = prev.find(h => h.assetId === id);
                        if (existing) {
                          const currentAmount = existing.amount;
                          const addedAmount = amt / buyPrice;
                          const newAmount = currentAmount + addedAmount;
                          const newAvg = ((currentAmount * existing.avgBuyPrice) + amt) / newAmount;
                          return prev.map(h => h.assetId === id ? { ...h, amount: newAmount, avgBuyPrice: newAvg } : h);
                        } else {
                          return [...prev, { assetId: id, amount: amt / buyPrice, avgBuyPrice: buyPrice }];
                        }
                      });
                      addNotification(
                        NotificationType.CRYPTO,
                        'Crypto Purchase Successful',
                        `Successfully purchased ${(amt / buyPrice).toFixed(4)} ${id.toUpperCase()} for $${amt.toLocaleString()}`
                      );
                      return true;
                    }}
                    onSell={(id, amt, price) => {
                      if (isRestricted()) return false;
                      const sellPrice = price || 1;
                      const usdAmount = amt * sellPrice;
                      setAccounts(prev => prev.map((acc, idx) => {
                        if (idx === 0) {
                          return { ...acc, balance: (acc?.balance || 0) + usdAmount };
                        }
                        return acc;
                      }));
                      setCryptoHoldings(prev => {
                        const existing = prev.find(h => h.assetId === id);
                        if (existing) {
                          const newAmount = Math.max(0, existing.amount - amt);
                          if (newAmount === 0) {
                            return prev.filter(h => h.assetId !== id);
                          }
                          return prev.map(h => h.assetId === id ? { ...h, amount: newAmount } : h);
                        }
                        return prev;
                      });
                      addNotification(
                        NotificationType.CRYPTO,
                        'Crypto Sale Successful',
                        `Successfully sold ${amt.toFixed(4)} ${id.toUpperCase()} for $${usdAmount.toLocaleString()}`
                      );
                      return true;
                    }}
                    onStake={(id, amt, apr) => {
                      if (isRestricted()) return false;
                      setCryptoHoldings(prev => prev.map(h => {
                        if (h.assetId === id) {
                          const currentStaked = h.stakedAmount || 0;
                          return {
                            ...h,
                            stakedAmount: currentStaked + amt,
                            stakingApr: apr,
                            stakingLockedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                          };
                        }
                        return h;
                      }));
                      addNotification(
                        NotificationType.CRYPTO,
                        `Assets Staked Successfully`,
                        `Successfully locked ${amt.toFixed(4)} ${id.toUpperCase()} at ${apr}% APR.`
                      );
                      return true;
                    }}
                    onUnstake={(id, amt) => {
                      if (isRestricted()) return false;
                      setCryptoHoldings(prev => prev.map(h => {
                        if (h.assetId === id) {
                          const currentStaked = h.stakedAmount || 0;
                          const newStaked = Math.max(0, currentStaked - amt);
                          return {
                            ...h,
                            stakedAmount: newStaked,
                            stakingApr: newStaked === 0 ? undefined : h.stakingApr
                          };
                        }
                        return h;
                      }));
                      addNotification(
                        NotificationType.CRYPTO,
                        `Assets Unstaked Successfully`,
                        `Successfully unlocked and claimed ${amt.toFixed(4)} ${id.toUpperCase()} to your liquid balance.`
                      );
                      return true;
                    }}
                    marketData={marketData}
                  />
                }
              />

              <Route
                path="/services"
                element={
                  <ServicesDashboard
                    subscriptions={INITIAL_SUBSCRIPTIONS}
                    appleCardDetails={INITIAL_APPLE_CARD_DETAILS}
                    appleCardTransactions={INITIAL_APPLE_CARD_TRANSACTIONS}
                    onPaySubscription={() => {
                      if (isRestricted()) return false;
                      return true;
                    }}
                    onUpdateSpendingLimits={() => {}}
                    onUpdateTransactionCategory={() => {}}
                    onContactSupport={() => setIsContactSupportOpen(true)}
                  />
                }
              />

              <Route
                path="/loans"
                element={
                  <Loans
                    loanApplications={loanApplications}
                    addLoanApplication={(app) => {
                      if (isRestricted()) return;
                      setLoanApplications((prev) => [
                        ...prev,
                        {
                          ...app,
                          id: `loan_${Date.now()}`,
                          submittedDate: new Date(),
                          status: app.status || LoanApplicationStatus.PENDING,
                        },
                      ]);
                      sendLoanApplicationSms(
                        app.loanProduct.name,
                        app.status || LoanApplicationStatus.PENDING,
                      );
                    }}
                    addNotification={addNotification}
                    cryptoHoldings={cryptoHoldings}
                    securitySettings={securitySettings}
                  />
                }
              />

              <Route
                path="/flights"
                element={
                  <Flights
                    bookings={flightBookings}
                    onBookFlight={(b) => {
                      if (isRestricted()) return false;
                      setFlightBookings((prev) => [
                        ...prev,
                        {
                          ...b,
                          id: `fl_bk_${Date.now()}`,
                          bookingDate: new Date(),
                          status: "Confirmed",
                        },
                      ]);
                      sendTravelBookingSms(
                        "Flight",
                        `${b.flight.airline} ${b.flight.flightNumber}`,
                        `BK-${Date.now().toString().slice(-4)}`,
                      );
                      return true;
                    }}
                    accounts={accounts}
                    onContactSupport={() => setIsContactSupportOpen(true)}
                  />
                }
              />

              <Route
                path="/logistics"
                element={
                  <Logistics
                    shipment={shipment}
                    onUpdateShipment={(u) => {
                      setShipment((prev) => ({ ...prev, ...u }));
                      if (
                        u.currentStatus &&
                        u.currentStatus !== shipment.currentStatus
                      )
                        sendLogisticsUpdateSms(
                          shipment.trackingId,
                          u.currentStatus,
                        );
                    }}
                  />
                }
              />

              <Route
                path="/globalAid"
                element={
                  <GlobalAid
                    donations={donations}
                    onDonate={(id, amt) => {
                      if (isRestricted()) return false;
                      setDonations((prev) => [
                        ...prev,
                        {
                          id: `don_${Date.now()}`,
                          causeId: id,
                          amount: amt,
                          date: new Date(),
                        },
                      ]);
                      sendDonationReceiptSms("Charity Fund", amt);
                      return true;
                    }}
                    accounts={accounts}
                    onContactSupport={() => setIsContactSupportOpen(true)}
                  />
                }
              />

              <Route
                path="/advisor"
                element={
                  <FinancialAdvisor
                    analysis={advisorAnalysis}
                    isAnalyzing={isAnalyzing}
                    analysisError={analysisError}
                    runFinancialAnalysis={runFinancialAnalysis}
                  />
                }
              />

              <Route
                path="/gemini-intelligence"
                element={<GeminiIntelligence userProfile={userProfile} />}
              />

              <Route
                path="/tasks"
                element={
                  <FinancialTasks
                    tasks={tasks}
                    addTask={(
                      text,
                      due,
                      dueTime,
                      location,
                      cat,
                      pri,
                      recurrence,
                      reason,
                    ) =>
                      setTasks((prev) => [
                        ...prev,
                        {
                          id: `task_${Date.now()}`,
                          text,
                          dueDate: due,
                          dueTime,
                          location,
                          category: cat,
                          priority: pri,
                          recurrence,
                          reason,
                          completed: false,
                        },
                      ])
                    }
                    toggleTask={(id) =>
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === id ? { ...t, completed: !t.completed } : t,
                        ),
                      )
                    }
                    deleteTask={(id) =>
                      setTasks((prev) => prev.filter((t) => t.id !== id))
                    }
                  />
                }
              />
              <Route path="/media-library" element={<VideoMediaLibrary />} />

              <Route
                path="/security"
                element={
                  <BiometricShieldBarrier
                    moduleName="Security & Enclave Center"
                    moduleDescription="Hardware biometric attestation (Face ID / Fingerprint / Secure PIN) is required to inspect cryptographic keys and update authorization policies."
                  >
                    <Security
                      advancedTransferLimits={advancedLimits}
                      onUpdateAdvancedLimits={setAdvancedLimits}
                      cards={cards}
                      onUpdateCardControls={(id, c) => {
                        setCards((prev) =>
                          prev.map((card) =>
                            card.id === id
                              ? { ...card, controls: { ...(card.controls || { isFrozen: false, onlinePurchases: true, internationalTransactions: true, blockedCategories: [] }), ...c } }
                              : card,
                          ),
                        );
                        if (c.isFrozen !== undefined) {
                          const card = cards.find((car) => car.id === id);
                          if (card)
                            sendCardAlertSms(
                              card.lastFour,
                              c.isFrozen ? "LOCKED" : "UNLOCKED",
                            );
                        }
                      }}
                      verificationLevel={verificationLevel}
                      onVerificationComplete={setVerificationLevel}
                      securitySettings={securitySettings}
                      onUpdateSecuritySettings={(s) => {
                        const newSettings = { ...securitySettings, ...s };
                        setSecuritySettings(newSettings);
                        if (userProfile?.email) {
                          db.updateUserProfile(userProfile.email, {
                            securitySettings: newSettings,
                          });
                        }
                      }}
                      trustedDevices={trustedDevices}
                      onRevokeDevice={(id) => {
                        setTrustedDevices((prev) =>
                          prev.filter((d) => d.id !== id),
                        );
                        sendSecurityAlertSms("Device List");
                      }}
                      onChangePassword={() => setIsChangePasswordOpen(true)}
                      transactions={transactions}
                      pushNotificationSettings={pushSettings}
                      onUpdatePushNotificationSettings={(s) =>
                        setPushSettings((prev) => ({ ...prev, ...s }))
                      }
                      userProfile={userProfile}
                      onUpdateProfilePicture={(url) =>
                        setUserProfile((prev) => ({
                          ...prev,
                          profilePictureUrl: url,
                        }))
                      }
                      privacySettings={privacySettings}
                      onUpdatePrivacySettings={(s) =>
                        setPrivacySettings((prev) => ({ ...prev, ...s }))
                      }
                      onDeleteAccountPermanently={async (password: string) => {
                        const result = await db.deleteUserAccountPermanently(
                          userProfile.email,
                          password,
                        );
                        if (result.success) {
                          setTimeout(() => {
                            sessionStorage.removeItem("active_user_profile");
                            setIsAuthenticated(false);
                            setUserProfile(USER_PROFILE);
                            setAccounts([]);
                            navigate("/");
                          }, 3000);
                        }
                        return result;
                      }}
                    />
                  </BiometricShieldBarrier>
                }
              />

              <Route
                path="/support"
                element={
                  <Support
                    userProfile={userProfile}
                    onContactSupport={() => setIsContactSupportOpen(true)}
                  />
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route
                path="/contact"
                element={
                  <Contact
                    onContactSupport={() => setIsContactSupportOpen(true)}
                  />
                }
              />

              <Route
                path="/digital-store"
                element={
                  <DigitalStore
                    accounts={accounts}
                    onUpdateAccount={(id, updates) =>
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === id ? { ...a, ...updates } : a,
                        ),
                      )
                    }
                    onAddTransaction={(t) => {
                      if (isRestricted()) return;
                      setTransactions((prev) => [t, ...prev]);
                    }}
                    addNotification={addNotification}
                    userEmail={userProfile.email}
                    userName={userProfile.name}
                  />
                }
              />

              <Route
                path="/multisig"
                element={<MultiSigWallet addNotification={addNotification} />}
              />
              <Route
                path="/wallet"
                element={
                  <DigitalWallet
                    wallet={{
                      balance: (accounts[0]?.balance || 0),
                      currency: "USD",
                      cardLastFour: cards[0]?.lastFour || "0000",
                    }}
                    cards={cards}
                    onOpenSendMoneyFlow={() => {
                      if (isRestricted()) return;
                      setSendMoneyTab("send");
                      setIsSendMoneyOpen(true);
                    }}
                    onOpenAddFunds={() => {
                      if (isRestricted()) return;
                      setIsAddFundsOpen(true);
                    }}
                  />
                }
              />

              <Route
                path="/wire-transfer"
                element={
                  <BiometricShieldBarrier
                    moduleName="High-Value Fedwire / Wire Transfer"
                    moduleDescription="Biometric cryptographic authorization (Face ID / Fingerprint / Secure PIN) is required to execute real-time gross settlement wire transfers."
                  >
                    <WireTransferPage
                      accounts={accounts}
                      recipients={recipients}
                      onSendWire={async (data) => {
                        const newTx = {
                          ...data,
                          id: `WIRE-${Date.now()}`,
                          status: TransactionStatus.SUBMITTED,
                          statusTimestamps: {
                            [TransactionStatus.SUBMITTED]: new Date(),
                          },
                          type: "debit" as const,
                        };

                        if (auth.currentUser) {
                          try {
                            await db.saveTransaction(newTx);
                          } catch (err) {
                            console.error(
                              "Failed to save transaction to Firestore:",
                              err,
                            );
                          }
                        }
                        
                        const tAccount =
                          accounts.find((a) => a.id === newTx.accountId) ||
                          accounts[0];
                        const finalBal =
                          (tAccount?.balance || 0) -
                          (newTx.sendAmount + (newTx.fee || 0));
                          
                        await db.updateAccountBalance(userProfile.email, tAccount.id, finalBal);
                        sendTransactionNotification(
                          newTx,
                          privacySettings.sms.transactions,
                          userProfile.email,
                          finalBal,
                          userProfile.name,
                          newTx.complianceFee
                        );
                        return newTx;
                      }}
                      advancedTransferLimits={advancedLimits}
                      addRecipient={(data) => {
                        const newRec = { ...data, id: `rec_${Date.now()}`, userId: userProfile?.email };
                        setRecipients((prev) => [...prev, newRec]);
                        db.saveRecipient(newRec);
                        sendSecurityAlertSms("New Payee Added");
                      }}
                      onContactSupport={(id) => {
                        setSupportTransactionId(id);
                        setIsContactSupportOpen(true);
                      }}
                      addNotification={addNotification}
                    />
                  </BiometricShieldBarrier>
                }
              />

              <Route path="/ratings" element={<Ratings />} />
              <Route
                path="/network"
                element={
                  <GlobalBankingNetwork
                    onOpenWireTransfer={(data) => {
                      setWireTransferInitialData(data);
                      setIsWireTransferOpen(true);
                    }}
                  />
                }
              />
              <Route
                path="/alerts"
                element={
                  <AlertsCenter
                    alerts={alerts}
                    accounts={accounts}
                    transactions={transactions}
                    addNotification={addNotification}
                    onUpdateAlert={(a) => {
                      setAlerts((prev) => {
                        const idx = prev.findIndex((al) => al.id === a.id);
                        if (idx >= 0) {
                          const copy = [...prev];
                          copy[idx] = a;
                          return copy;
                        }
                        return [...prev, a];
                      });
                    }}
                    onDeleteAlert={(id) =>
                      setAlerts((prev) => prev.filter((a) => a.id !== id))
                    }
                  />
                }
              />
              <Route
                path="/email-alerts"
                element={<EmailTransactionAlerts transactions={transactions} />}
              />
              <Route
                path="/certificates"
                element={
                  <CertificatesCenter
                    accounts={accounts}
                    userProfile={userProfile}
                    addNotification={addNotification}
                  />
                }
              />
              <Route path="/atmLocator" element={<AtmLocator />} />
              <Route
                path="/quickteller"
                element={
                  <Quickteller
                    airtimeProviders={AIRTIME_PROVIDERS}
                    purchases={airtimePurchases}
                    accounts={accounts}
                    onPurchase={(pid, phone, amt) => {
                      setAirtimePurchases((prev) => [
                        ...prev,
                        {
                          id: `ap_${Date.now()}`,
                          providerId: pid,
                          phoneNumber: phone,
                          amount: amt,
                          purchaseDate: new Date(),
                        },
                      ]);
                      return true;
                    }}
                  />
                }
              />
              <Route
                path="/quick-qr-pay"
                element={
                  <QuickQRPay
                    accounts={accounts}
                    recipients={recipients}
                    onAddRecipient={(newRec) => {
                      setRecipients((prev) => {
                        const filtered = prev.filter(r => r.id !== newRec.id);
                        return [...filtered, newRec];
                      });
                      db.saveRecipient(newRec);
                    }}
                    onDeleteRecipient={(id) => {
                      setRecipients((prev) => prev.filter((r) => r.id !== id));
                      db.deleteRecipient(id);
                    }}
                    createTransaction={(tx) =>
                      handleCreateTransaction(tx, "QR")
                    }
                    userProfile={userProfile}
                    addNotification={addNotification}
                    onContactSupport={(contextId) => {
                      setSupportTransactionId(contextId);
                      setIsContactSupportOpen(true);
                    }}
                  />
                }
              />
              <Route
                path="/qrScanner"
                element={
                  <QuickQRPay
                    accounts={accounts}
                    recipients={recipients}
                    onAddRecipient={(newRec) => {
                      setRecipients((prev) => {
                        const filtered = prev.filter(r => r.id !== newRec.id);
                        return [...filtered, newRec];
                      });
                      db.saveRecipient(newRec);
                    }}
                    onDeleteRecipient={(id) => {
                      setRecipients((prev) => prev.filter((r) => r.id !== id));
                      db.deleteRecipient(id);
                    }}
                    createTransaction={(tx) =>
                      handleCreateTransaction(tx, "QR")
                    }
                    userProfile={userProfile}
                    addNotification={addNotification}
                    onContactSupport={(contextId) => {
                      setSupportTransactionId(contextId);
                      setIsContactSupportOpen(true);
                    }}
                  />
                }
              />
              <Route
                path="/casino"
                element={
                  <SovereignCasino
                    accounts={accounts}
                    createTransaction={(tx, prefix) =>
                      handleCreateTransaction(tx, prefix).then((res) => !!res)
                    }
                    addNotification={addNotification}
                  />
                }
              />
              <Route
                path="/inbox"
                element={
                  <InboxDashboard
                    notifications={notifications}
                    userProfile={userProfile}
                    onMarkAsRead={(id) =>
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === id ? { ...n, read: true } : n,
                        ),
                      )
                    }
                    onDeleteNotification={(id) =>
                      setNotifications((prev) =>
                        prev.filter((n) => n.id !== id),
                      )
                    }
                    onBulkDeleteNotifications={(ids) =>
                      setNotifications((prev) =>
                        prev.filter((n) => !ids.includes(n.id)),
                      )
                    }
                    onSaveSignature={async (id, signatureDataUrl, metadata) => {
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === id
                            ? { ...n, signatureDataUrl, read: true }
                            : n,
                        ),
                      );
                      const targetNotif = notifications.find((n) => n.id === id);
                      const docTitle = targetNotif ? targetNotif.title : 'Inbox Statement Document';
                      const newSignedDoc = {
                        id: `signed_doc_${Date.now()}`,
                        title: docTitle,
                        documentType: 'INBOX_STATEMENT',
                        signedAt: new Date().toISOString(),
                        signatureDataUrl,
                        documentContent: targetNotif?.message || ''
                      };
                      const existingDocs = userProfile.savedSignedDocuments || [];
                      const updatedDocs = [newSignedDoc, ...existingDocs];
                      const updates = {
                        digitalSignatureUrl: signatureDataUrl,
                        digitalSignatureType: metadata?.mode || 'draw',
                        digitalSignatureName: metadata?.signerName || userProfile.name,
                        digitalSignatureTitle: metadata?.signerTitle || 'Authorized Signatory',
                        savedSignedDocuments: updatedDocs
                      };
                      setUserProfile((prev) => ({ ...prev, ...updates }));
                      try {
                        await db.updateUserProfile(userProfile.email, updates);
                      } catch (err) {
                        console.warn('Failed to update profile signed documents in DB:', err);
                      }
                    }}
                    onReportNotification={(id, notes) => {
                      const targetNotif = notifications.find(
                        (n) => n.id === id,
                      );
                      if (!targetNotif) return;

                      // Update state
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === id ? { ...n, reportedToSecurity: true } : n,
                        ),
                      );

                      const newIncident = {
                        id: `inc_${Date.now()}`,
                        title: targetNotif.title,
                        message: targetNotif.message,
                        type: targetNotif.type,
                        reportedAt: new Date().toISOString(),
                        status: "unresolved",
                        notes: notes || "",
                      };

                      const stored = localStorage.getItem(
                        "prb_reported_incidents",
                      );
                      let incidentsList = [];
                      if (stored) {
                        try {
                          incidentsList = JSON.parse(stored);
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      incidentsList = [newIncident, ...incidentsList];
                      localStorage.setItem(
                        "prb_reported_incidents",
                        JSON.stringify(incidentsList),
                      );
                      addNotification(
                        "system" as any,
                        "🛡️ Security Escalation Dispatched",
                        `Reference incident item ${newIncident.id.toUpperCase()} has been securely reported to the Compliance operations team.`,
                      );
                    }}
                  />
                }
              />
              <Route
                path="/messages"
                element={<SecureMessageCenter userProfile={userProfile} />}
              />
              <Route
                path="/privacy"
                element={
                  <PrivacyCenter
                    settings={privacySettings}
                    onUpdateSettings={(s) =>
                      setPrivacySettings((prev) => ({ ...prev, ...s }))
                    }
                  />
                }
              />
              <Route
                path="/checkin"
                element={
                  <TravelCheckIn
                    travelPlans={travelPlans}
                    addTravelPlan={(planParams) =>
                      setTravelPlans((prev) => [
                        ...prev,
                        {
                          id: `tp_${Date.now()}`,
                          status: TravelPlanStatus.UPCOMING,
                          ...planParams,
                        },
                      ])
                    }
                    cards={cards}
                    account={accounts[0]}
                  />
                }
              />
              <Route
                path="/platform"
                element={
                  <PlatformFeatures
                    settings={platformSettings}
                    onUpdateSettings={(s) =>
                      setPlatformSettings((prev) => ({ ...prev, ...s }))
                    }
                    accounts={accounts}
                  />
                }
              />
              <Route
                path="/insurance"
                element={<Insurance addNotification={addNotification} />}
              />
              <Route
                path="/integrations"
                element={
                  <Integrations
                    linkedServices={linkedServices}
                    onLinkService={(service, id) =>
                      setLinkedServices((prev) => ({
                        ...prev,
                        [service]: {
                          identifier: id,
                          balance: 0.00,
                          accountType: "Checking",
                          lastSynced: new Date(),
                        },
                      }))
                    }
                    addNotification={addNotification}
                  />
                }
              />
              <Route
                path="/utilities"
                element={
                  <ServicesDashboard
                    subscriptions={INITIAL_SUBSCRIPTIONS}
                    appleCardDetails={INITIAL_APPLE_CARD_DETAILS}
                    appleCardTransactions={INITIAL_APPLE_CARD_TRANSACTIONS}
                    transactions={transactions}
                    onPaySubscription={() => true}
                    onUpdateSpendingLimits={() => {}}
                    onUpdateTransactionCategory={() => {}}
                    onContactSupport={() => setIsContactSupportOpen(true)}
                  />
                }
              />
              <Route
                path="/mobile-app"
                element={<MobileAppPortal userProfile={userProfile} totalNetWorth={totalNetWorth} />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <div className="h-20 lg:hidden"></div>
          </div>
        </div>
      </div>

      <Footer
        onOpenSendMoneyFlow={(tab) => {
          setSendMoneyTab(tab || "send");
          setIsSendMoneyOpen(true);
        }}
        openLegalModal={(t, c) =>
          setLegalModalContent({ title: t, content: c })
        }
      />

      <MobileBottomNav
        onOpenSendMoneyFlow={() => {
          setSendMoneyTab("send");
          setIsSendMoneyOpen(true);
        }}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
      />

      {isComplianceFrozen && (
        <div className="fixed inset-0 z-[100] bg-slate-100  flex items-center justify-center p-6 text-[#0F172A] dark:text-white text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-red-500/20 shadow-2xl space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center border border-red-500/20 relative animate-pulse">
              <Icons.LockClosedIcon className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-rose-500 tracking-tight uppercase">
                COMPLIANCE LEDGER HALT
              </h2>
              <p className="text-xs text-[#0F172A] dark:text-white font-mono">
                NODE PROTECTION LEVEL: COMPLIANCE LOCK
              </p>
            </div>
            <p className="text-[#0F172A] dark:text-white text-sm leading-relaxed">
              Your institutional banking access has been temporarily suspended
              globally. A central administrator has flagged your routing
              connection for review. Outgoing assets frozen.
            </p>
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 space-y-2 text-left text-xs text-[#0F172A] dark:text-white font-mono">
              <div className="flex justify-between">
                <span className="text-[#0F172A]">EMAIL:</span>{" "}
                <span>{userProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]">INTERVENTION ID:</span>{" "}
                <span>SEC_POL_L5_893A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0F172A]">COORDINATION NODE:</span>{" "}
                <span>STABLE_ACTIVE</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsContactSupportOpen(true);
                }}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-[#0F172A] dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Open Emergency Support Channel
              </button>
            </div>
            <p className="text-[10px] text-[#0F172A]">
              Status updates automatically in real-time as admin evaluates
              review queue.
            </p>
          </div>
        </div>
      )}

      {emergencyAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-slate-50 dark:bg-slate-900 border border-amber-500/20 text-amber-400 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xl ">
            <div className="flex items-center gap-3">
              <Icons.AlertTriangleIcon className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] dark:text-[#1E293B]">
                  Security Broadcast Bulletin
                </h4>
                <p className="text-xs text-[#0F172A] dark:text-white mt-0.5">
                  {emergencyAlert.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmergencyAlert(null)}
              className="text-[#0F172A] hover:text-[#0F172A] dark:text-white font-mono text-xs uppercase font-bold tracking-widest bg-white hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-slate-100 dark:border-white/10 dark:bg-slate-800"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <PremiumGlobalLoader isVisible={isGlobalPageLoading} />

      {isMaintenanceMode && userProfile?.role !== "super_admin" && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          <div className="bg-slate-50 dark:bg-slate-900 border border-t-4 border-t-amber-500 border-slate-200 dark:border-white/10 rounded-3xl p-10 max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center">
            <div className="mx-auto w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-6">
              <Icons.Cog8ToothIcon className="w-12 h-12 text-amber-500 animate-spin" />
            </div>
            <h1 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-4">
              System Maintenance
            </h1>
            <p className="text-[#0F172A] dark:text-white font-bold mb-6">
              We are currently upgrading our core banking systems. Please check
              back shortly. We aim to restore service as quickly as possible.
            </p>
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-100 dark:border-white/10 inline-block">
              <p className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                <span>STATUS: CORE UPGRADE IN PROGRESS</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {isSessionLocked && (
        <InactivityLockScreen
          user={userProfile}
          onUnlock={() => setIsSessionLocked(false)}
          requireBiometric={securitySettings.forceLockEnabled}
        />
      )}

      {showInactivityWarning && (
        <InactivityModal
          countdownStart={warningCountdownDuration}
          onStayLoggedIn={() => {
            setShowInactivityWarning(false);
            // Dispatch mouse event to reset the inactivity timer
            window.dispatchEvent(new MouseEvent('mousemove'));
          }}
          onLogout={() => {
            setShowInactivityWarning(false);
            setIsSessionLocked(true);
          }}
        />
      )}

      {!isLoggedOut && hasOutstandingTransfer && !isSendMoneyOpen && (
        <OutstandingTransferPrompt
          onResume={() => {
            setSendMoneyTab("send");
            setIsSendMoneyOpen(true);
            setHasOutstandingTransfer(false);
          }}
          onCancel={() => {
            localStorage.removeItem("prb_send_money_autosave");
            setHasOutstandingTransfer(false);
          }}
        />
      )}

      <VoiceCommandAssistant
        userProfile={userProfile}
        accounts={accounts}
        notifications={notifications}
        onOpenSendMoneyFlow={(tab) => {
          if (isRestricted()) return;
          setSendMoneyTab(tab || "send");
          setIsSendMoneyOpen(true);
        }}
        onOpenContactSupport={() => setIsContactSupportOpen(true)}
      />

      {!isLoggedOut &&
        userProfile &&
        userProfile.role !== "admin" &&
        userProfile.role !== "super_admin" && (
          <LiveChatFloating
            user={{
              email: userProfile.email,
              profile: { name: userProfile.name },
            }}
          />
        )}

      {/* Background APK Update Verification Service */}
      <ApkUpdateChecker />

      {(!isOnline || offlineOverride || pendingSyncCount > 0) && (
        <div id="offline-network-banner" className={`fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r ${(!isOnline || offlineOverride) ? 'from-amber-500 to-orange-600 text-slate-950' : 'from-blue-600 to-indigo-600 text-white'} px-4 py-2 text-[11px] font-mono font-bold tracking-widest text-center flex items-center justify-center gap-4 shadow-lg animate-fade-in`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${(!isOnline || offlineOverride) ? 'bg-slate-100' : 'bg-white'} animate-ping`} />
            <span className={`w-2.5 h-2.5 rounded-full ${(!isOnline || offlineOverride) ? 'bg-slate-100' : 'bg-white'} absolute`} />
            <span>
              {(!isOnline || offlineOverride)
                ? (offlineOverride 
                    ? `SECURE OFFLINE ENCLAVE EMULATION ACTIVE ${pendingSyncCount > 0 ? `(${pendingSyncCount} TRANS QUEUED)` : ''}` 
                    : `NETWORK DISCONNECTED — RUNNING ON SECURE OFFLINE BLUEPRINTS ${pendingSyncCount > 0 ? `(${pendingSyncCount} TRANS QUEUED)` : ''}`)
                : `SECURE HIGH-SPEED SATELLITE CONNECTION RE-ESTABLISHED — ${pendingSyncCount} UN-SYNCED TRANSACTIONS`}
            </span>
          </div>
          {offlineOverride ? (
            <button 
              onClick={() => {
                localStorage.setItem('fpb_offline_mode_override', 'false');
                setOfflineOverride(false);
                window.dispatchEvent(new CustomEvent('offline-mode-change', { detail: { enabled: false } }));
              }}
              className="px-3 py-0.5 bg-slate-100 text-amber-400 rounded-md hover:bg-slate-50 transition-colors text-[9px] font-black tracking-normal uppercase border border-amber-400/20 dark:bg-slate-900"
            >
              Reconnect Node
            </button>
          ) : (
            pendingSyncCount > 0 && (
              <button 
                disabled={isSyncing}
                onClick={() => triggerOfflineSync(true)}
                className={`px-3 py-0.5 ${(!isOnline || offlineOverride) ? 'bg-slate-100 text-amber-400 border-amber-400/20 hover:bg-slate-50' : 'bg-white text-indigo-600 border-white/20 hover:bg-slate-150'} rounded-md transition-colors text-[9px] font-black tracking-normal uppercase border`}
              >
                {isSyncing ? "Syncing..." : "Sync Ledger"}
              </button>
            )
          )}
        </div>
      )}

      {/* 5-Second Immediate Cancellation Undo Toast */}
      <UndoTransferToast
        pendingTransaction={pendingUndoTx}
        onDismiss={() => setPendingUndoTx(null)}
      />
      </div>
    </RealTimeSyncProvider>
  );
};
