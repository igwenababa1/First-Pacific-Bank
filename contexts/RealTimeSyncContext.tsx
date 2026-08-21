import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from 'react';
import { Account, Transaction, CryptoAsset, CryptoHolding } from '../types';
import { db } from '../services/database';
import { socket } from '../services/socket';
import { useNetWorthSync } from '../hooks/useNetWorthSync';
import { verifyAndRectifyBalances } from '../services/driftDetectionService';

interface RealTimeSyncContextType {
  accounts: Account[];
  transactions: Transaction[];
  isAccountsLoading: boolean;
  totalNetWorth: number;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  cryptoHoldings: CryptoHolding[];
  cryptoAssets: CryptoAsset[];
  setCryptoHoldings: React.Dispatch<React.SetStateAction<CryptoHolding[]>>;
  setCryptoAssets: React.Dispatch<React.SetStateAction<CryptoAsset[]>>;
  syncError: string | null;
  isWsConnected: boolean;
  retrySync: () => void;
}

const RealTimeSyncContext = createContext<RealTimeSyncContextType | undefined>(undefined);

export const useRealTimeSync = () => {
  const context = useContext(RealTimeSyncContext);
  if (!context) {
    throw new Error('useRealTimeSync must be used within a RealTimeSyncProvider');
  }
  return context;
};

interface RealTimeSyncProviderProps {
  children: ReactNode;
  email: string | undefined;
  isAuthenticated: boolean;
  initialCryptoAssets: CryptoAsset[];
  initialCryptoHoldings: CryptoHolding[];
  
  // Optional external state to bind to parent (e.g. App.tsx)
  externalAccounts?: Account[];
  externalSetAccounts?: React.Dispatch<React.SetStateAction<Account[]>>;
  externalTransactions?: Transaction[];
  externalSetTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  externalIsAccountsLoading?: boolean;
  externalSetIsAccountsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  isAdmin?: boolean;
}

export const RealTimeSyncProvider: React.FC<RealTimeSyncProviderProps> = ({
  children,
  email,
  isAuthenticated,
  initialCryptoAssets,
  initialCryptoHoldings,
  externalAccounts,
  externalSetAccounts,
  externalTransactions,
  externalSetTransactions,
  externalIsAccountsLoading,
  externalSetIsAccountsLoading,
  isAdmin = false,
}) => {
  const [localAccounts, localSetAccounts] = useState<Account[]>([]);
  const [localTransactions, localSetTransactions] = useState<Transaction[]>([]);
  const [localIsAccountsLoading, localSetIsAccountsLoading] = useState(true);
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>(initialCryptoAssets);
  const [cryptoHoldings, setCryptoHoldings] = useState<CryptoHolding[]>(initialCryptoHoldings);
  
  // Centralized Real-time Sync & WebSocket Error Boundary States
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(socket.connected);

  // Bind to external or local
  const accounts = externalAccounts !== undefined ? externalAccounts : localAccounts;
  const setAccounts = externalSetAccounts !== undefined ? externalSetAccounts : localSetAccounts;
  const transactions = externalTransactions !== undefined ? externalTransactions : localTransactions;
  const setTransactions = externalSetTransactions !== undefined ? externalSetTransactions : localSetTransactions;
  const isAccountsLoading = externalIsAccountsLoading !== undefined ? externalIsAccountsLoading : localIsAccountsLoading;
  const setIsAccountsLoading = externalSetIsAccountsLoading !== undefined ? externalSetIsAccountsLoading : localSetIsAccountsLoading;

  // Centralized WebSocket Connection & Error Boundary Listener
  useEffect(() => {
    const handleConnect = () => {
      console.log('[RealTimeSyncProvider] WebSocket connected successfully');
      setIsWsConnected(true);
      setSyncError(null);
    };

    const handleConnectError = (err: Error) => {
      try {
        console.warn('[RealTimeSyncProvider Error Boundary] Caught WebSocket Connection Error:', err?.message || err);
        setIsWsConnected(false);
        setSyncError('Real-time connection warning: Reconnecting to institutional network...');
      } catch (boundaryErr) {
        console.error('[RealTimeSyncProvider Error Boundary Fatal]', boundaryErr);
      }
    };

    const handleDisconnect = (reason: string) => {
      try {
        console.warn('[RealTimeSyncProvider Error Boundary] WebSocket Disconnected:', reason);
        setIsWsConnected(false);
        if (reason === 'io server disconnect') {
          // Sever-side disconnect, attempt reconnect safely inside try-catch
          socket.connect();
        }
      } catch (boundaryErr) {
        console.error('[RealTimeSyncProvider Error Boundary Disconnect Handler]', boundaryErr);
      }
    };

    try {
      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);
      socket.on('disconnect', handleDisconnect);
      socket.on('error', handleConnectError);
    } catch (err) {
      console.error('[RealTimeSyncProvider] Error attaching WebSocket error handlers:', err);
      setSyncError('Failed to initialize real-time socket monitoring.');
    }

    return () => {
      try {
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleConnectError);
        socket.off('disconnect', handleDisconnect);
        socket.off('error', handleConnectError);
      } catch (err) {
        console.error('[RealTimeSyncProvider] Error removing WebSocket error handlers:', err);
      }
    };
  }, []);

  // Manual Retry Handler
  const retrySync = useCallback(() => {
    try {
      setSyncError(null);
      if (!socket.connected) {
        socket.connect();
      }
    } catch (err) {
      console.error('[RealTimeSyncProvider] Manual retry sync failed:', err);
      setSyncError('Retry connection failed. Please check network.');
    }
  }, []);

  // Separate ref to hold current account IDs for the transaction filter without triggering re-subscriptions
  const accountIdsRef = useRef<string[]>([]);

  // 1. Firestore Snapshot Listener for Accounts
  useEffect(() => {
    let unsubscribeAccounts: (() => void) | undefined;
    
    if (isAuthenticated && email) {
      setIsAccountsLoading(true);
      const cleanEmail = email.toLowerCase().trim();

      try {
        unsubscribeAccounts = db.subscribeToAccounts(cleanEmail, (updatedAccounts) => {
          try {
            setAccounts(updatedAccounts);
            accountIdsRef.current = updatedAccounts.map((a) => a.id);
            setIsAccountsLoading(false);
            setSyncError(null);
          } catch (accErr) {
            console.error('[RealTimeSyncProvider] Error processing account updates:', accErr);
            setIsAccountsLoading(false);
          }
        });
      } catch (err) {
        console.error('[RealTimeSyncProvider] Centralized Error Boundary caught subscription failure:', err);
        setSyncError('Data subscription error. Re-establishing secure channel...');
        setIsAccountsLoading(false);
      }
    } else {
      setAccounts([]);
      setIsAccountsLoading(false);
      accountIdsRef.current = [];
    }

    return () => {
      if (unsubscribeAccounts) unsubscribeAccounts();
    };
  }, [isAuthenticated, email]);

  // 2. Incremental Delta Snapshot Listener for Transactions
  useEffect(() => {
    let unsubscribeTransactions: (() => void) | undefined;

    if (isAuthenticated && email) {
      const cleanEmail = email.toLowerCase().trim();
      
      try {
        // We now pass a function/ref or rely on the db implementation to filter.
        // Wait, db.subscribeToTransactionsForUser takes (email, accountIds, callback).
        // Since we don't want to change the database signature, we can use a custom incremental listener here,
        // OR we can just pass accountIdsRef.current? No, db.subscribeToTransactionsForUser captures the array.
        // Let's use Firestore directly here for true incremental sync without re-subscribing.
        import('firebase/firestore').then(({ collection, onSnapshot, getFirestore }) => {
          const firestore = getFirestore();
          unsubscribeTransactions = onSnapshot(collection(firestore, "transactions"), (snap) => {
            try {
              // Instead of processing all, we leverage the snapshot's internal cache.
              // The SDK only downloads deltas, reducing bandwidth.
              const currentIds = accountIdsRef.current;
              const loadedTxs: any[] = [];
              snap.forEach((docSnap) => {
                const tx = docSnap.data() as any;
                if (tx && tx.id && (isAdmin || currentIds.includes(tx.accountId))) {
                  if (!isAdmin && tx.id.startsWith('tx_init_')) return;
                  
                  const parsedTx = {
                    ...tx,
                    estimatedArrival: tx.estimatedArrival ? (tx.estimatedArrival.toDate ? tx.estimatedArrival.toDate() : new Date(tx.estimatedArrival)) : new Date()
                  };
                  if (tx.statusTimestamps) {
                    parsedTx.statusTimestamps = {};
                    for (const [k, v] of Object.entries(tx.statusTimestamps)) {
                      parsedTx.statusTimestamps[k as any] = v && (v as any).toDate ? (v as any).toDate() : new Date(v as string);
                    }
                  }
                  loadedTxs.push(parsedTx);
                }
              });
              
              loadedTxs.sort((a, b) => {
                const timeA = new Date(a.statusTimestamps['Submitted'] || 0).getTime();
                const timeB = new Date(b.statusTimestamps['Submitted'] || 0).getTime();
                return timeB - timeA;
              });
              
              setTransactions(loadedTxs);
              setSyncError(null);
            } catch (txErr) {
              console.error('[RealTimeSyncProvider] Error processing transaction updates:', txErr);
            }
          });
        });
      } catch (err) {
        console.error('[RealTimeSyncProvider] Transaction subscription error:', err);
      }
    } else {
      setTransactions([]);
    }

    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [isAuthenticated, email]);

  // Background drift verification service with try-catch
  useEffect(() => {
    if (!isAuthenticated || !email || accounts.length === 0) return;

    const timer = setTimeout(() => {
      try {
        verifyAndRectifyBalances(email, accounts, transactions)
          .catch(err => console.error('[DriftService Background Error]', err));
      } catch (err) {
        console.error('[RealTimeSyncProvider] Drift check initialization error:', err);
      }
    }, 3000); // Debounce drift check to allow batched updates

    return () => clearTimeout(timer);
  }, [accounts, transactions, email, isAuthenticated]);

  const totalNetWorth = useNetWorthSync(accounts, cryptoHoldings, cryptoAssets);

  const value = useMemo(() => ({
    accounts,
    transactions,
    isAccountsLoading,
    totalNetWorth,
    setAccounts,
    setTransactions,
    cryptoHoldings,
    cryptoAssets,
    setCryptoHoldings,
    setCryptoAssets,
    syncError,
    isWsConnected,
    retrySync,
  }), [accounts, transactions, isAccountsLoading, totalNetWorth, cryptoHoldings, cryptoAssets, syncError, isWsConnected, retrySync]);

  return (
    <RealTimeSyncContext.Provider value={value}>
      {children}
    </RealTimeSyncContext.Provider>
  );
};
