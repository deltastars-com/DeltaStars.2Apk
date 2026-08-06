import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, collection, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, orderBy, limit,
  getDocFromServer, addDoc, serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, User as FirebaseUser,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
} from 'firebase/auth';
import {
  getMessaging, getToken, onMessage,
  isSupported as isMessagingSupported,
} from 'firebase/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore — use specific databaseId with auto-detect long polling for optimal connection stability
export let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalAutoDetectLongPolling: true
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e2) {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ============================================================
// OperationType enum (used throughout app)
// ============================================================
export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete',
  LIST = 'list', GET = 'get', WRITE = 'write',
}

// ============================================================
// Error handler conforming to Firebase Integration Skill
// ============================================================
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                             errorMessage.toLowerCase().includes('insufficient');

  if (isPermissionDenied) {
    const errInfo: FirestoreErrorInfo = {
      error: errorMessage,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path: path || null
    };
    const jsonError = JSON.stringify(errInfo);
    console.error('Firestore Error: ', jsonError);
    throw new Error(jsonError);
  }

  // Gracefully handle connectivity / unreachable / offline events
  const isOffline = errorMessage.toLowerCase().includes('could not reach') || 
                    errorMessage.toLowerCase().includes('offline') || 
                    errorMessage.toLowerCase().includes('unavailable') || 
                    errorMessage.toLowerCase().includes('connection');

  if (isOffline) {
    console.warn(`[Firestore Offline Mode] Operation: ${operationType} on path: ${path || 'unknown'}. App will continue using local offline cache seamlessly.`);
    return;
  }

  console.error('[Firestore]', operationType, path, error);
  throw error;
}

// ============================================================
// FCM Push Notifications
// ============================================================
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_VAPID_KEY || '';

export async function initFCM(): Promise<string | null> {
  try {
    const supported = await isMessagingSupported();
    if (!supported || !VAPID_KEY) return null;
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return await getToken(messaging, { vapidKey: VAPID_KEY });
  } catch { return null; }
}

export async function listenForMessages(callback: (p: any) => void): Promise<() => void> {
  try {
    const supported = await isMessagingSupported();
    if (!supported) return () => {};
    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  } catch { return () => {}; }
}

export async function testFirestoreConnection() {
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
    await Promise.race([getDocFromServer(doc(db, '_health', 'ping')), timeoutPromise]);
  } catch { /* offline mode is fine */ }
}

// ============================================================
// Re-exports for all components
// ============================================================
export {
  signInWithPopup, signOut, onAuthStateChanged,
  fbSendPasswordResetEmail as sendPasswordResetEmail,
  doc, collection, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, orderBy, limit,
  addDoc, serverTimestamp, isMessagingSupported,
};
export type { FirebaseUser };
