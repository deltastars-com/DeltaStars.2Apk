import React, {
  createContext, useContext, useCallback,
  ReactNode, useEffect, useRef, useState,
} from 'react';
import { initFCM, listenForMessages } from '../firebase';
import { supabase } from '../supabaseClient';
import type { MessagePayload } from 'firebase/messaging';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface PaymentGatewayConfig {
  publicKey: string;
  merchantId: string;
  branchId?: string;
  supportedMethods: string[];
}

export interface OrderConfirmationData {
  orderId: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
}

export interface OfflineOrder {
  id: string;
  items: any[];
  total: number;
  createdAt: number;
  status: 'pending' | 'synced' | 'failed';
}

interface AppContextType {
  initializePaymentGateway: () => Promise<PaymentGatewayConfig>;
  checkPendingOrders: () => Promise<void>;
  sendOrderConfirmation: (orderId: string, data?: Partial<OrderConfirmationData>) => Promise<void>;
  registerPushToken: () => Promise<string | null>;
  syncOfflineData: () => Promise<void>;
  unregisterPushToken: () => Promise<boolean>;
  sendCustomNotification: (payload: PushNotificationPayload) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: 'paid' | 'failed' | 'pending') => Promise<void>;
  getPaymentConfig: () => Promise<PaymentGatewayConfig | null>;
  saveOfflineOrder: (order: OfflineOrder) => Promise<void>;
  getOfflineOrders: () => Promise<OfflineOrder[]>;
  clearOfflineOrders: () => Promise<void>;
  refreshAuthToken: () => Promise<string>;
  isOnline: boolean;
  pendingNotification: MessagePayload | null;
  clearPendingNotification: () => void;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingNotification, setPendingNotification] = useState<MessagePayload | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig | null>(null);
  const isMounted = useRef(true);

  // Online/offline listener
  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // Cleanup flag
  useEffect(() => () => { isMounted.current = false; }, []);

  // Firebase push notifications (web)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    listenForMessages((payload: MessagePayload) => {
      if (!isMounted.current) return;
      setPendingNotification(payload);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'نجوم دلتا', {
          body: payload.notification?.body || '',
          icon: '/official_logo.png',
        });
      }
    }).then(fn => { unsub = fn; });
    return () => { unsub?.(); };
  }, []);

  // ── Payment ──────────────────────────────────
  const initializePaymentGateway = useCallback(async (): Promise<PaymentGatewayConfig> => {
    const config: PaymentGatewayConfig = {
      publicKey: import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY || '',
      merchantId: 'deltastars',
      supportedMethods: ['creditcard', 'mada', 'applepay', 'stcpay'],
    };
    setPaymentConfig(config);
    return config;
  }, []);

  const getPaymentConfig = useCallback(async (): Promise<PaymentGatewayConfig | null> => {
    if (paymentConfig) return paymentConfig;
    try { return await initializePaymentGateway(); }
    catch { return null; }
  }, [paymentConfig, initializePaymentGateway]);

  const updatePaymentStatus = useCallback(
    async (orderId: string, status: 'paid' | 'failed' | 'pending'): Promise<void> => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    }, []
  );

  // ── Orders ───────────────────────────────────
  const checkPendingOrders = useCallback(async (): Promise<void> => {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .limit(50);
    console.log(`[AppContext] Pending orders: ${data?.length ?? 0}`);
  }, []);

  const sendOrderConfirmation = useCallback(
    async (orderId: string, _data?: Partial<OrderConfirmationData>): Promise<void> => {
      await fetch('/api/otp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'confirmed', phone: _data?.customerPhone }),
      }).catch(() => {});
    }, []
  );

  // ── Push Notifications ───────────────────────
  const registerPushToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await initFCM();
      if (!token) return null;
      // Detect platform safely (no @capacitor/core import needed at build time)
      const isNative = !!(
        typeof window !== 'undefined' &&
        (window as any).Capacitor?.isNative
      );
      await supabase.from('fcm_tokens').upsert({
        token,
        platform: isNative ? 'capacitor' : 'web',
        updated_at: new Date().toISOString(),
      });
      return token;
    } catch {
      return null;
    }
  }, []);

  const unregisterPushToken = useCallback(async (): Promise<boolean> => {
    try {
      const { deleteToken, getMessaging } = await import('firebase/messaging');
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const app = getApps().length ? getApp() : initializeApp({});
      await deleteToken(getMessaging(app));
      return true;
    } catch {
      return false;
    }
  }, []);

  const sendCustomNotification = useCallback(
    async (payload: PushNotificationPayload): Promise<void> => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.image || '/official_logo.png',
        });
      }
    }, []
  );

  // ── Offline Orders ───────────────────────────
  const saveOfflineOrder = useCallback(async (order: OfflineOrder): Promise<void> => {
    try {
      const existing: OfflineOrder[] = JSON.parse(
        sessionStorage.getItem('ds_offline_orders') || '[]'
      );
      const updated = [...existing.filter(o => o.id !== order.id), order];
      sessionStorage.setItem('ds_offline_orders', JSON.stringify(updated));
    } catch {}
  }, []);

  const getOfflineOrders = useCallback(async (): Promise<OfflineOrder[]> => {
    try {
      return JSON.parse(sessionStorage.getItem('ds_offline_orders') || '[]');
    } catch {
      return [];
    }
  }, []);

  const clearOfflineOrders = useCallback(async (): Promise<void> => {
    try { sessionStorage.removeItem('ds_offline_orders'); } catch {}
  }, []);

  const syncOfflineData = useCallback(async (): Promise<void> => {
    if (!isOnline) return;
    const orders = await getOfflineOrders();
    if (!orders.length) return;
    await Promise.allSettled(
      orders.map(o => supabase.from('orders').upsert(o))
    );
    await clearOfflineOrders();
  }, [isOnline, getOfflineOrders, clearOfflineOrders]);

  // ── Auth ─────────────────────────────────────
  const refreshAuthToken = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.access_token) throw error || new Error('No token');
    return data.session.access_token;
  }, []);

  const clearPendingNotification = useCallback(() => setPendingNotification(null), []);

  const value: AppContextType = {
    initializePaymentGateway, checkPendingOrders, sendOrderConfirmation,
    registerPushToken, syncOfflineData, unregisterPushToken, sendCustomNotification,
    updatePaymentStatus, getPaymentConfig, saveOfflineOrder, getOfflineOrders,
    clearOfflineOrders, refreshAuthToken, isOnline, pendingNotification,
    clearPendingNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
