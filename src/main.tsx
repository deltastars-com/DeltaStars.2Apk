import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SovereignProvider } from './components/lib/contexts';
import { AppProvider } from './contexts/AppContext';
import { createUpdateManager } from './utils/UpdateManager';
import { mockProducts } from './components/lib/vip/products';
import './index.css';

// ── Bulletproof Runtime Context Fallback Verification ──
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'your-supabase-url-here' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-supabase-anon-key-here' &&
  import.meta.env.VITE_SUPABASE_URL.trim() !== ''
);

// Establish resilient global state flags
(window as any).__DELTA_STARS_RESILIENT_MODE__ = !isSupabaseConfigured;
if (!isSupabaseConfigured) {
  console.warn(
    '⚡ [Delta Stars Architecture] Supabase environment keys are missing or unconfigured. ' +
    'Seamlessly activated the local resilient catalog mode with native products to guarantee 100% stable uptime.'
  );
  // Inject robust schema fallback directly on window for high-performance retrieval
  (window as any).__DELTA_STARS_FALLBACK_CATALOG__ = {
    products: mockProducts,
    categories: [
      { id: 'vegetables', name_ar: 'خضروات طازجة', name_en: 'Fresh Vegetables', icon: 'Leaf' },
      { id: 'fruits', name_ar: 'فواكه موسمية', name_en: 'Seasonal Fruits', icon: 'Apple' },
      { id: 'dates', name_ar: 'تمور فاخرة', name_en: 'Premium Dates', icon: 'Calendar' },
      { id: 'herbs', name_ar: 'ورقيات وأعشاب', name_en: 'Herbs & Greens', icon: 'Sparkles' },
      { id: 'packages', name_ar: 'سلال عائلية', name_en: 'Family Packages', icon: 'ShoppingBag' }
    ],
    updatedAt: new Date().toISOString()
  };
} else {
  console.log('⚡ [Delta Stars Architecture] Supabase keys verified. Connected to cloud database.');
}

// ── Automated Cache-Busting & Live Update Manager ──
try {
  createUpdateManager({
    appVersion: '1.0.0',
    buildTime: '2026-07-08T12:00:00Z',
    checkInterval: 120, // Check for newer versions every 120s to bypass old client caches
  }).start();
} catch (error) {
  console.error('⚠️ [UpdateManager] Startup failed:', error);
}

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

// Render the Application Mount
createRoot(container).render(
  <SovereignProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </SovereignProvider>
);

// ── Dismiss the Critical Boot Splash Screen after Rendering completes ──
setTimeout(() => {
  const splash = document.getElementById('delta-critical-boot-splash');
  if (splash) {
    splash.classList.add('loaded');
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      try {
        splash.remove();
      } catch (err) {
        try { splash.style.display = 'none'; } catch (e) {}
      }
    }, 400); // Allow fadeout transition to finish smoothly
  }
}, 0);

// ── PWA Service Worker Registration & Progressive Installation Engine ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ [Delta Stars PWA] Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.warn('⚠️ [Delta Stars PWA] Service Worker registration skipped or failed:', error);
      });
  });
}

// Global PWA Install Prompt Listener
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPWAInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable'));
  console.log('📱 [Delta Stars PWA] Application is ready for instant native installation.');
});

