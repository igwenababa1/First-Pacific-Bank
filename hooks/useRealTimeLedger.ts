import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { Transaction, TransactionStatus, UserProfile, Account, NotificationType } from "../types";

export const useRealTimeLedger = (
  userProfile: UserProfile | null,
  accounts: Account[],
  addNotification: (type: NotificationType, title: string, message: string) => void
) => {
  const [isUpdatingLedger, setIsUpdatingLedger] = useState(false);
  const prevAwaitingIdsRef = useRef<string[]>([]);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (!userProfile?.email || accounts.length === 0) return;

    const userAccountIds = accounts.map(a => a.id);
    const q = query(
      collection(db, "transactions"),
      where("status", "==", TransactionStatus.AWAITING_PAYMENT_VERIFICATION)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentAwaitingIds: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.id && userAccountIds.includes(data.accountId)) {
          currentAwaitingIds.push(data.id);
        }
      });

      console.log("📬 [useRealTimeLedger] Current awaiting verification IDs:", currentAwaitingIds);

      if (isFirstRunRef.current) {
        prevAwaitingIdsRef.current = currentAwaitingIds;
        isFirstRunRef.current = false;
        return;
      }

      // Check if any transaction ID was in the previous set but is no longer present
      const transitionedOut = prevAwaitingIdsRef.current.filter(
        id => !currentAwaitingIds.includes(id)
      );

      if (transitionedOut.length > 0) {
        console.log("🚀 [useRealTimeLedger] Transaction(s) transitioned out of AWAITING_PAYMENT_VERIFICATION:", transitionedOut);
        
        // 1. Set visual progress spinner to true
        setIsUpdatingLedger(true);
        
        // 2. Add toast notification
        addNotification(
          NotificationType.TRANSACTION,
          "Clearinghouse Update In Progress",
          "Your transaction is clearing verification. The clearinghouse is currently updating the Global Ledger in real-time."
        );

        // 3. Dispatch global custom event REALTIME_LEDGER_UPDATE
        window.dispatchEvent(new CustomEvent("REALTIME_LEDGER_UPDATE", { 
          detail: { transitionedIds: transitionedOut } 
        }));

        // Reset visual spinner after 4 seconds
        setTimeout(() => {
          setIsUpdatingLedger(false);
        }, 4000);
      }

      prevAwaitingIdsRef.current = currentAwaitingIds;
    }, (error) => {
      const errInfo = {
        error: error.message,
        operationType: "list",
        path: "transactions",
        authInfo: {
          email: userProfile?.email
        }
      };
      console.error("Firestore Error in useRealTimeLedger: ", JSON.stringify(errInfo));
    });

    return () => {
      unsubscribe();
    };
  }, [userProfile?.email, accounts, addNotification]);

  return { isUpdatingLedger };
};
