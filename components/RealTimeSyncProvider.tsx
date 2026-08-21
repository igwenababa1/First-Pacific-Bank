import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socket } from '../services/socket';
import { db } from '../services/database';

interface RealTimeSyncContextType {
    isConnected: boolean;
    lastSyncedAt: Date | null;
    isSyncing: boolean;
    forceSync: () => Promise<void>;
}

const RealTimeSyncContext = createContext<RealTimeSyncContextType>({
    isConnected: true,
    lastSyncedAt: null,
    isSyncing: false,
    forceSync: async () => {},
});

export const RealTimeSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState<boolean>(socket.connected ?? true);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    const performSync = useCallback(async (isManual: boolean = false) => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            // Re-validate database entities and alerts directly against Firestore snapshot
            await Promise.all([
                db.getAllUsers(),
                db.getAdminDismissedAlerts(),
                db.getAdminReadAlerts(),
                db.getAllTransactions()
            ]);
            
            setLastSyncedAt(new Date());

            if (isManual && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('db_users_updated', { detail: { source: 'RealTimeSyncProvider' } }));
                window.dispatchEvent(new CustomEvent('db_alerts_updated', { detail: { source: 'RealTimeSyncProvider' } }));
                window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: { source: 'RealTimeSyncProvider' } }));
            }
        } catch (error) {
            console.warn('[RealTimeSyncProvider] Re-validation sync note:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    useEffect(() => {
        const handleConnect = () => {
            console.log('[RealTimeSyncProvider] WebSocket connected. State active.');
            setIsConnected(true);
            performSync(false);
        };

        const handleDisconnect = (reason: string) => {
            console.warn(`[RealTimeSyncProvider] WebSocket disconnected (${reason}).`);
            setIsConnected(false);
        };

        const handleConnectError = (err: Error) => {
            console.warn('[RealTimeSyncProvider] WebSocket connection note:', err.message);
            setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);

        // Gentle periodic background check every 60 seconds
        const syncInterval = setInterval(() => {
            performSync(false);
        }, 60000);

        // Network status change listeners
        const handleOnline = () => {
            console.log('[RealTimeSyncProvider] Network online.');
            performSync(true);
        };

        window.addEventListener('online', handleOnline);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            clearInterval(syncInterval);
            window.removeEventListener('online', handleOnline);
        };
    }, [performSync]);

    return (
        <RealTimeSyncContext.Provider
            value={{
                isConnected,
                lastSyncedAt,
                isSyncing,
                forceSync: () => performSync(true)
            }}
        >
            {children}
        </RealTimeSyncContext.Provider>
    );
};

export const useRealTimeSync = () => useContext(RealTimeSyncContext);
