import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, memoryLocalCache, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

// Global error handlers to catch and suppress benign IndexedDB/Storage errors in restricted iframe environments
if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
        const reasonStr = String(event.reason?.message || event.reason || "");
        if (
            reasonStr.includes("indexedDB") ||
            reasonStr.includes("backing store") ||
            reasonStr.includes("QuotaExceededError") ||
            reasonStr.includes("opening backing store") ||
            reasonStr.includes("Internal error opening backing store")
        ) {
            console.warn("[Firebase] Suppressed unhandled rejection for IndexedDB/Storage:", event.reason);
            event.preventDefault();
        }
    });

    window.addEventListener("error", (event) => {
        const msg = String(event.message || event.error?.message || "");
        if (
            msg.includes("indexedDB") ||
            msg.includes("backing store") ||
            msg.includes("QuotaExceededError") ||
            msg.includes("opening backing store") ||
            msg.includes("Internal error opening backing store")
        ) {
            console.warn("[Firebase] Suppressed global error for IndexedDB/Storage:", event.message);
            event.preventDefault();
        }
    });
}

// Patch Storage globally to prevent QuotaExceededError crashes from Firestore internal states
if (typeof Storage !== "undefined") {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        try {
            originalSetItem.call(this, key, value);
        } catch (e: any) {
            console.warn(`[Patched Storage] Suppressed setItem error for key: ${key}`, e);
        }
    };
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics: Analytics | null = null;
isSupported().then((supported) => {
    if (supported) {
        try {
            analytics = getAnalytics(app);
        } catch (e) {
            console.warn("Analytics initialization failed:", e);
        }
    }
}).catch((e) => {
    console.warn("Analytics not supported or blocked:", e);
});

const auth = getAuth(app);

// Use memoryLocalCache by default for Firestore in sandboxed/iframe preview contexts to avoid IndexedDB backing store errors
let db: any;
try {
    db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        localCache: memoryLocalCache(),
    }, firebaseConfig.firestoreDatabaseId);
    setLogLevel("silent");
} catch (e: any) {
    if (e.message && e.message.includes("has already been called")) {
        db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
        console.warn("[Firebase] Firestore initialization fallback:", e);
        try {
            db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
        } catch (finalErr) {
            console.error("Firestore final fallback error:", finalErr);
        }
    }
}

const storage = getStorage(app);

export { app, analytics, auth, db, storage };
