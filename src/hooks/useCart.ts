import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { Product, CartItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const SESSION_ID_KEY = 'delta_stars_session_id';

const getSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useToast();
  const sessionId = getSessionId();

  const loadCart = useCallback(async () => {
    // In a real app, we'd fetch from DB
    const stored = localStorage.getItem('delta_cart');
    if (stored) {
      setItems(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const saveCart = useCallback(async (newItems: CartItem[]) => {
    localStorage.setItem('delta_cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('delta_cart_updated'));
  }, []);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === product.id);
      let newItems;
      
      if (existingIndex >= 0) {
        newItems = [...prevItems];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
      } else {
        newItems = [...prevItems, { ...product, quantity }];
      }
      
      saveCart(newItems);
      addToast(`تمت إضافة ${product.name_ar} إلى السلة`, 'success');
      return newItems;
    });
  }, [saveCart, addToast]);

  const removeItem = useCallback((productId: number) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== productId);
      saveCart(newItems);
      addToast('تم إزالة المنتج من السلة', 'info');
      return newItems;
    });
  }, [saveCart, addToast]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart, removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
    addToast('تم تفريغ السلة', 'info');
  }, [saveCart, addToast]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.price_1kg || item.price_500g || 0;
    return sum + (price * item.quantity);
  }, 0);
  
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    loadCart();
    
    const handleSync = () => {
      const stored = localStorage.getItem('delta_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems([]);
      }
    };

    window.addEventListener('delta_cart_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('delta_cart_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadCart]);

  return {
    items,
    loading,
    itemCount,
    subtotal,
    tax,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isCartEmpty: items.length === 0,
  };
};

export default useCart;
