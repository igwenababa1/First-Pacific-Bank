import { useEffect } from 'react';
import { socket } from '../services/socket';
import { Account, Transaction, NotificationType, AccountType } from '../types';

export const useBalanceSyncMonitor = (
  accounts: Account[],
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>,
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  addNotification: (type: NotificationType, title: string, message: string) => void
) => {
  useEffect(() => {
    // 1. Listen for the 'user:balance_updated' event from the unified WebSocket
    const handleBalanceUpdated = (data: { accountId: string; newBalance: number; reason?: string }) => {
      console.log('🔄 [BalanceSyncMonitor] WebSocket event received for balance update:', data);
      
      setAccounts((prevAccounts) => {
        let oldBalance = 0;
        const updated = prevAccounts.map((acc) => {
          if (
            acc.id === data.accountId || 
            (acc.type === AccountType.CHECKING && data.accountId.endsWith('_chk')) ||
            (acc.type === AccountType.SAVINGS && data.accountId.endsWith('_sav'))
          ) {
            oldBalance = acc.balance;
            if (acc.balance !== data.newBalance) {
              console.log(`[BalanceSyncMonitor] Syncing balance for ${acc.id}: ${acc.balance} -> ${data.newBalance}`);
            }
            return { ...acc, balance: data.newBalance };
          }
          return acc;
        });

        const updatedAcc = updated.find(a => 
          a.id === data.accountId || 
          (a.type === AccountType.CHECKING && data.accountId.endsWith('_chk')) ||
          (a.type === AccountType.SAVINGS && data.accountId.endsWith('_sav'))
        );

        if (updatedAcc && oldBalance !== data.newBalance) {
          addNotification(
            NotificationType.ALERT,
            'Ledger Balance Reconciled',
            `Reconciliation Desk updated ${updatedAcc.nickname || updatedAcc.type} balance from $${oldBalance.toLocaleString()} to $${data.newBalance.toLocaleString()} (${data.reason || "Real-time verification"}).`
          );
        }

        return updated;
      });
    };

    // 2. Listen for 'user:transaction_completed' or similar events to make sure line-item deductions are perfectly synced
    const handleTransactionCompleted = (data: { transaction: Transaction }) => {
      console.log('⚡ [BalanceSyncMonitor] Real-time transaction completed event:', data);
      
      const newTx = data.transaction;
      setTransactions((prevTxs) => {
        // If transaction already exists, don't duplicate
        if (prevTxs.some(t => t.id === newTx.id)) {
          return prevTxs.map(t => t.id === newTx.id ? newTx : t);
        }
        return [newTx, ...prevTxs];
      });

      // Show immediate deduction toast
      addNotification(
        NotificationType.TRANSACTION,
        'Transaction Settled',
        `Transfer of $${newTx.sendAmount.toLocaleString()} to ${newTx.recipient?.fullName || 'beneficiary'} completed. Ledger reconciled.`
      );
    };

    socket.on('user:balance_updated', handleBalanceUpdated);
    socket.on('user:transaction_completed', handleTransactionCompleted);

    // Also register a custom event listener so internal changes trigger global sync signals
    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { accountId, oldBalance, newBalance, reason } = customEvent.detail || {};
      console.log('📣 [BalanceSyncMonitor] Local balance sync signal captured:', customEvent.detail);
      
      setAccounts((prev) => 
        prev.map((acc) => {
          if (
            acc.id === accountId || 
            (acc.type === AccountType.CHECKING && accountId?.endsWith('_chk')) ||
            (acc.type === AccountType.SAVINGS && accountId?.endsWith('_sav'))
          ) {
            return { ...acc, balance: newBalance };
          }
          return acc;
        })
      );
    };

    window.addEventListener('BALANCE_ADJUSTMENT_TRIGGERED', handleLocalSync);

    return () => {
      socket.off('user:balance_updated', handleBalanceUpdated);
      socket.off('user:transaction_completed', handleTransactionCompleted);
      window.removeEventListener('BALANCE_ADJUSTMENT_TRIGGERED', handleLocalSync);
    };
  }, [setAccounts, setTransactions, addNotification]);
};
