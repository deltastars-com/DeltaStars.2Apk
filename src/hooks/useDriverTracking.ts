import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'truck' | 'car';
  rating: number;
  current_status: 'online' | 'offline' | 'delivering';
  last_location: Location | null;
}

export const useDriverTracking = (orderId?: string) => {
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const calculateETA = useCallback((driverLat: number, driverLng: number, destLat: number, destLng: number) => {
    const R = 6371; 
    const dLat = (destLat - driverLat) * Math.PI / 180;
    const dLng = (destLng - driverLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(driverLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    const minutes = Math.round((distance / 30) * 60);
    return minutes;
  }, []);

  const startTracking = useCallback(async (driverId: string, destination?: Location) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    setIsTracking(true);
    
    try {
      const info = await api.getDriverInfo(driverId);
      setDriverInfo(info);
    } catch (error) {
      console.error('Failed to fetch driver info:', error);
    }
    
    if (orderId) {
      unsubscribeRef.current = api.subscribeToDriverLocation(orderId, (payload) => {
        setDriverLocation({ lat: payload.lat, lng: payload.lng });
        
        if (destination) {
          const etaMinutes = calculateETA(payload.lat, payload.lng, destination.lat, destination.lng);
          setEta(etaMinutes);
        }
      });
    }
  }, [orderId, calculateETA]);

  const stopTracking = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsTracking(false);
    setDriverLocation(null);
    setDriverInfo(null);
    setEta(null);
  }, []);

  const updateMyLocation = useCallback(async (lat: number, lng: number, currentOrderId?: string) => {
    if (!user?.id) {
      addToast('يجب تسجيل الدخول كمندوب أولاً', 'error');
      return false;
    }
    
    try {
      await api.updateDriverLocation(user.id, lat, lng, currentOrderId || orderId);
      return true;
    } catch (error) {
      console.error('Failed to update location:', error);
      return false;
    }
  }, [user?.id, orderId, addToast]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    driverLocation,
    driverInfo,
    isTracking,
    eta,
    startTracking,
    stopTracking,
    updateMyLocation,
  };
};

export default useDriverTracking;
