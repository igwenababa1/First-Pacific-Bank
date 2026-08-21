import { doc, getDoc, updateDoc, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from './firebase';
import { Account, Transaction, TransactionStatus } from '../types';
import { db as databaseService } from './database';

const INITIAL_BALANCES: Record<string, number> = {
  'acc_checking_1': 927380.08,
  'acc_savings_1': 450000.00,
  'acc_business_1': 124000.00,
  'acc_joint_1': 45200.00,
  'acc_joint_2': 18450.00,
  'acc_sub_1': 150000.00,
  'acc_sub_2': 25000.00,
};

/**
 * Service to verify and automatically rectify account balance drift.
 * Runs in the background and audits matches between current balance and transaction ledger.
 */
export async function verifyAndRectifyBalances(
  email: string,
  accounts: Account[],
  transactions: Transaction[]
): Promise<void> {
  if (!email || accounts.length === 0) return;
  const targetEmail = email.toLowerCase().trim();

  // Find the doc reference in Firestore
  const q = query(collection(firestore, "accounts"), where("email", "==", targetEmail));
  const snap = await getDocs(q);
  if (snap.empty) return;

  const docSnap = snap.docs[0];
  const accountDocRef = docSnap.ref;

  let driftDetected = false;
  const updatedAccounts = [...accounts];

  for (let i = 0; i < updatedAccounts.length; i++) {
    const acc = updatedAccounts[i];
    
    // Determine the initial balance baseline
    let initialBalance = (acc as any).initialBalance;
    if (initialBalance === undefined) {
      initialBalance = INITIAL_BALANCES[acc.id] !== undefined ? INITIAL_BALANCES[acc.id] : acc.balance;
      (acc as any).initialBalance = initialBalance;
      driftDetected = true; // Save the newly added initialBalance
    }

    // Filter transactions for this specific account
    const accTxs = transactions.filter(t => t.accountId === acc.id);

    // Sum credits (completed only or pending credits)
    const totalCredits = accTxs
      .filter(t => t.type === 'credit' && t.status !== TransactionStatus.FAILED)
      .reduce((sum, t) => sum + (t.sendAmount || t.receiveAmount || 0), 0);

    // Sum debits (all active/deducted debits, excluding failed)
    const totalDebits = accTxs
      .filter(t => t.type === 'debit' && t.status !== TransactionStatus.FAILED)
      .reduce((sum, t) => sum + (t.sendAmount + (t.fee || 0) + (t.complianceFee || 0)), 0);

    const calculatedBalance = initialBalance + totalCredits - totalDebits;

    // Standard check with tolerance for floating-point issues
    if (Math.abs(acc.balance - calculatedBalance) > 0.01) {
      console.warn(`[DriftDetection] Drift detected for account ${acc.id} (${acc.nickname}). Current: ${acc.balance}, Calculated: ${calculatedBalance}. Rectifying...`);
      acc.balance = parseFloat(calculatedBalance.toFixed(2));
      driftDetected = true;
    }
  }

  if (driftDetected) {
    try {
      await runTransaction(firestore, async (transaction) => {
        const freshDoc = await transaction.get(accountDocRef);
        if (freshDoc.exists()) {
          const freshData = freshDoc.data();
          const freshAccountsArr = freshData.accounts || [];

          // Merge calculated balance and initialBalance onto fresh accounts array
          updatedAccounts.forEach(updatedAcc => {
            const freshIdx = freshAccountsArr.findIndex((a: any) => a.id === updatedAcc.id);
            if (freshIdx !== -1) {
              freshAccountsArr[freshIdx].balance = updatedAcc.balance;
              freshAccountsArr[freshIdx].initialBalance = (updatedAcc as any).initialBalance;
            } else {
              // Add if missing
              freshAccountsArr.push({
                ...updatedAcc,
                initialBalance: (updatedAcc as any).initialBalance
              });
            }
          });

          transaction.update(accountDocRef, { accounts: freshAccountsArr });
        }
      });
      console.log(`[DriftDetection] Successfully verified and rectified balance drift for ${targetEmail}`);
    } catch (e) {
      console.error('[DriftDetection] Failed to commit rectified balance transaction:', e);
    }
  }
}
