/**
 * Delta Stars — Notification Context
 * Firebase Cloud Messaging with Real-Time Firestore Synchronization
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { initFCM, listenForMessages, db, collection, query, orderBy, limit, onSnapshot, addDoc, doc, setDoc, where } from '../firebase';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useI18n } from '../components/lib/contexts/I18nContext';
import { useToast } from './ToastContext';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'promo' | 'system' | 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fcmToken: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => void;
  sendNotification: (payload: {
    userId?: string;
    title: string;
    message?: string;
    body?: string;
    type?: any;
    priority?: string;
    targetRole?: string;
  }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [], unreadCount: 0, fcmToken: null,
  markAsRead: async () => {}, markAllRead: async () => {}, clearAll: () => {},
  sendNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { user } = useAuth();
  const { language } = useI18n();
  const { addToast } = useToast();
  // Hoisted cleanup holder so the FCM init listeners registered below can be
  // removed on unmount from a later effect's cleanup phase.
  const cleanupEventsRef = useRef<() => void>(() => {});

  // 1. Initialize FCM (Firebase Cloud Messaging) and save token
  //    — deferred until the user has interacted with the page at least
  //    once, per Chrome's "responsible notification permission" guidance
  //    (flagged by PageSpeed as a best-practices violation when requested
  //    unconditionally on load).
  useEffect(() => {
    let triggered = false;
    const runInitFCM = () => {
      if (triggered) return;
      triggered = true;
      initFCM().then(async (token) => {
        if (!token) return;
        setFcmToken(token);

        // Save to Supabase for push backups
        try {
          await supabase.from('fcm_tokens').upsert({
            token,
            platform: 'web',
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error('FCM token save error (Supabase):', e);
        }
      });
    };

    // If the browser already granted/denied permission previously, it's
    // safe to re-check immediately (no new prompt will be shown).
    const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    if (typeof Notification !== 'undefined' && Notification.permission !== 'default') {
      runInitFCM();
    } else {
      interactionEvents.forEach(evt => window.addEventListener(evt, runInitFCM, { once: true, passive: true }));
      cleanupEventsRef.current = () => interactionEvents.forEach(evt => window.removeEventListener(evt, runInitFCM));
    }

    // Listen for foreground web messages
    listenForMessages((payload) => {
      const notif: Notification = {
        id: Date.now().toString(),
        title: payload?.notification?.title || 'إشعار جديد',
        body: payload?.notification?.body || '',
        type: payload?.data?.type || 'system',
        read: false,
        createdAt: new Date().toISOString(),
        data: payload?.data,
      };
      setNotifications(prev => [notif, ...prev.slice(0, 49)]);

      // Display in-app toast notification
      if (addToast) {
        const toastType = notif.type === 'error' ? 'error' : notif.type === 'success' ? 'success' : notif.type === 'warning' ? 'warning' : 'info';
        addToast(`${notif.title}: ${notif.body}`, toastType);
      }
      
      // Trigger a beautiful browser desktop alert
      if (Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.body, icon: '/icon-192.png' });
      }
    }).catch(() => {});
  }, [addToast]);

  // 2. Save / Bind FCM token to the authenticated user in Firestore
  useEffect(() => {
    if (!fcmToken) return;
    
    const saveTokenToFirestore = async () => {
      try {
        const tokenId = fcmToken.substring(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
        await setDoc(doc(db, 'fcm_tokens', tokenId), {
          userId: user?.uid || user?.id || 'anonymous',
          token: fcmToken,
          platform: 'web',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error saving FCM token to Firestore:', err);
      }
    };

    saveTokenToFirestore();
  }, [fcmToken, user]);

  // 3. Real-Time Firestore Synchronization for Personal & Broadcast Notifications
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbNotifs: Notification[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Show if broadcast (all) or matched to current user's uid/id
        const belongsToUser = user && (data.userId === user.uid || data.userId === user.id);
        const isBroadcast = data.userId === 'all' || !data.userId;

        if (isBroadcast || belongsToUser) {
          dbNotifs.push({
            id: doc.id,
            title: language === 'ar' ? (data.title_ar || data.title) : (data.title_en || data.title || data.title_ar),
            body: language === 'ar' ? (data.message_ar || data.message || data.body) : (data.message_en || data.message || data.body || data.message_ar),
            type: data.type || 'system',
            read: data.isRead || false,
            createdAt: data.createdAt || new Date().toISOString(),
            data: data
          });
        }
      });

      // Update state
      setNotifications(dbNotifs);

      // Check if there is a fresh notification (less than 6 seconds old) to trigger sound & pop-up
      const nowMs = Date.now();
      const freshNotif = dbNotifs.find(n => {
        const ageMs = nowMs - new Date(n.createdAt).getTime();
        return ageMs > 0 && ageMs < 6000 && !n.read;
      });

      if (freshNotif) {
        // Play luxury alert chime
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
          audio.volume = 0.45;
          audio.play().catch(() => {});
        } catch (e) {}

        // Browser push
        if (Notification.permission === 'granted') {
          new Notification(freshNotif.title, {
            body: freshNotif.body,
            icon: '/icon-192.png'
          });
        }
      }
    }, (error) => {
      console.warn('[Real-Time Notifications Sync offline/bypass]:', error.message);
    });

    return () => { unsubscribe(); cleanupEventsRef.current(); };
  }, [user, language]);

  // 4. Real-Time Order Status Tracker Listener for active customers
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid || user.id || ''),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const statusCache: Record<string, string> = {};
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        if (change.type === 'added') {
          statusCache[orderId] = currentStatus;
        }

        if (change.type === 'modified' && !isInitialLoad) {
          const previousStatus = statusCache[orderId];
          if (previousStatus && previousStatus !== currentStatus) {
            // Status updated! Build multilingual notifications
            const statusLabelsAr: Record<string, string> = {
              pending: 'قيد الانتظار',
              preparing: 'جاري تجهيزه بالمستودع',
              setup: 'مجهز وفي انتظار سائق نجوم دلتا',
              shipped: 'خارج للتوصيل الآن مع المندوب',
              delivered: 'تم التوصيل بنجاح، شكراً لتعاملك معنا',
              cancelled: 'تم إلغاء الطلب'
            };

            const statusLabelsEn: Record<string, string> = {
              pending: 'Pending',
              preparing: 'Preparing in warehouse',
              setup: 'Prepared and awaiting driver assignment',
              shipped: 'Out for delivery with the delegate',
              delivered: 'Delivered successfully, thank you for choosing Delta Stars',
              cancelled: 'Order has been cancelled'
            };

            const statusAr = statusLabelsAr[currentStatus] || currentStatus;
            const statusEn = statusLabelsEn[currentStatus] || currentStatus;

            const titleAr = `تحديث حالة الطلب #${orderId.substring(0, 8)}`;
            const titleEn = `Order Status Update #${orderId.substring(0, 8)}`;
            const messageAr = `تغيرت حالة طلبك إلى: ${statusAr}`;
            const messageEn = `Your order status has been updated to: ${statusEn}`;

            // Trigger toast notification
            if (addToast) {
              const toastMsg = language === 'ar' ? `${titleAr} — ${messageAr}` : `${titleEn} — ${messageEn}`;
              const toastType = currentStatus === 'cancelled' ? 'error' : currentStatus === 'delivered' ? 'success' : 'info';
              addToast(toastMsg, toastType);
            }

            // Add notification directly to Firestore
            addDoc(collection(db, 'notifications'), {
              title_ar: titleAr,
              title_en: titleEn,
              message_ar: messageAr,
              message_en: messageEn,
              userId: user.uid || user.id,
              type: 'order',
              createdAt: new Date().toISOString(),
              isRead: false,
              orderId: orderId
            }).catch((err) => console.error('Error auto-inserting order status update:', err));
          }
        }

        // Keep cache updated
        statusCache[orderId] = currentStatus;
      });

      isInitialLoad = false;
    }, (error) => {
      console.warn('[Order Status Track Listener offline/bypass]:', error.message);
    });

    return () => unsubscribe();
  }, [user, language, addToast]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic local state update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    // Update in Firestore
    try {
      await setDoc(doc(db, 'notifications', id), { isRead: true }, { merge: true });
    } catch (e) {
      console.warn('Error marking notification as read in Firestore:', e);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // Batch update read states in Firestore
    try {
      const promises = notifications.map(n => 
        setDoc(doc(db, 'notifications', n.id), { isRead: true }, { merge: true })
      );
      await Promise.all(promises);
    } catch (e) {
      console.warn('Error marking all notifications as read in Firestore:', e);
    }
  }, [notifications]);

  const clearAll = useCallback(() => setNotifications([]), []);

  const sendNotification = useCallback(async (payload: any) => {
    // Broadcast locally and to database
    const notifData = {
      title_ar: payload.title_ar || payload.title || 'إشعار جديد',
      title_en: payload.title_en || payload.title || 'New Notification',
      message_ar: payload.message_ar || payload.message || payload.body || '',
      message_en: payload.message_en || payload.message || payload.body || '',
      type: payload.type || 'system',
      userId: payload.userId || 'all',
      createdAt: new Date().toISOString(),
      isRead: false,
      orderId: payload.orderId || null
    };

    try {
      await addDoc(collection(db, 'notifications'), notifData);
    } catch (e) {
      console.warn('Fallback to local-only notification:', e);
      // Fallback
      const notif: Notification = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
        title: language === 'ar' ? notifData.title_ar : notifData.title_en,
        body: language === 'ar' ? notifData.message_ar : notifData.message_en,
        type: notifData.type as any,
        read: false,
        createdAt: notifData.createdAt,
        data: payload
      };
      setNotifications(prev => [notif, ...prev.slice(0, 49)]);
    }
  }, [language]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, fcmToken,
      markAsRead, markAllRead, clearAll, sendNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

