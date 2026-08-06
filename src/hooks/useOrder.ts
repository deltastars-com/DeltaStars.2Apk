import { useState } from 'react';
import { useFCMOrderNotifications } from './useFCMOrderNotifications';

export { useFCMOrderNotifications };

export const useOrder = (userId?: string) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fcm = useFCMOrderNotifications(userId);

  const refreshOrders = async () => {
    setLoading(true);
    setLoading(false);
  };

  return { orders, setOrders, loading, refreshOrders, fcm };
};

