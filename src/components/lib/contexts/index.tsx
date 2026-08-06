import React from 'react';
import { I18nProvider } from './I18nContext';
import { FirebaseProvider } from './FirebaseContext';
import { GeminiAiProvider } from './GeminiContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';

export const SovereignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <I18nProvider>
      <FirebaseProvider>
        <GeminiAiProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </GeminiAiProvider>
      </FirebaseProvider>
    </I18nProvider>
  );
};

export * from './I18nContext';
export * from './GeminiContext';
export * from './FirebaseContext';
export * from './Icons';
export { ProductsPage } from './ProductsPage';
export { CartPage } from './CartPage';
export { WishlistPage } from './WishlistPage';
export { ProductDetailPage } from './ProductDetailPage';
export * from '../../../contexts/ToastContext';
