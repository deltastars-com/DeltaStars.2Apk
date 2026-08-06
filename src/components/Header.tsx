import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import {
  SearchIcon, UserIcon, HeartIcon, ShoppingCartIcon,
  BellIcon, MenuIcon, XIcon, PhoneIcon,
  CalendarIcon, ClockIcon, ShieldCheckIcon, GlobeIcon,
  WhatsappIcon, InstagramIcon, TelegramIcon, TiktokIcon, SnapchatIcon, FacebookIcon, ZapIcon, AdiSparklesIcon,
  TruckIcon, MicIcon
} from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';
import { useFirebase } from './lib/contexts/FirebaseContext';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPANY_INFO, SOCIAL_LINKS } from '../constants';
import { DeltaStarsLogo } from './DeltaStarsLogo';

import { getHijriDate, getGregorianDate, getDayName } from '../utils/dateUtils';

// مكون شريط الإعلانات المتحرك
const AnnouncementTicker: React.FC = () => {
  const { ads } = useFirebase();
  const { language } = useI18n();

  // Filter active ads
  const activeAds = ads ? ads.filter(ad => ad.status === 'active') : [];

  // Prepare texts to render
  let texts: string[] = [];
  if (activeAds.length > 0) {
    texts = activeAds.map(ad => language === 'ar' ? ad.title_ar : ad.title_en);
  } else {
    // Fallback professional ads in case none are active in DB
    texts = language === 'ar' ? [
      "شريكك المثالي للخضروات والفواكه والتمور عالية الجودة. ✨ خصم خاص على سلات العروض الترويجية!",
      "🚚 توصيل مبرد وسريع لجميع المدن المتواجدة فيها فروعنا في المملكة",
      "🍎 منتجات طازجة تصلكم من المزارع مباشرة",
      "⭐ جودة عالمية موثقة بشهادات الأيزو"
    ] : [
      "Your ideal partner for high-quality fresh produce. ✨ Special discount on promotional baskets!",
      "🚚 Fast refrigerated delivery to all cities within our branch network in KSA",
      "🍎 Fresh farm-to-table products delivered directly to you",
      "⭐ Global high-quality standards certified by ISO"
    ];
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 overflow-hidden relative z-[110]">
      <div className="animate-marquee whitespace-nowrap inline-flex">
        {texts.map((text, index) => (
          <span key={index} className="mx-12 inline-block font-bold">
            {text}
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {texts.map((text, index) => (
          <span key={index + '-copy'} className="mx-12 inline-block font-bold">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

interface HeaderProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
  onToggleAiAssistant: () => void;
  logoPath?: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onToggleAiAssistant, logoPath }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { language, setLanguage, t } = useI18n();
  const { addToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [logoFailed, setLogoFailed] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast(language === 'ar' ? 'متصفحك لا يدعم البحث الصوتي المباشر' : 'Voice search is not supported in this browser', 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      addToast(language === 'ar' ? '🎙️ جاري الاستماع... تحدث الآن للبحث' : '🎙️ Listening... speak now to search', 'info');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          handleSearchSubmit(transcript);
          addToast(language === 'ar' ? `تم الالتقاط الصوتي: "${transcript}"` : `Voice captured: "${transcript}"`, 'success');
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        addToast(language === 'ar' ? 'عذراً، لم نتمكن من التقاط الصوت بوضوح' : 'Could not recognize voice', 'error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      addToast(language === 'ar' ? 'عذراً، يتعذر تشغيل الميكروفون حالياً' : 'Microphone unavailable', 'error');
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ds_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    const trimmed = term.trim();
    
    // Save to localStorage
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 3);
      try {
        localStorage.setItem('ds_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Navigate to showroom with the search term
    onNavigate('showroom', { initialSearchTerm: trimmed });
    setIsSearchOpen(false);
  };

  const handleChipClick = (term: string) => {
    setSearchQuery(term);
    handleSearchSubmit(term);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const hijriStr = getHijriDate();
  const gregorianStr = getGregorianDate();
  const dayNameStr = getDayName();

  const isAdmin = isAuthenticated && (
    ['admin', 'developer', 'marketing', 'branch_agent', 'ops'].includes(user?.role || '') ||
    ['admin', 'developer'].includes(user?.type || '')
  );

  const navItems = [
    { id: 'home', label: t('header.navLinks.home'), icon: <GlobeIcon className="w-5 h-5" /> },
    { id: 'showroom', label: t('header.navLinks.showroom'), icon: <ShoppingCartIcon className="w-5 h-5" /> },
    { id: 'products', label: t('header.navLinks.products'), icon: <HeartIcon className="w-5 h-5" /> },
    { 
      id: 'drivers_portal', 
      label: language === 'ar' ? 'بوابة المناديب والسواقين' : 'Drivers Portal', 
      icon: <TruckIcon className="w-5 h-5" /> 
    },
    { id: 'contact', label: t('header.navLinks.contact'), icon: <PhoneIcon className="w-5 h-5" /> },
    { 
      id: 'cart', 
      label: language === 'ar' ? 'سلة المشتريات' : 'Shopping Cart', 
      icon: <ShoppingCartIcon className="w-5 h-5" />,
      hasBadge: true
    }
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin_dashboard',
      label: language === 'ar' ? 'الإدارة السيادية' : 'Sovereign Admin',
      icon: <ShieldCheckIcon className="w-5 h-5 text-secondary" />
    });
  }

  if (isAuthenticated && (user?.role === 'developer' || user?.type === 'developer')) {
    navItems.push({
      id: 'dev_console',
      label: language === 'ar' ? 'كونسول المطور' : 'Dev Console',
      icon: <ZapIcon className="w-5 h-5 text-yellow-400" />
    });
  }

  return (
    <header className={`fixed top-0 w-full z-[100] transition-all duration-700 ${isScrolled ? 'shadow-sovereign translate-y-[-2px]' : ''}`}>
      <AnnouncementTicker />
      {/* Top Bar - Sovereign Visual Polish */}
      <div className="bg-primary text-white py-2 px-4 md:px-8 text-[10px] md:text-sm flex justify-between items-center border-b border-secondary/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5 pointer-events-none" />

        <div className="flex items-center gap-2 md:gap-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-full border border-white/10 shadow-inner backdrop-blur-md group transition-all hover:bg-white/10"
          >
            <CalendarIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="flex items-center gap-3 text-[10px] md:text-sm font-black leading-tight">
              <div className="flex items-center gap-2 text-white/90">
                <span className="tracking-tight font-black">{hijriStr}</span>
                <span className="text-secondary/50 font-light mx-1">|</span>
                <span className="tracking-tight font-black">{gregorianStr} م</span>
              </div>
            </div>
          </motion.div>

          <div className="hidden sm:flex items-center gap-4 ml-6 border-l border-white/10 pl-6 h-8">
            <a href={SOCIAL_LINKS.WHATSAPP_COMMUNITY} target="_blank" rel="noreferrer" className="text-white/40 hover:text-emerald-400 transition-all hover:scale-110" title="WhatsApp"><WhatsappIcon className="w-5 h-5 shadow-glow-sm" /></a>
            <a href={SOCIAL_LINKS.FACEBOOK} target="_blank" rel="noreferrer" className="text-white/40 hover:text-blue-500 transition-all hover:scale-110" title="Facebook"><FacebookIcon className="w-5 h-5 shadow-glow-sm" /></a>
            <a href={SOCIAL_LINKS.INSTAGRAM} target="_blank" rel="noreferrer" className="text-white/40 hover:text-pink-400 transition-all hover:scale-110" title="Instagram"><InstagramIcon className="w-5 h-5 shadow-glow-sm" /></a>
            <a href={SOCIAL_LINKS.TELEGRAM} target="_blank" rel="noreferrer" className="text-white/40 hover:text-blue-400 transition-all hover:scale-110" title="Telegram"><TelegramIcon className="w-5 h-5 shadow-glow-sm" /></a>
            <a href={SOCIAL_LINKS.TIKTOK} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-all hover:scale-110" title="TikTok"><TiktokIcon className="w-5 h-5 shadow-glow-sm" /></a>
          </div>

          <button
            onClick={() => onNavigate(isAdmin ? 'admin_dashboard' : 'admin_login')}
            className="hidden lg:flex items-center gap-2 text-secondary/80 hover:text-white transition-all group px-3 py-1 rounded-full hover:bg-white/5"
          >
            <ShieldCheckIcon className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isAdmin ? 'text-emerald-400' : ''}`} />
            <span className="font-black uppercase tracking-widest text-[9px]">{isAdmin ? (language === 'ar' ? 'الكونسول الإداري' : 'ADMIN CONSOLE') : t('header.adminGate')}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-secondary text-primary hover:bg-white hover:text-primary transition-all shadow-gold font-black group border-b-2 border-primary/20 active:border-b-0 scale-105"
          >
            <GlobeIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[11px] tracking-[0.2em] uppercase">{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          <button
            onClick={onToggleAiAssistant}
            className="hidden xl:flex items-center gap-3 text-white/70 hover:text-secondary transition-all cursor-pointer group"
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping group-hover:bg-secondary"></div>
            <span className="font-black tracking-widest text-[10px] uppercase">{t('header.aiSupportActive')}</span>
            <AdiSparklesIcon className="w-4 h-4 text-secondary scale-0 group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center gap-3 font-mono bg-black/40 px-4 py-1.5 rounded-full border border-white/10 shadow-glow-sm">
            <ClockIcon className="w-3.5 h-3.5 text-secondary" />
            <span className="tabular-nums font-black text-secondary tracking-widest">{dateTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Main Header - High Luxury Aesthetic */}
      <div className={`bg-primary/95 backdrop-blur-3xl border-b-[4px] border-secondary px-6 md:px-16 flex items-center justify-between transition-all duration-700 relative shadow-2xl ${isScrolled ? 'h-24 md:h-28 bg-primary/98' : 'h-32 md:h-44'}`}>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />

        {/* Left Section: Menu & Logo */}
        <div className="flex items-center gap-4 md:gap-12">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-3 text-white hover:bg-white/10 rounded-2xl transition-all"
            aria-label="Toggle Menu"
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <XIcon className="w-10 h-10" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <MenuIcon className="w-10 h-10" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center cursor-pointer group relative transition-all duration-500 ${isScrolled ? 'gap-2 md:gap-3.5' : 'gap-3 md:gap-4.5'}`}
            onClick={() => onNavigate('home')}
          >
            <div className={`transition-all duration-500 flex items-center justify-center overflow-hidden bg-white rounded-2xl shadow-2xl ring-2 ring-amber-400/90 group-hover:ring-amber-300 p-0.5 shrink-0 ${isScrolled ? 'w-11 h-11 md:w-13 md:h-13' : 'w-14 h-14 md:w-16 md:h-16'}`}>
              <DeltaStarsLogo
                logoUrl={logoPath || '/official_logo.png?v=2026'}
                fitMode="cover"
                className="w-full h-full rounded-xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center gap-0 relative z-10 border-r-2 border-white/5 pr-3 md:pr-4">
              <div className="flex items-center gap-1.5 md:gap-3">
                <h1 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-none tracking-tighter group-hover:text-secondary transition-all duration-500 whitespace-nowrap">
                  <span className="font-display">DELTA</span>
                  <span className="text-secondary font-display ml-1.5 md:ml-2.5">STARS</span>
                </h1>
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-white/60 tracking-[0.25em] md:tracking-[0.45em] uppercase group-hover:text-secondary transition-colors mt-1 antialiased">
                Sovereign Global Trading
              </p>
            </div>
          </motion.div>
        </div>

        {/* Center Section: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-6 bg-black/40 p-2 rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-6 py-3 rounded-2xl text-md font-black transition-all relative group overflow-hidden ${currentPage === item.id
                ? 'text-primary bg-secondary shadow-gold scale-105'
                : 'text-white/70 hover:text-secondary hover:bg-white/5'
                }`}
            >
              <span className="relative z-10 transition-transform group-hover:-translate-y-1 flex items-center gap-2 uppercase tracking-widest">
                <span>{item.label}</span>
                {item.hasBadge && itemCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black transition-all ${
                    currentPage === item.id ? 'bg-primary text-secondary' : 'bg-secondary text-primary'
                  }`}>
                    {itemCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Collapsible Search */}
          <div className="relative flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <>
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="absolute left-10 hidden md:flex items-center bg-white/10 border-2 border-secondary/30 rounded-full px-3 py-1 backdrop-blur-md shadow-lg"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit(searchQuery);
                        }
                      }}
                      placeholder={t('common.search')}
                      className="w-full h-8 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/50"
                    />
                    <button
                      type="button"
                      onClick={startVoiceSearch}
                      title={language === 'ar' ? 'البحث بالصوت المباشر 🎙️' : 'Voice Search 🎙️'}
                      aria-label={language === 'ar' ? 'البحث بالصوت المباشر' : 'Voice Search'}
                      className={`p-1.5 rounded-full transition-all shrink-0 ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)] scale-110'
                          : 'text-secondary hover:bg-white/20 hover:scale-110'
                      }`}
                    >
                      <MicIcon className="w-4 h-4" />
                    </button>
                  </motion.div>

                  {recentSearches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-12 left-10 w-60 bg-primary/95 border border-secondary/20 backdrop-blur-2xl rounded-2xl p-3 shadow-sovereign text-white z-50 hidden md:block"
                    >
                      <div className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-wider flex justify-between items-center">
                        <span>{language === 'ar' ? 'البحوث الأخيرة' : 'Recent Searches'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches([]);
                            try {
                              localStorage.removeItem('ds_recent_searches');
                            } catch (err) {}
                          }}
                          className="text-[9px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          {language === 'ar' ? 'مسح' : 'Clear'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => handleChipClick(term)}
                            className="text-[10px] bg-white/5 hover:bg-secondary hover:text-primary transition-all duration-300 px-2.5 py-1 rounded-full font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-full border border-white/5 hover:border-secondary"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? 'إغلاق البحث' : 'فتح البحث'}
              title={isSearchOpen ? 'إغلاق البحث' : 'فتح البحث'}
              className={`p-2 rounded-full transition-all ${isSearchOpen ? 'bg-secondary text-white' : 'text-white hover:bg-white/10'}`}
            >
              <SearchIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <button onClick={() => onNavigate('wishlist')} aria-label="المفضلة" title="المفضلة" className="p-2 text-white hover:text-secondary hover:bg-white/10 rounded-full transition-all relative group">
            <HeartIcon className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </button>

          <button onClick={() => onNavigate('cart')} aria-label="سلة المشتريات" title="سلة المشتريات" className="p-3 bg-secondary text-white rounded-full transition-all relative group shadow-sovereign border-b-4 border-secondary-dark active:border-b-0 active:translate-y-1">
            <ShoppingCartIcon className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  key={itemCount}
                  className="absolute -top-2 -right-2 bg-white text-primary text-[10px] md:text-[12px] font-black w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-primary shadow-2xl"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

          {isAuthenticated ? (
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => onNavigate(user?.role === 'driver' ? 'driver_dashboard' : 'vip_dashboard')}
                className="flex items-center gap-2 bg-white/5 p-1.5 md:p-2 md:px-4 rounded-full border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center shadow-sm border border-white/10 group-hover:border-secondary transition-colors">
                  <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="hidden md:block text-xs font-black text-white">{user?.full_name?.split(' ')[0] || t('header.myAccount')}</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                title={t('common.logout')}
                aria-label={t('common.logout')}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('login')}
              className="bg-secondary text-primary px-4 md:px-7 py-2 md:py-3 rounded-full font-black text-xs md:text-sm hover:brightness-110 transition-all shadow-lg border-b-4 border-secondary-dark relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="hidden sm:inline">دخول</span>
                <ShieldCheckIcon className="w-4 h-4" />
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Enhanced with staggered animations */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-white/95 backdrop-blur-2xl border-t-4 border-secondary p-6 space-y-2 shadow-2xl relative overflow-hidden z-50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

            {/* Mobile Search Input and Recent Searches chips */}
            <div className="mb-4 relative z-10">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(searchQuery);
                      setIsMenuOpen(false);
                    }
                  }}
                  placeholder={t('common.search')}
                  className="w-full h-11 bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 pl-10 text-xs font-bold text-primary outline-none focus:border-secondary transition-all"
                />
                <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
              
              {recentSearches.length > 0 && (
                <div className="mt-2">
                  <div className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-wider flex justify-between items-center px-1">
                    <span>{language === 'ar' ? 'البحوث الأخيرة' : 'Recent Searches'}</span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        try {
                          localStorage.removeItem('ds_recent_searches');
                        } catch (err) {}
                      }}
                      className="text-[9px] text-red-500 font-black hover:text-red-600"
                    >
                      {language === 'ar' ? 'مسح' : 'Clear'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(term);
                          handleSearchSubmit(term);
                          setIsMenuOpen(false);
                        }}
                        className="text-[10px] bg-gray-100 hover:bg-secondary hover:text-primary text-gray-700 transition-all px-2.5 py-1 rounded-full font-bold border border-gray-200"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {[
              ...navItems,
              { id: 'vip_login', label: t('home.hero.vipButton'), icon: <UserIcon className="w-5 h-5" /> },
              { id: 'admin_login', label: t('header.adminGate'), icon: <ShieldCheckIcon className="w-5 h-5" /> }
            ].map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                className={`flex items-center justify-between w-full text-right font-black text-lg py-4 px-4 rounded-2xl transition-all ${currentPage === item.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-primary hover:bg-primary/5 border-b border-gray-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {'hasBadge' in item && item.hasBadge && itemCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                        currentPage === item.id ? 'bg-white text-primary' : 'bg-secondary text-primary'
                      }`}>
                        {itemCount}
                      </span>
                    )}
                  </span>
                </div>
                <div className={`w-2 h-2 rounded-full bg-secondary transition-opacity ${currentPage === item.id ? 'opacity-100' : 'opacity-0'}`}></div>
              </motion.button>
            ))}

            {/* Mobile Language Toggle */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center justify-center gap-3 w-full py-4 mt-4 bg-gray-50 rounded-2xl border border-gray-100 text-primary font-black"
            >
              <GlobeIcon className="w-5 h-5 text-secondary" />
              <span>{language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
