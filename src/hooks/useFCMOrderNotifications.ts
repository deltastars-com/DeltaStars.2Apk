import { useState, useEffect, useCallback } from 'react';
import { 
  initFCM, 
  listenForMessages, 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  isMessagingSupported 
} from '../firebase';

export interface OrderStatusNotification {
  orderId: string;
  status: string;
  statusAr: string;
  statusEn: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  timestamp: string;
}

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  processing: { ar: 'قيد المعالجة', en: 'Processing' },
  preparing: { ar: 'جاري التجهيز بالمستودع', en: 'Preparing in warehouse' },
  ready: { ar: 'جاهز للشحن والتوصيل', en: 'Ready for delivery' },
  assigned: { ar: 'تم تعيين مندوب التوصيل', en: 'Driver assigned' },
  shipped: { ar: 'جاري التوصيل مع مندوب نجوم دلتا', en: 'Out for delivery' },
  delivered: { ar: 'تم التوصيل بنجاح، شكراً لتعاملك معنا', en: 'Delivered successfully' },
  cancelled: { ar: 'تم إلغاء الطلب', en: 'Order cancelled' },
  refunded: { ar: 'تم استرداد المبلغ بنجاح', en: 'Payment refunded' }
};

export function useFCMOrderNotifications(userId?: string) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [lastOrderUpdate, setLastOrderUpdate] = useState<OrderStatusNotification | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<OrderStatusNotification[]>([]);

  // Check support & init token
  useEffect(() => {
    let isMounted = true;
    isMessagingSupported().then((supported) => {
      if (isMounted) setIsSupported(supported);
    }).catch(() => {});

    initFCM().then((token) => {
      if (isMounted && token) {
        setFcmToken(token);
        if (typeof Notification !== 'undefined') {
          setPermissionState(Notification.permission);
        }
      }
    });

    // Foreground message listener
    const unsubscribePromise = listenForMessages((payload) => {
      if (payload?.data?.type === 'order' || payload?.data?.orderId) {
        const update: OrderStatusNotification = {
          orderId: payload.data.orderId || '',
          status: payload.data.status || 'updated',
          statusAr: payload.data.statusAr || statusLabels[payload.data.status]?.ar || payload.data.status,
          statusEn: payload.data.statusEn || statusLabels[payload.data.status]?.en || payload.data.status,
          titleAr: payload.notification?.title || `تحديث الطلب #${payload.data.orderId?.substring(0, 8)}`,
          titleEn: payload.notification?.title || `Order Update #${payload.data.orderId?.substring(0, 8)}`,
          messageAr: payload.notification?.body || 'تغيرت حالة الطلب الخاص بك',
          messageEn: payload.notification?.body || 'Your order status has changed',
          timestamp: new Date().toISOString()
        };

        setLastOrderUpdate(update);
        setRecentUpdates(prev => [update, ...prev.slice(0, 19)]);

        // Browser desktop notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(update.titleAr, {
            body: update.messageAr,
            icon: '/icon-192.png',
            tag: `order-${update.orderId}`
          });
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribePromise.then(unsub => unsub && unsub()).catch(() => {});
    };
  }, []);

  // Sync token to Firestore if user is present
  useEffect(() => {
    if (!fcmToken || !userId) return;
    const saveToken = async () => {
      try {
        const tokenId = fcmToken.substring(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
        await setDoc(doc(db, 'fcm_tokens', tokenId), {
          userId,
          token: fcmToken,
          platform: 'web',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[FCM Order Hook] Firestore token save warning:', err);
      }
    };
    saveToken();
  }, [fcmToken, userId]);

  // Realtime order status listener via Firestore
  useEffect(() => {
    if (!userId) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', userId)
    );

    const statusCache: Record<string, string> = {};
    let initialLoad = true;

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;
        const currentStatus = data.status;

        if (change.type === 'added') {
          statusCache[id] = currentStatus;
        }

        if (change.type === 'modified' && !initialLoad) {
          const prevStatus = statusCache[id];
          if (prevStatus !== currentStatus) {
            const label = statusLabels[currentStatus] || { ar: currentStatus, en: currentStatus };
            const update: OrderStatusNotification = {
              orderId: id,
              status: currentStatus,
              statusAr: label.ar,
              statusEn: label.en,
              titleAr: `تحديث حالة الطلب #${id.substring(0, 8)}`,
              titleEn: `Order Status Update #${id.substring(0, 8)}`,
              messageAr: `تغيرت حالة طلبك إلى: ${label.ar}`,
              messageEn: `Your order status was updated to: ${label.en}`,
              timestamp: new Date().toISOString()
            };

            setLastOrderUpdate(update);
            setRecentUpdates(prev => [update, ...prev.slice(0, 19)]);

            // Trigger notification popup
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(update.titleAr, {
                body: update.messageAr,
                icon: '/icon-192.png',
                tag: `order-${id}`
              });
            }
          }
        }
        statusCache[id] = currentStatus;
      });
      initialLoad = false;
    }, (err) => {
      console.warn('[FCM Order Hook Listener warning]:', err.message);
    });

    return () => unsubscribe();
  }, [userId]);

  // Function to explicitly request permission and get FCM token
  const requestPermissionAndGetToken = useCallback(async () => {
    if (typeof Notification === 'undefined') return null;
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        const token = await initFCM();
        setFcmToken(token);
        return token;
      }
      return null;
    } catch (e) {
      console.error('[FCM Order Hook] Request permission error:', e);
      return null;
    }
  }, []);

  // Function to dispatch real-time order status update to customer device
  const sendOrderStatusUpdate = useCallback(async ({
    orderId,
    status,
    customerId,
    customMessageAr,
    customMessageEn
  }: {
    orderId: string;
    status: string;
    customerId: string;
    customMessageAr?: string;
    customMessageEn?: string;
  }) => {
    const label = statusLabels[status] || { ar: status, en: status };
    const titleAr = `تحديث حالة الطلب #${orderId.substring(0, 8)}`;
    const titleEn = `Order Status Update #${orderId.substring(0, 8)}`;
    const messageAr = customMessageAr || `تم تحديث حالة طلبك إلى: ${label.ar}`;
    const messageEn = customMessageEn || `Your order status was updated to: ${label.en}`;

    try {
      // 1. Store in Firestore notifications collection
      await addDoc(collection(db, 'notifications'), {
        title_ar: titleAr,
        title_en: titleEn,
        message_ar: messageAr,
        message_en: messageEn,
        userId: customerId,
        type: 'order',
        orderId,
        status,
        createdAt: new Date().toISOString(),
        isRead: false
      });

      // 2. Also update order record status if needed
      await setDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (err) {
      console.error('[FCM Order Hook] Error sending status update:', err);
    }
  }, []);

  return {
    fcmToken,
    permissionState,
    isSupported,
    lastOrderUpdate,
    recentUpdates,
    requestPermissionAndGetToken,
    sendOrderStatusUpdate
  };
}

export default useFCMOrderNotifications;
