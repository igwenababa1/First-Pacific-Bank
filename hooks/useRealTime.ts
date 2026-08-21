import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationType } from '../types';

// For Vite, assuming the server runs on the same origin (in production or proxied correctly)
// Since this is the same container, we can connect to the origin or window.location
const SOCKET_URL = window.location.origin;

interface MarketData {
    crypto: { BTC: number; ETH: number };
    fx: { EUR_USD: number; GBP_USD: number };
    timestamp: string;
}

export interface RealTimeCallbacks {
    onAccountFrozen?: () => void;
    onAccountUnfrozen?: () => void;
    onBalanceUpdated?: (data: { accountId: string; newBalance: number; reason?: string }) => void;
    onInterventionResolved?: (data: { txId: string; email: string; resolution: 'approved' | 'rejected'; message?: string }) => void;
    onCustomSystemAlert?: (data: any) => void;
    onMaintenanceMode?: (isEnabled: boolean) => void;
    onFixedAll?: () => void;
    onUserBanned?: () => void;
    onUserUnbanned?: () => void;
    onUserSuspended?: () => void;
    onUserUnsuspended?: () => void;
    onUserWarned?: (data: { warning: string }) => void;
    onPaymentStatusUpdated?: (data: { txId: string; status: string; message: string }) => void;
    onUserMfaToggled?: (data: { enabled: boolean }) => void;
    onTransactionCompleted?: (data: { transaction: any }) => void;
}

export const useRealTime = (
    email: string | undefined,
    addNotification: (type: NotificationType, title: string, message: string) => void,
    callbacks?: RealTimeCallbacks
) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [marketData, setMarketData] = useState<MarketData | null>(null);

    // Keep callback object in a ref to avoid reconnecting the WebSocket on every callback change
    const callbacksRef = useRef<RealTimeCallbacks | undefined>(callbacks);
    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        });
        
        newSocket.on('connect', () => {
            console.log('🔗 WebSocket Connected to Institutional Node:', newSocket.id);
            if (email) {
                newSocket.emit('register_user', { email });
            }
        });

        newSocket.on('market_update', (data: MarketData) => {
            setMarketData(data);
        });

        newSocket.on('system_alert', (data: any) => {
            addNotification(NotificationType.SECURITY, 'Network Alert', data.message);
        });

        // Real-Time In-App Custom Notifications (Comms dispatch)
        newSocket.on('user:new_notification', (data: any) => {
            console.log('[WS CLIENT] In-App Notification Received via Socket:', data);
            addNotification(data.type || NotificationType.SECURITY, data.title, data.message);
        });

        // Real-Time Interventions
        newSocket.on('user:intervention_resolved', (data) => {
            console.log('[WS CLIENT] Active hold resolution received:', data);
            if (callbacksRef.current?.onInterventionResolved) {
                callbacksRef.current.onInterventionResolved(data);
            }
        });

        // Real-Time Freeze states
        newSocket.on('user:account_frozen', () => {
            console.warn('[WS CLIENT] Compliance Hold Initiated by Security Center.');
            if (callbacksRef.current?.onAccountFrozen) {
                callbacksRef.current.onAccountFrozen();
            }
        });

        newSocket.on('user:account_unfrozen', () => {
            console.log('[WS CLIENT] Compliance Hold Discharged by Security Center.');
            if (callbacksRef.current?.onAccountUnfrozen) {
                callbacksRef.current.onAccountUnfrozen();
            }
        });

        // Real-Time Balance Alerts
        newSocket.on('user:balance_updated', (data) => {
            console.log('[WS CLIENT] Ledger Balance Reconciled:', data);
            if (callbacksRef.current?.onBalanceUpdated) {
                callbacksRef.current.onBalanceUpdated(data);
            }
        });

        // Real-Time Transaction Settled
        newSocket.on('user:transaction_completed', (data) => {
            console.log('[WS CLIENT] Transaction Completed:', data);
            if (callbacksRef.current?.onTransactionCompleted) {
                callbacksRef.current.onTransactionCompleted(data);
            }
        });

        // Emergency Central Bulletin
        newSocket.on('system:custom_alert', (data) => {
            console.log('[WS CLIENT] Security Bulletin Alert:', data);
            if (callbacksRef.current?.onCustomSystemAlert) {
                callbacksRef.current.onCustomSystemAlert(data);
            }
        });

        newSocket.on('system:maintenance_mode', (data) => {
            console.log('[WS CLIENT] Maintenance Mode Triggered:', data);
            if (callbacksRef.current?.onMaintenanceMode) callbacksRef.current.onMaintenanceMode(data.isEnabled);
        });

        newSocket.on('system:fixed_all', () => {
            if (callbacksRef.current?.onFixedAll) callbacksRef.current.onFixedAll();
        });

        newSocket.on('user:banned', () => {
            if (callbacksRef.current?.onUserBanned) callbacksRef.current.onUserBanned();
        });

        newSocket.on('user:unbanned', () => {
            if (callbacksRef.current?.onUserUnbanned) callbacksRef.current.onUserUnbanned();
        });

        newSocket.on('user:suspended', () => {
            if (callbacksRef.current?.onUserSuspended) callbacksRef.current.onUserSuspended();
        });

        newSocket.on('user:unsuspended', () => {
            if (callbacksRef.current?.onUserUnsuspended) callbacksRef.current.onUserUnsuspended();
        });

        newSocket.on('user:warned', (data) => {
            if (callbacksRef.current?.onUserWarned) callbacksRef.current.onUserWarned(data);
        });

        newSocket.on('user:payment_status_updated', (data) => {
            if (callbacksRef.current?.onPaymentStatusUpdated) callbacksRef.current.onPaymentStatusUpdated(data);
        });

        newSocket.on('user:mfa_updated', (data) => {
            if (callbacksRef.current?.onUserMfaToggled) callbacksRef.current.onUserMfaToggled(data);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket Disconnected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [email]);

    // Send register when email becomes available (if socket is already open)
    useEffect(() => {
        if (socket?.connected && email) {
            socket.emit('register_user', { email });
        }
    }, [email, socket]);

    return { socket, marketData };
};
