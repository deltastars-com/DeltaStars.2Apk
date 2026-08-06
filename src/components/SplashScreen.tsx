import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeltaStarsLogo } from './DeltaStarsLogo';

interface SplashScreenProps {
  onComplete: () => void;
  logoPath?: string;
}

const SLIDES = [
  {
    image: '/splash_official_banner.jpg?v=2026',
    title_ar: 'متجر نجوم دلتا',
    title_en: 'Delta Stars Store',
    desc_ar: 'شريكك المثالي للخضروات والفواكه والتمور عالية الجودة في المملكة العربية السعودية',
    welcome_ar: 'يرحب بكم',
    desc_en: 'Your ideal partner for high-quality vegetables, fruits and dates in Saudi Arabia',
  },
  {
    image: '/official_splash.jpg?v=2026',
    title_ar: 'متجر نجوم دلتا',
    title_en: 'Delta Stars Store',
    desc_ar: 'أجود المنتجات المنتقاة بعناية والتوصيل المبرد لكافة أنحاء المملكة العربية السعودية',
    welcome_ar: 'يرحب بكم',
    desc_en: 'Finest produce delivered fresh and chilled across Saudi Arabia',
  }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, logoPath }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const stepsAr = [
    'جاري تشغيل المتجر والربط الآمن...',
    'تحميل المنتجات والعروض الترويجية الطازجة...',
    'تحديد التغطية والفرع الأقرب في المملكة...',
    'جاهز! أهلاً بكم في متجر نجوم دلتا'
  ];

  const stepsEn = [
    'Initializing Secure System Connection...',
    'Loading Fresh Catalog & Promo Showcase...',
    'Connecting Nearest Branch & GPS Logistics...',
    'Ready! Welcome to Delta Stars Store'
  ];

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onCompleteRef.current();
    }, 150);
  };

  useEffect(() => {
    // Rotation every 2.5s if visible
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 2500);

    // Step progress
    const step1 = setTimeout(() => setLoadingStep(1), 400);
    const step2 = setTimeout(() => setLoadingStep(2), 900);
    const step3 = setTimeout(() => setLoadingStep(3), 1400);

    // Boot timing (1.8s total) for ultra-fast, responsive load
    const t1 = setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    const t2 = setTimeout(() => {
      onCompleteRef.current();
    }, 2000);

    return () => {
      clearInterval(slideInterval);
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isAr = typeof localStorage !== 'undefined' ? localStorage.getItem('ds_lang') !== 'en' : true;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen-luxury"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #021a0a 0%, #000802 100%)',
          }}
          onClick={handleDismiss}
        >
          {/* Top Bar Skip Button */}
          <div className="w-full flex justify-between items-center z-20 max-w-md pt-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-emerald-300 font-bold font-tajawal">متصل مباشر</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="px-3 py-1 rounded-full bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/60 text-yellow-300 text-xs font-black font-tajawal transition-all"
            >
              {isAr ? 'تخطي ✕' : 'Skip ✕'}
            </button>
          </div>

          {/* Ambient Golden Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                style={{
                  left: `${(i * 7) % 100}%`,
                  top: `${(i * 13) % 100}%`,
                  opacity: 0.3,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.6, 0.2],
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: (i % 2) * 0.5,
                }}
              />
            ))}
          </div>

          {/* Top Brand Header Block */}
          <div className="w-full flex flex-col items-center z-10 pt-1">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-2 bg-white rounded-2xl shadow-2xl ring-3 ring-yellow-400 shadow-yellow-500/30 p-0.5 overflow-hidden shrink-0">
              <DeltaStarsLogo 
                logoUrl={logoPath || '/official_logo.png?v=2026'}
                fitMode="cover"
                className="w-full h-full rounded-xl z-10" 
              />
            </div>
            <span className="text-[10px] sm:text-xs text-yellow-400 font-black tracking-widest uppercase font-tajawal text-center px-2">
              شركة نجوم دلتا للتجارة • DELTA STARS CO.
            </span>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent w-48 mt-1" />
          </div>

          {/* Centered Showcase Card */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm z-10 my-1 min-h-0">
            <div className="relative w-[280px] sm:w-[320px] h-[300px] sm:h-[350px] max-h-[48vh] rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-amber-400/40 overflow-hidden bg-emerald-950 flex flex-col justify-between shrink-0">
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-black flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={SLIDES[currentSlide].image}
                    alt={SLIDES[currentSlide].title_en}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/splash_official_banner.jpg';
                    }}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </AnimatePresence>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 z-10" />

              {/* Heart of Splash: Floating Central Official Emblem */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none pb-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.95, 1.05, 0.95], opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-0.5 shadow-[0_0_40px_rgba(251,191,36,0.8)] ring-4 ring-yellow-400 flex items-center justify-center backdrop-blur-md overflow-hidden"
                >
                  <DeltaStarsLogo
                    logoUrl={logoPath || '/official_logo.png?v=2026'}
                    onlyEmblem={true}
                    fitMode="cover"
                    className="w-full h-full rounded-xl object-cover"
                  />
                </motion.div>
              </div>

              {/* Dots */}
              <div className="absolute top-3 inset-x-0 flex justify-center gap-1.5 z-20">
                {SLIDES.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? 'w-5 bg-yellow-400' : 'w-1.5 bg-white/45'
                    }`}
                  />
                ))}
              </div>

              {/* Title Card with 3D Embossed Golden Typography */}
              <div className="absolute bottom-0 inset-x-0 p-3 z-20 text-center flex flex-col items-center">
                <div className="backdrop-blur-xl bg-gradient-to-b from-black/80 via-emerald-950/95 to-black/95 border-2 border-amber-400/60 rounded-2xl p-3 w-full shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(251,191,36,0.3)]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      {/* 3D Golden Title */}
                      <h3 
                        className="text-lg sm:text-2xl font-black font-tajawal tracking-tight uppercase"
                        style={{
                          background: 'linear-gradient(180deg, #FFFFFF 0%, #FDE68A 30%, #F59E0B 70%, #B45309 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0px 2px 0px #78350F) drop-shadow(0px 4px 10px rgba(0,0,0,0.9))',
                          textShadow: '0 1px 0 #d97706, 0 2px 0 #b45309, 0 3px 5px rgba(0,0,0,0.8)'
                        }}
                      >
                        {SLIDES[currentSlide].title_ar}
                      </h3>

                      {/* Descriptive Arabic Statement */}
                      <p className="text-[11px] sm:text-xs text-amber-100 font-bold font-tajawal leading-relaxed px-1 text-center drop-shadow-md">
                        {SLIDES[currentSlide].desc_ar}
                      </p>

                      {/* 3D Welcome Ribbon Badge */}
                      <div className="mt-1 inline-flex items-center justify-center px-4 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm font-tajawal shadow-[0_4px_15px_rgba(251,191,36,0.5)] border border-yellow-200 border-b-2 border-b-amber-700 active:scale-95 transition-all">
                        ✨ {SLIDES[currentSlide].welcome_ar} ✨
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Progress Loader */}
          <div className="w-full max-w-xs flex flex-col items-center gap-2 z-10 pb-2">
            <span className="text-[10px] text-yellow-400 font-black tracking-wider uppercase font-tajawal animate-pulse text-center px-2 min-h-[16px]">
              {isAr ? stepsAr[loadingStep] : stepsEn[loadingStep]}
            </span>

            <div className="w-full h-1.5 bg-black/50 rounded-full p-[1px] border border-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 via-emerald-500 to-yellow-300 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'linear' }}
              />
            </div>

            <div className="flex justify-between w-full text-[8px] text-white/50 font-bold font-mono">
              <span>PCI-DSS SECURED</span>
              <span>v2.1.0 OFFICIAL</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
