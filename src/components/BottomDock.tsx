import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import { useI18n } from './lib/contexts/I18nContext';
import { 
  GlobeIcon, 
  ShoppingCartIcon, 
  UserIcon, 
  ZapIcon
} from './lib/contexts/Icons';

interface BottomDockProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onToggleAiAssistant: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentPage,
  onNavigate,
  onToggleAiAssistant,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { language } = useI18n();

  const ar = language === 'ar';

  // Determine user account target page
  const getAccountPage = () => {
    if (!isAuthenticated) return 'login';
    if (user?.role === 'driver') return 'driver_dashboard';
    return 'vip_dashboard';
  };

  const accountPage = getAccountPage();

  return (
    <>
      {/* ── 1. Floating AI Assistant (Oday) on Far Right (Mobile Ergonomic Position) ── */}
      <div className="fixed bottom-7 right-5 md:bottom-9 md:right-8 z-50 flex flex-col items-center pointer-events-auto">
        {/* Glowing pulsing rings behind the AI button */}
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full opacity-25 blur-md animate-pulse" />
        <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full opacity-15 animate-ping duration-1000" />
        
        <button
          onClick={onToggleAiAssistant}
          className="relative w-11 h-11 md:w-13 md:h-13 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full shadow-[0_6px_25px_rgba(16,185,129,0.45)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-yellow-400/80"
          title={ar ? 'المساعد عدي' : 'Oday Assistant'}
        >
          <span className="text-xl md:text-2xl filter drop-shadow-md">🌟</span>
        </button>
        
        {/* Sleek, tiny gold tag for Oday */}
        <span className="text-[8px] font-black text-yellow-400 mt-1.5 tracking-wider bg-black/95 px-2 py-0.5 rounded-full border border-yellow-400/40 shadow-lg backdrop-blur-sm">
          {ar ? 'عدي' : 'Oday'}
        </span>
      </div>

      {/* ── 2. Highly Premium Fully Transparent Floating Navigation Bar ── */}
      <div className="fixed bottom-7 left-5 z-50 pointer-events-none flex w-[calc(100%-80px)] max-w-[340px]">
        <div className="w-full pointer-events-auto">
          {/* 
            Fully transparent floating luxury bar.
            Completely background-free, borderless, and shadow-free as requested ("بشكل شفاف وبدون اي خلفيات").
            Uses beautiful high-contrast drop-shadows on individual button wrappers for perfect legibility on any page background.
          */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex justify-around items-center py-2 px-1 bg-transparent border-0 shadow-none"
          >
            {/* Tab 1: الرئيسية (Home) */}
            <button
              onClick={() => onNavigate('home')}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] ${
                currentPage === 'home' 
                  ? 'text-yellow-400 scale-110 font-bold' 
                  : 'text-white hover:text-yellow-400'
              }`}
            >
              <GlobeIcon className="w-6 h-6 transition-transform filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              <span className="text-[10px] font-black tracking-wider font-tajawal filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]">
                {ar ? 'الرئيسية' : 'Home'}
              </span>
              {currentPage === 'home' && (
                <motion.div 
                  layoutId="activeTabIndicatorCapsule"
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_#fbbf24] mt-1"
                />
              )}
            </button>

            {/* Tab 2: العروض (Showroom) */}
            <button
              onClick={() => onNavigate('showroom')}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] ${
                currentPage === 'showroom' 
                  ? 'text-yellow-400 scale-110 font-bold' 
                  : 'text-white hover:text-yellow-400'
              }`}
            >
              <ZapIcon className="w-6 h-6 transition-transform filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              <span className="text-[10px] font-black tracking-wider font-tajawal filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]">
                {ar ? 'العروض' : 'Offers'}
              </span>
              {currentPage === 'showroom' && (
                <motion.div 
                  layoutId="activeTabIndicatorCapsule"
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_#fbbf24] mt-1"
                />
              )}
            </button>

            {/* Tab 3: السلة (Cart) */}
            <button
              onClick={() => onNavigate('cart')}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative flex-1 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] ${
                currentPage === 'cart' 
                  ? 'text-yellow-400 scale-110 font-bold' 
                  : 'text-white hover:text-yellow-400'
              }`}
            >
              <div className="relative">
                <ShoppingCartIcon className="w-6 h-6 transition-transform filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2.5 -right-2.5 bg-yellow-400 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-black shadow-md"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[10px] font-black tracking-wider font-tajawal filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]">
                {ar ? 'السلة' : 'Cart'}
              </span>
              {currentPage === 'cart' && (
                <motion.div 
                  layoutId="activeTabIndicatorCapsule"
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_#fbbf24] mt-1"
                />
              )}
            </button>

            {/* Tab 4: حسابي / الإدارة (Account) */}
            <button
              onClick={() => onNavigate(accountPage)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] ${
                ['login', 'vip_dashboard', 'driver_dashboard'].includes(currentPage) 
                  ? 'text-yellow-400 scale-110 font-bold' 
                  : 'text-white hover:text-yellow-400'
              }`}
            >
              <UserIcon className="w-6 h-6 transition-transform filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              <span className="text-[10px] font-black tracking-wider font-tajawal filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]">
                {ar ? 'حسابي' : 'Account'}
              </span>
              {['login', 'vip_dashboard', 'driver_dashboard'].includes(currentPage) && (
                <motion.div 
                  layoutId="activeTabIndicatorCapsule"
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_#fbbf24] mt-1"
                />
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
};
