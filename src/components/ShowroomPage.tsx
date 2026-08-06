import React, { useState, useMemo } from 'react';
import { useI18n, useToast } from './lib/contexts';
import { SearchIcon, FilterIcon, ShoppingCartIcon, XIcon, MicIcon } from './lib/contexts/Icons';
import { CATEGORY_ICONS } from '../constants';

interface ShowroomPageProps {
  items: any[];
  showroomBanner: string;
  setPage: (page: string) => void;
  initialCategory?: string;
  initialSearchTerm?: string;
  addToCart?: (product: any, quantity: number) => void;
}

export function ShowroomPage({ items, showroomBanner, setPage, initialCategory, initialSearchTerm, addToCart }: ShowroomPageProps) {
  const { language, formatCurrency, t } = useI18n();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
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
      addToast(language === 'ar' ? '🎙️ جاري الاستماع... تحدث الآن للبحث عن المنتج' : '🎙️ Listening... speak now to search products', 'info');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchTerm(transcript);
          setPageNumber(1);
          addToast(language === 'ar' ? `تم التقاط الصوت: "${transcript}"` : `Voice captured: "${transcript}"`, 'success');
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        addToast(language === 'ar' ? 'عذراً، لم نتمكن من التقاط الصوت بشكل واضح' : 'Could not recognize voice', 'error');
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

  const handleOpenQuickView = (product: any) => {
    const isWeight = 
      product.unit_en?.toLowerCase().includes('kg') || 
      product.unit_en?.toLowerCase().includes('500g') ||
      product.unit_ar?.includes('كيلو') ||
      product.unit_ar?.includes('جرام');
    setModalQuantity(isWeight ? 0.5 : 1);
    setSelectedProduct(product);
    setAddedAnimation(false);
  };

  const handleModalAddToCart = () => {
    if (addToCart && selectedProduct) {
      addToCart(selectedProduct, modalQuantity);
      setAddedAnimation(true);
      setTimeout(() => {
        setAddedAnimation(false);
      }, 2000);
    }
  };

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setPageNumber(1);
    }
  }, [initialCategory]);

  React.useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
      setPageNumber(1);
    }
  }, [initialSearchTerm]);

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return t('products.allCategories');
    const labels: any = {
      vegetables: t('categories.vegetables'),
      fruits: t('categories.fruits'),
      herbs: t('categories.herbs'),
      dates: t('categories.dates'),
      qassim: t('categories.qassim'),
      packages: t('categories.packages'),
      seasonal: t('categories.seasonal'),
      imported: t('categories.imported'),
      flowers: t('categories.flowers')
    };
    return labels[cat] || cat;
  };

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category));
    return ['all', ...Array.from(cats)];
  }, [items]);

  const ITEMS_PER_PAGE = 32;
  const [pageNumber, setPageNumber] = useState(1);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const name = language === 'ar' ? item.name_ar : item.name_en;
      const desc = language === 'ar' ? item.description_ar : item.description_en;
      const matchesSearch = name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            desc?.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesCategory = false;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'imported') {
        matchesCategory = item.origin_ar?.includes('مستورد') || !item.origin_ar?.includes('وطني');
      } else if (selectedCategory === 'qassim') {
        matchesCategory = item.origin_ar?.includes('القصيم') || item.category === 'qassim';
      } else {
        matchesCategory = item.category === selectedCategory;
      }
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory, language]);

  const pagedItems = useMemo(() => {
    return filteredItems.slice(0, pageNumber * ITEMS_PER_PAGE);
  }, [filteredItems, pageNumber]);

  return (
    <div className="animate-fade-in bg-slate-50 min-h-screen pb-20">
      {/* Banner */}
      <div className="relative h-[25vh] md:h-[40vh] overflow-hidden">
        <img 
          src={showroomBanner} 
          className="w-full h-full object-cover brightness-75 scale-105" 
          alt="Showroom Banner"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent flex items-center justify-center text-center p-8">
          <div className="space-y-6 md:space-y-10">
            <h2 className="text-6xl md:text-[8rem] font-black text-white uppercase tracking-tighter drop-shadow-sovereign antialiased font-display">{t('showroom.title')}</h2>
            <div className="h-2 w-48 bg-secondary mx-auto rounded-full shadow-glow"></div>
            <p className="text-2xl md:text-5xl text-secondary font-black italic tracking-[0.2em] md:tracking-[0.5em]">{t('home.hero.quality_label')}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 md:px-6 -mt-12 md:-mt-32 relative z-10">
        <div className="bg-white/95 backdrop-blur-3xl p-5 md:p-16 rounded-[2.5rem] md:rounded-[6rem] shadow-sovereign border border-white/20 space-y-6 md:space-y-12">
          <div className="relative w-full max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary/50 to-emerald-500/50 rounded-[1.5rem] md:rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex items-center">
              <SearchIcon className="absolute right-4 md:right-8 text-primary/30 w-6 h-6 md:w-8 h-8 pointer-events-none" />
              <input 
                type="text" 
                placeholder={t('showroom.searchPlaceholder')} 
                className="w-full p-4 md:p-8 pr-12 md:pr-20 pl-14 md:pl-24 bg-slate-50 border-2 border-slate-100 focus:border-secondary rounded-[1.5rem] md:rounded-[2.5rem] outline-none font-bold md:font-black transition-all shadow-inner text-lg md:text-2xl placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageNumber(1); 
                }}
              />
              <button
                type="button"
                onClick={startVoiceSearch}
                title={language === 'ar' ? 'البحث بالصوت المباشر 🎙️' : 'Voice Search 🎙️'}
                className={`absolute left-4 md:left-8 p-2 md:p-3 rounded-full transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)] scale-110'
                    : 'bg-primary/5 text-primary hover:bg-secondary hover:text-white'
                }`}
              >
                <MicIcon className="w-5 h-5 md:w-7 md:h-7" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 md:pb-6 scrollbar-hide px-2 md:px-4 justify-start md:justify-center md:flex-wrap">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPageNumber(1);
                }}
                className={`px-5 py-3 md:px-10 md:py-5 rounded-xl md:rounded-3xl font-bold md:font-black text-sm md:text-lg whitespace-nowrap transition-all border-2 ${selectedCategory === cat ? 'bg-primary text-secondary border-primary shadow-xl scale-105 md:scale-110 z-10' : 'bg-white text-primary/40 border-slate-100 hover:border-secondary hover:text-secondary'}`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 md:px-6 mt-16 md:mt-48 text-right">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-16">
          {pagedItems.map((item, index) => (
            <div 
              key={item.id} 
              className="group bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-xl hover:shadow-sovereign transition-all duration-700 border border-slate-100 flex flex-col relative transform hover:-translate-y-4"
            >
              <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 bg-primary/95 text-secondary w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl border-2 md:border-4 border-secondary/20 shadow-2xl backdrop-blur-md">
                {index + 1}
              </div>
 
              <div className="relative h-64 md:h-80 overflow-hidden cursor-pointer" onClick={() => handleOpenQuickView(item)}>
                <img 
                  src={item.image} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  alt={language === 'ar' ? item.name_ar : item.name_en}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                {/* Immersive Hover Overlay for Quick View */}
                <div className="absolute inset-0 bg-primary/45 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4 p-4 z-10 pointer-events-none">
                  <span className="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 font-black text-xs md:text-sm text-secondary bg-primary px-5 py-2.5 rounded-full shadow-2xl border border-secondary/30 uppercase tracking-widest">
                    {language === 'ar' ? '🔍 عرض سريع' : '🔍 Quick View'}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
                <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-secondary text-primary px-4 py-1.5 md:px-6 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs shadow-glow uppercase tracking-widest z-10">
                  {getCategoryLabel(item.category)}
                </div>
              </div>

              <div className="p-6 md:p-10 flex-1 flex flex-col space-y-4 md:space-y-6">
                <div>
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div>
                    <span className="text-[10px] md:text-xs font-black text-primary/40 uppercase tracking-[0.3em] leading-none">
                      DS-{item.id}
                    </span>
                  </div>
                  <h3 
                    onClick={() => handleOpenQuickView(item)}
                    className="text-xl md:text-3xl font-black text-primary mb-2 md:mb-3 leading-tight group-hover:text-secondary cursor-pointer transition-colors"
                  >
                    {language === 'ar' ? item.name_ar : item.name_en}
                  </h3>
                  <p className="text-gray-400 font-bold text-sm md:text-lg mb-4 md:mb-6 line-clamp-2 leading-relaxed h-10 md:h-14">{language === 'ar' ? item.description_ar : item.description_en}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-50 p-3 md:p-4 rounded-2xl border border-slate-100 group-hover:bg-primary/5 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-glow-sm"></div>
                  <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{t('showroom.qualitySeal')}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 md:pt-8 border-t-2 border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">{t('showroom.price')}</span>
                    <span className="text-2xl md:text-3xl font-black text-secondary tracking-tighter">{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenQuickView(item)}
                      className="bg-slate-100 hover:bg-primary hover:text-white text-primary px-3 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-xs transition-all uppercase tracking-wider flex items-center gap-1.5 border border-slate-200"
                    >
                      <span>🔍</span>
                      <span>{language === 'ar' ? 'عرض سريع' : 'Quick View'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (addToCart) {
                          const isWeight = item.unit_en?.toLowerCase().includes('kg') || 
                                           item.unit_en?.toLowerCase().includes('500g') ||
                                           item.unit_ar?.includes('كيلو') ||
                                           item.unit_ar?.includes('جرام');
                          addToCart(item, isWeight ? 0.5 : 1);
                        }
                      }}
                      className="bg-secondary text-primary p-4 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95 border-b-4 md:border-b-8 border-secondary-dark flex items-center justify-center"
                      title={t('showroom.orderNow')}
                    >
                      <ShoppingCartIcon className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Trigger */}
        {filteredItems.length > pagedItems.length && (
          <div className="mt-32 md:mt-48 flex justify-center pb-20">
            <button 
              onClick={() => setPageNumber(prev => prev + 1)}
              className="group relative overflow-hidden bg-primary text-secondary px-24 md:px-44 py-8 md:py-12 rounded-[3rem] font-black text-2xl md:text-5xl shadow-sovereign hover:scale-105 transition-all active:scale-95 border-b-[12px] border-black/30"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative z-10 uppercase tracking-tighter">{t('showroom.showMore')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="hidden md:flex fixed md:bottom-12 md:left-12 bg-white text-primary p-4 md:p-8 rounded-full shadow-sovereign border-2 md:border-4 border-slate-100 hover:bg-secondary hover:text-white transition-all z-50 animate-bounce-slow"
      >
        <FilterIcon className="w-6 h-6 md:w-10 md:h-10 rotate-180" />
      </button>

      {/* Product Modal - High End Detail View */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[250] flex items-start md:items-center justify-center p-3 sm:p-6 md:p-12 bg-primary/95 backdrop-blur-3xl animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-7xl rounded-[2rem] md:rounded-[5rem] lg:rounded-[8rem] overflow-hidden shadow-sovereign relative flex flex-col lg:flex-row min-h-0 border-4 md:border-8 border-white/20 my-auto">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 left-4 md:top-12 md:left-12 z-50 bg-white/10 md:bg-white/10 backdrop-blur-2xl p-3 md:p-6 rounded-full text-white hover:bg-secondary hover:text-primary transition-all border border-white/20 shadow-lg"
            >
              <XIcon className="w-5 h-5 md:w-10 md:h-10" />
            </button>
            
            <div className="w-full lg:w-1/2 h-[30vh] sm:h-[40vh] lg:h-auto relative overflow-hidden">
              <img 
                src={selectedProduct.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                alt={language === 'ar' ? selectedProduct.name_ar : selectedProduct.name_en}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
            </div>
            
            <div className="w-full lg:w-1/2 p-6 sm:p-10 md:p-16 lg:p-24 space-y-6 md:space-y-12 text-right bg-mesh">
              <div className="space-y-3 md:space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-secondary bg-primary px-4 py-1.5 md:px-8 md:py-3 rounded-full font-black text-xs md:text-sm uppercase tracking-[0.4em] shadow-glow-sm">{getCategoryLabel(selectedProduct.category)}</span>
                  <div className="flex items-center gap-3">
                     <span className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest">REF ID: DS-{selectedProduct.id}</span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-primary leading-[1.1] md:leading-[1] tracking-tighter drop-shadow-sm">{language === 'ar' ? selectedProduct.name_ar : selectedProduct.name_en}</h2>
              </div>
              
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-gray-500 font-bold leading-relaxed border-r-4 md:border-r-8 border-secondary pr-4 md:pr-8">
                {language === 'ar' ? selectedProduct.description_ar : selectedProduct.description_en}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-inner group hover:bg-primary transition-colors">
                  <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-4 block group-hover:text-secondary/60">{t('showroom.origin')}</span>
                  <p className="text-lg md:text-2xl font-black text-primary group-hover:text-white transition-colors">{language === 'ar' ? selectedProduct.origin_ar : selectedProduct.origin_en}</p>
                </div>
                <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-inner group hover:bg-primary transition-colors">
                  <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-4 block group-hover:text-secondary/60">{t('showroom.nutrition')}</span>
                  <p className="text-sm md:text-xl font-bold text-primary group-hover:text-white transition-colors">{language === 'ar' ? selectedProduct.nutritional_value_ar : selectedProduct.nutritional_value_en}</p>
                </div>
              </div>
 
              {/* Interactive Pricing & Dynamic Add to Cart with feedback */}
              <div className="bg-primary p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] border-2 md:border-4 border-secondary/30 flex flex-col xl:flex-row items-center justify-between shadow-sovereign gap-6 md:gap-10">
                <div className="flex flex-col text-center md:text-right">
                  <span className="text-[10px] md:text-sm font-black text-white/50 uppercase tracking-widest mb-1 md:mb-2">{t('showroom.priceLabel')}</span>
                  <div className="flex flex-col">
                    <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-secondary tracking-tighter drop-shadow-sovereign-sm">
                      {formatCurrency(selectedProduct.price * modalQuantity)}
                    </span>
                    <span className="text-white/40 font-black text-[10px] md:text-sm uppercase tracking-widest mt-1 md:mt-2">{language === 'ar' ? selectedProduct.unit_ar : selectedProduct.unit_en}</span>
                  </div>
                </div>

                {/* Interactive Quantity Selector inside Modal */}
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => {
                      const isWeight = selectedProduct.unit_en?.toLowerCase().includes('kg') || 
                                       selectedProduct.unit_en?.toLowerCase().includes('500g') ||
                                       selectedProduct.unit_ar?.includes('كيلو') ||
                                       selectedProduct.unit_ar?.includes('جرام');
                      const step = isWeight ? 0.5 : 1;
                      setModalQuantity(prev => Math.max(step, prev - step));
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl font-black text-white transition-all active:scale-90 text-lg"
                  >
                    -
                  </button>
                  <span className="font-black text-xl text-white w-12 text-center font-mono">{modalQuantity}</span>
                  <button 
                    onClick={() => {
                      const isWeight = selectedProduct.unit_en?.toLowerCase().includes('kg') || 
                                       selectedProduct.unit_en?.toLowerCase().includes('500g') ||
                                       selectedProduct.unit_ar?.includes('كيلو') ||
                                       selectedProduct.unit_ar?.includes('جرام');
                      const step = isWeight ? 0.5 : 1;
                      setModalQuantity(prev => prev + step);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl font-black text-white transition-all active:scale-90 text-lg"
                  >
                    +
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto justify-end">
                   <button 
                    onClick={handleModalAddToCart}
                    className={`w-full sm:w-auto px-8 py-4 md:px-12 md:py-6 rounded-xl md:rounded-[3rem] font-black text-lg sm:text-xl md:text-2xl shadow-gold hover:scale-[1.03] transition-all border-b-4 md:border-b-8 active:border-b-0 uppercase tracking-tighter flex items-center justify-center gap-3 ${
                      addedAnimation 
                        ? 'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-600 animate-pulse' 
                        : 'bg-secondary text-primary border-secondary-dark hover:bg-secondary/90'
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <span>✓</span>
                        <span>{language === 'ar' ? 'تمت الإضافة للسلة!' : 'Added to Cart!'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-5 h-5 md:w-6 md:h-6" />
                        <span>{t('product.addToCart')}</span>
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="text-white/60 hover:text-white font-black text-xs md:text-sm border-b-2 border-white/10 hover:border-white transition-all uppercase tracking-widest py-1.5"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
