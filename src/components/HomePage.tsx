import React, { useMemo } from 'react';
import { COMPANY_INFO, SOCIAL_LINKS, CATEGORY_ICONS } from '../constants';
import { Ad, HomeSection } from '../types';
import { 
  WhatsappIcon, TelegramIcon, InstagramIcon, TiktokIcon, YoutubeIcon, SnapchatIcon, FacebookIcon
} from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PullToRefresh } from './PullToRefresh';

interface HomeProps {
  setCurrentPage: (page: string, params?: any) => void;
  SYSTEM_CONFIG: any;
  ads: Ad[];
  homeSections?: HomeSection[];
  onRefresh?: () => Promise<void> | void;
}

export default function Home({ setCurrentPage, SYSTEM_CONFIG, ads, homeSections = [], onRefresh }: HomeProps) {
  const { language, t } = useI18n();
  
  const activeAds = useMemo(() => (ads || []).filter(ad => ad.status === 'active'), [ads]);

  const categories = useMemo(() => [
    { key: 'vegetables', label: t('categories.vegetables'), icon: CATEGORY_ICONS.vegetables },
    { key: 'fruits', label: t('categories.fruits'), icon: CATEGORY_ICONS.fruits },
    { key: 'herbs', label: t('categories.herbs'), icon: CATEGORY_ICONS.herbs },
    { key: 'dates', label: t('categories.dates'), icon: CATEGORY_ICONS.dates },
    { key: 'qassim', label: t('categories.qassim'), icon: CATEGORY_ICONS.qassim },
    { key: 'packages', label: t('categories.packages'), icon: CATEGORY_ICONS.packages },
    { key: 'seasonal', label: t('categories.seasonal'), icon: CATEGORY_ICONS.seasonal },
    { key: 'imported', label: t('categories.imported'), icon: CATEGORY_ICONS.imported },
    { key: 'flowers', label: t('categories.flowers'), icon: CATEGORY_ICONS.flowers },
    { key: 'nuts', label: t('categories.nuts'), icon: CATEGORY_ICONS.nuts },
  ], [t]);

  const heroImages = useMemo(() => [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1557844352-761f2565b576?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596567130084-2450e194887d?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=70&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=70&w=1200&auto=format&fit=crop"
  ], []);

  const [currentHeroIdx, setCurrentHeroIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIdx(prev => (prev + 1) % heroImages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const renderHero = (section?: HomeSection) => (
    <section key={section?.id || 'static-hero'} className="relative z-30 min-h-screen md:min-h-[100vh] flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentHeroIdx}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            src={heroImages[currentHeroIdx]} 
            alt="Delta Stars Premium Produce" 
            className="w-full h-full object-cover brightness-[1.1]"
            referrerPolicy="no-referrer"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-transparent to-primary"></div>
        <div className="absolute inset-x-0 bottom-0 h-64 md:h-[40vh] bg-gradient-to-t from-primary via-primary/60 to-transparent"></div>
        <div className="absolute inset-0 bg-black/15"></div>
      </div>

      <div className="relative z-40 px-6 max-w-7xl mx-auto pt-32 md:pt-40 pb-32 md:pb-56">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="space-y-12 md:space-y-16"
        >
          <div className="inline-flex items-center gap-2 md:gap-4 bg-white/10 backdrop-blur-3xl px-8 md:px-12 py-3 md:py-5 rounded-full border-2 border-white/30 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <motion.span 
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-3 h-3 md:w-4 md:h-4 bg-secondary rounded-full shadow-[0_0_15px_rgba(202,138,4,0.8)] relative z-10"
            ></motion.span>
            <span className="text-white font-black text-xs md:text-xl tracking-[0.2em] md:tracking-[0.3em] uppercase relative z-10">{t('home.hero.quality_label')}</span>
          </div>

          <div className="relative">
            <h1 className="text-[clamp(3rem,10vw,11rem)] font-black text-white leading-none tracking-tighter filter brightness-110 antialiased font-display select-none">
              {language === 'ar' ? (
                <div className="flex flex-row items-center justify-center gap-4 md:gap-12">
                  <span className="text-3d-sovereign drop-shadow-sovereign">نجوم</span> 
                  <span className="text-secondary text-3d-gold">دلتا</span>
                </div>
              ) : (
                <div className="flex flex-row items-center justify-center gap-4 md:gap-12">
                  <span className="text-3d-sovereign drop-shadow-sovereign">DELTA</span> 
                  <span className="text-secondary text-3d-gold">STARS</span>
                </div>
              )}
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-8 md:mt-12 text-xl md:text-5xl text-white font-bold max-w-5xl mx-auto leading-relaxed text-shadow-sovereign filter drop-shadow-lg px-4"
            >
              {language === 'ar' 
                ? 'شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة' 
                : 'Your Ideal Partner for Premium Vegetables, Fruits & Dates'}
            </motion.p>
            <div className="absolute -bottom-4 md:-bottom-20 left-1/2 -translate-x-1/2 w-48 md:w-96 h-2 md:h-4 bg-gradient-to-r from-transparent via-secondary to-transparent blur-xl opacity-80"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-10 pt-10">
            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('showroom')} 
              className="group relative overflow-hidden bg-secondary text-primary px-12 md:px-24 py-5 md:py-10 rounded-2xl md:rounded-full font-black text-2xl md:text-5xl shadow-gold border-b-8 md:border-b-[12px] border-secondary-dark active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center min-w-[280px] md:min-w-[400px]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10">{t('home.hero.button')}</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('vip_login')} 
              className="bg-white/10 backdrop-blur-3xl text-white border-2 md:border-4 border-white/40 px-10 md:px-20 py-5 md:py-9 rounded-2xl md:rounded-full font-black text-xl md:text-4xl hover:bg-white hover:text-primary transition-all shadow-2xl flex items-center justify-center min-w-[280px] md:min-w-[400px]"
            >
              {t('home.hero.vipButton')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const renderSovereignDelivery = () => (
    <section className="relative z-10 py-32 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]"></div>
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1920" 
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/official_splash.jpg?v=2026'; }}
          className="w-full h-full object-cover grayscale brightness-50"
          alt="Logistics Background"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-right">
            <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full">
              <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.3em]">{language === 'ar' ? 'تغطية سيادية شاملة' : 'Sovereign Coverage'}</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tighter">
              {language === 'ar' 
                ? 'خريطة التوصيل الذكية واللحظية' 
                : 'Smart Real-time Delivery Radar'}
            </h2>
            <p className="text-xl text-gray-400 font-bold leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {language === 'ar'
                ? 'نحن نراقب شحنتك المبردة من لحظة انطلاقها من فروعنا في (جدة، مكة، المدينة، الرياض، الدمام، أبها) حتى وصولها لباب منزلك بكل دقة.'
                : 'We monitor your refrigerated shipment from the moment it leaves our branches until it reaches your door with absolute precision.'}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <button 
                onClick={() => setCurrentPage('track_order')}
                className="bg-secondary text-white px-10 py-5 rounded-2xl font-black text-xl shadow-sovereign hover:scale-105 transition-all flex items-center gap-3"
              >
                <span>🚀</span>
                {language === 'ar' ? 'تتبع طلبك الآن' : 'Track Your Order'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative group">
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-[3rem] blur-2xl group-hover:bg-emerald-500/30 transition-all duration-700"></div>
              <div className="relative bg-slate-900 border-4 border-white/5 rounded-[4rem] overflow-hidden shadow-4xl aspect-video md:aspect-[4/3] flex items-center justify-center p-4">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.35),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(2,132,199,0.3),transparent_55%)] bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>
                <div className="relative z-10 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500 shadow-glow animate-pulse">
                    <span className="text-4xl">🛰️</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-black text-xl">{language === 'ar' ? 'جاري الرصد المباشر' : 'Live Tracking Active'}</p>
                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">6 Nodes Online | KSA Coverage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderCategories = (section?: HomeSection) => (
    <section key={section?.id || 'static-categories'} className="py-32 md:py-64 relative z-20 bg-white border-t-8 border-secondary shadow-2xl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20 md:mb-32">
          <h2 className="text-5xl md:text-[8rem] font-black text-primary mb-8 tracking-tighter uppercase leading-none drop-shadow-sm">
            {section ? (language === 'ar' ? section.title_ar : section.title_en) : t('home.categories.title')}
          </h2>
          <div className="w-48 h-3 bg-secondary mx-auto rounded-full shadow-gold animate-pulse"></div>
          <p className="text-gray-600 font-bold text-xl md:text-3xl mt-12 max-w-4xl mx-auto leading-relaxed italic">
            {t('home.categories.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-5 gap-6 md:gap-16">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.1, y: -15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('showroom', { initialCategory: cat.key })}
              className="group flex flex-col items-center gap-6 p-4 rounded-[4rem] hover:bg-slate-50 transition-all duration-500"
            >
              <div className="w-24 h-24 md:w-48 md:h-48 bg-white rounded-[3rem] md:rounded-[4rem] shadow-sovereign border border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-secondary/50 group-hover:shadow-glow transition-all p-6 relative">
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                  src={cat.icon} 
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain group-hover:scale-125 transition-transform duration-700 relative z-10"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  width={200}
                  height={200}
                />
              </div>
              <span className="font-black text-primary text-xs md:text-2xl text-center group-hover:text-secondary transition-colors leading-tight uppercase tracking-widest">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );

  const renderAds = (section?: HomeSection) => (
    activeAds.length > 0 && (
      <section key={section?.id || 'static-ads'} className="py-12 bg-slate-50 overflow-hidden relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x">
            {activeAds.map(ad => (
              <a 
                key={ad.id} 
                href={ad.link || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="flex-shrink-0 w-full md:w-[600px] h-80 rounded-[3rem] overflow-hidden shadow-2xl snap-center relative group"
              >
                <img 
                  src={ad.image} 
                  alt={language === 'ar' ? ad.title_ar : ad.title_en} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-10">
                  <h3 className="text-2xl font-black text-white mb-2">{language === 'ar' ? ad.title_ar : ad.title_en}</h3>
                  <span className="text-secondary font-black text-sm uppercase tracking-widest">{t('home.channels.adLabel')}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  );

  const renderStats = (section?: HomeSection) => (
    <section key={section?.id || 'static-stats'} className="py-24 relative overflow-hidden z-10">
      <div className="container mx-auto px-6">
        {section && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-primary">{language === 'ar' ? section.title_ar : section.title_en}</h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-10 bg-white shadow-sovereign rounded-[3rem] border-t-8 border-secondary text-center space-y-4 border-x border-b border-gray-100">
            <div className="text-5xl mb-4 text-shadow-sovereign">🌍</div>
            <h3 className="text-2xl font-black text-primary">{t('home.stats.coverage.title')}</h3>
            <p className="text-gray-700 font-bold">{t('home.stats.coverage.desc')}</p>
          </div>
          <div className="p-10 bg-white shadow-sovereign rounded-[3rem] border-t-8 border-secondary text-center space-y-4 border-x border-b border-gray-100">
            <div className="text-5xl mb-4 text-shadow-sovereign">💎</div>
            <h3 className="text-2xl font-black text-primary">{t('home.stats.quality.title')}</h3>
            <p className="text-gray-700 font-bold">{t('home.stats.quality.desc')}</p>
          </div>
          <div className="p-10 bg-white shadow-sovereign rounded-[3rem] border-t-8 border-secondary text-center space-y-4 border-x border-b border-gray-100">
            <div className="text-5xl mb-4 text-shadow-sovereign">⚡</div>
            <h3 className="text-2xl font-black text-primary">{t('home.stats.delivery.title')}</h3>
            <p className="text-gray-700 font-bold">{t('home.stats.delivery.desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );

  const renderAbout = (section?: HomeSection) => (
    <section key={section?.id || 'static-about'} className="py-24 relative z-10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-primary leading-tight">
            {section ? (language === 'ar' ? section.title_ar : section.title_en) : t('home.about.title')}
          </h2>
          <p className="text-xl text-primary font-bold leading-relaxed">
            {t('home.about.desc')}
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-secondary rounded-full shadow-sovereign"></div>
              <span className="font-black text-primary">{t('home.about.features.organic')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-secondary rounded-full shadow-sovereign"></div>
              <span className="font-black text-primary">{t('home.about.features.dates')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-secondary rounded-full shadow-sovereign"></div>
              <span className="font-black text-primary">{t('home.about.features.import')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-secondary rounded-full shadow-sovereign"></div>
              <span className="font-black text-primary">{t('home.about.features.support')}</span>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/splash_official_banner.jpg?v=2026'; }}
              className="rounded-[4rem] shadow-sovereign border-8 border-slate-800/50" 
              alt="Market"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute -bottom-10 -right-10 bg-secondary text-white p-10 rounded-[3rem] shadow-sovereign hidden md:block border-b-8 border-yellow-800">
              <p className="text-5xl font-black">15+</p>
              <p className="font-bold">{t('home.about.experience')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderChannels = (section?: HomeSection) => (
    <section key={section?.id || 'static-channels'} className="py-24 bg-primary/95 text-white relative overflow-hidden z-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
            {section ? (language === 'ar' ? section.title_ar : section.title_en) : t('home.channels.title')}
          </h2>
          <p className="text-xl text-white/70 font-bold italic">{t('home.channels.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <a 
            href={SOCIAL_LINKS.WHATSAPP_COMMUNITY} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <WhatsappIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">{t('home.lounges.whatsapp.title')}</h3>
              <p className="text-white/60 text-sm font-bold">{t('home.lounges.whatsapp.desc')}</p>
            </div>
          </a>

          <a 
            href={SOCIAL_LINKS.TELEGRAM} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-[#0088cc] rounded-2xl flex items-center justify-center shadow-lg group-hover:-rotate-12 transition-transform">
              <TelegramIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">{t('home.lounges.telegram.title')}</h3>
              <p className="text-white/60 text-sm font-bold">{t('home.lounges.telegram.desc')}</p>
            </div>
          </a>

          <a 
            href={SOCIAL_LINKS.FACEBOOK} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <FacebookIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">Facebook</h3>
              <p className="text-white/60 text-sm font-bold">صفحتنا الرسمية على فيسبوك</p>
            </div>
          </a>

          <a 
            href={SOCIAL_LINKS.INSTAGRAM} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <InstagramIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">Instagram</h3>
              <p className="text-white/60 text-sm font-bold">تابع أحدث صورنا ومنتجاتنا</p>
            </div>
          </a>

          <a 
            href={SOCIAL_LINKS.TIKTOK} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <TiktokIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">TikTok</h3>
              <p className="text-white/60 text-sm font-bold">فيديوهات حصرية وفحص الجودة</p>
            </div>
          </a>

          <a 
            href={SOCIAL_LINKS.YOUTUBE} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-[#FF0000] rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
              <YoutubeIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">YouTube</h3>
              <p className="text-white/60 text-sm font-bold">رحلتنا من المزرعة إلى مائدتك</p>
            </div>
          </a>

          <a 
            href={SOCIAL_LINKS.SNAPCHAT} 
            target="_blank" 
            rel="noreferrer"
            className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-secondary/10 transition-all group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-[#FFFC00] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
              <SnapchatIcon className="w-10 h-10 text-black group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">Snapchat</h3>
              <p className="text-white/60 text-sm font-bold">يومياتنا وقطافنا اليومي المباشر</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );

  const renderVipPortal = () => (
    <section key="vip-gateway" className="py-48 md:py-80 relative z-30 bg-primary-dark overflow-hidden border-t-8 border-secondary shadow-[0_-50px_100px_-20px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-secondary/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 bg-secondary/10 border border-secondary/30 px-8 py-3 md:px-12 md:py-6 rounded-full backdrop-blur-3xl shadow-gold/20 shadow-xl"
          >
            <div className="w-2 h-2 md:w-3 md:h-3 bg-secondary rounded-full animate-ping"></div>
            <span className="text-secondary font-black text-xs md:text-xl uppercase tracking-[0.4em] font-display">
              {language === 'ar' ? 'بوابة كبار العملاء' : 'VIP CLIENTS PORTAL'}
            </span>
          </motion.div>

          <h2 className="text-[clamp(2.5rem,8vw,9rem)] font-black text-white tracking-tighter leading-[1.1] mb-6 text-3d-sovereign drop-shadow-sovereign">
             {language === 'ar' ? 'بوابة كبار العملاء' : 'VIP Clients Portal'}
          </h2>

          <div className="bg-white/5 backdrop-blur-3xl p-10 md:p-32 rounded-[4rem] md:rounded-[8rem] border border-white/10 shadow-sovereign relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <p className="text-lg md:text-5xl text-white/70 font-bold mb-12 md:mb-24 leading-[1.3] tracking-tight max-w-5xl mx-auto italic">
              {language === 'ar' 
                ? 'مساحة مخصصة لشركائنا التجاريين لإدارة الطلبات الضخمة، تتبع الشحنات بالرادار اللحظي، والحصول على قوائم أسعار الجملة المحدثة للمؤسسات.'
                : 'Dedicated high-performance workspace for our partners to manage bulk supply lines, radar-track shipments, and access live B2B wholesale pricing.'}
            </p>

            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('vip_login')}
              className="group relative bg-secondary text-primary px-12 md:px-32 py-6 md:py-14 rounded-3xl md:rounded-[4rem] font-black text-2xl md:text-6xl shadow-gold hover:shadow-glow transition-all flex items-center justify-center gap-6 md:gap-16 mx-auto border-b-8 md:border-b-[16px] border-primary/20 active:border-b-0 active:translate-y-2"
            >
              <span className="text-4xl md:text-8xl group-hover:rotate-12 transition-transform">🏰</span>
              <span className="text-3d-gold">{t('home.hero.vipButton')}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );

  const renderPartners = (section?: HomeSection) => (
    <section key={section?.id || 'static-partners'} className="py-48 md:py-80 relative overflow-hidden bg-primary z-10 border-t-8 border-secondary/20">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase leading-none text-shadow-sovereign"
          >
            {section ? (language === 'ar' ? section.title_ar : section.title_en) : t('home.partners.title')}
          </motion.h2>
          <div className="w-64 h-2.5 bg-secondary mx-auto rounded-full shadow-sovereign"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative group">
          <div className="absolute -inset-10 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-[7rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10 bg-white/5 backdrop-blur-md p-4 md:p-8 rounded-[5rem] shadow-sovereign border-8 border-white/10 transform group-hover:scale-[1.02] transition-all duration-1000">
            <img 
              src={COMPANY_INFO.partners_url} 
              alt="Our Partners" 
              className="w-full h-auto rounded-[4rem] shadow-2xl min-h-[400px] object-cover mix-blend-lighten"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            
            <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="mt-20 text-center relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-secondary/40 text-9xl font-serif">"</div>
              <p className="text-3xl md:text-5xl font-black text-white italic leading-tight max-w-5xl mx-auto text-shadow-sovereign">
                {t('home.partners.subtitle')}
              </p>
              <div className="mt-8 flex justify-center gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-3 h-3 bg-secondary rounded-full shadow-sovereign"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderSection = (section: HomeSection) => {
    if (!section.isVisible) return null;
    
    switch (section.type) {
      case 'hero': return renderHero(section);
      case 'categories': return renderCategories(section);
      case 'ads': return renderAds(section);
      case 'stats': return renderStats(section);
      case 'trust': return renderAbout(section);
      case 'channels': return renderChannels(section);
      case 'partners': return renderPartners(section);
      default: return null;
    }
  };

  const handleHomeRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise(res => setTimeout(res, 800));
    }
  };

  return (
    <PullToRefresh onRefresh={handleHomeRefresh}>
      <div className="animate-fade-in">
        <AnimatePresence>
          {homeSections.length > 0 ? (
            homeSections
              .filter(s => s.isVisible)
              .sort((a, b) => a.order - b.order)
              .map(section => renderSection(section))
          ) : (
            /* Fallback / Default Static Content */
            <>
              {renderHero()}
              {renderCategories()}
              {renderAds()}
              {renderVipPortal()}
              {renderSovereignDelivery()}
              {renderStats()}
              {renderAbout()}
              {renderChannels()}
              {renderPartners()}
            </>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  );
}
