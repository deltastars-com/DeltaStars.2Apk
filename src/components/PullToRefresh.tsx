import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { useI18n } from './lib/contexts/I18nContext';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  pullThreshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  pullThreshold = 75,
  className = ''
}) => {
  const { language } = useI18n();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Only pull if scrolled to top of window or container
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 2) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const dy = currentY - startYRef.current;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

    if (scrollTop <= 2 && dy > 0) {
      // Resistance curve calculation
      const dampening = 0.45;
      const distance = Math.min(dy * dampening, pullThreshold * 1.8);
      setPullDistance(distance);
      
      // Prevent browser default overscroll pull down on iOS/Android if pulling active
      if (distance > 10 && e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  }, [disabled, isRefreshing, pullThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || disabled) return;
    isPullingRef.current = false;

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      // Trigger haptic vibration if supported
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(35); } catch {}
      }

      try {
        await Promise.all([
          Promise.resolve(onRefresh()),
          new Promise(res => setTimeout(res, 800)) // ensure min smooth animation feedback
        ]);
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 600);
      } catch (err) {
        console.error('[PullToRefresh Sync Error]', err);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance, pullThreshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: TouchEvent) => handleTouchMove(e);
    const onStart = (e: TouchEvent) => handleTouchStart(e);
    const onEnd = () => handleTouchEnd();

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progressRatio = Math.min(pullDistance / pullThreshold, 1);
  const isReadyToRelease = pullDistance >= pullThreshold;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator bar */}
      <AnimatePresence>
        {(pullDistance > 5 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: isRefreshing ? 64 : Math.min(pullDistance, 80) 
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full flex items-center justify-center bg-gradient-to-b from-emerald-950/20 via-emerald-900/10 to-transparent backdrop-blur-md z-40"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-900/90 border border-emerald-500/30 text-emerald-100 shadow-xl shadow-emerald-950/50">
              {showSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span className="text-xs font-medium text-emerald-200">
                    {language === 'ar' ? 'تمت المزامنة بنجاح' : 'Sync Completed Successfully'}
                  </span>
                </>
              ) : isRefreshing ? (
                <>
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                      {language === 'ar' ? 'جاري المزامنة المباشرة...' : 'Syncing Real-Time Data...'}
                    </span>
                    <span className="text-[10px] text-emerald-300/80">
                      {language === 'ar' ? 'تحديث الأسعار والمخزون' : 'Updating catalog & inventory'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <motion.div 
                    animate={{ rotate: progressRatio * 180 }} 
                    transition={{ duration: 0.1 }}
                  >
                    <RefreshCw className={`w-5 h-5 ${isReadyToRelease ? 'text-amber-400 scale-110' : 'text-emerald-400'}`} />
                  </motion.div>
                  <span className="text-xs font-semibold">
                    {isReadyToRelease 
                      ? (language === 'ar' ? 'إفلات لتحديث البيانات الآن' : 'Release to Sync Now') 
                      : (language === 'ar' ? 'اسحب للتحديث المباشر' : 'Pull down to refresh')}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content wrapper */}
      <motion.div
        animate={{ 
          y: isRefreshing ? 0 : pullDistance * 0.3 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
