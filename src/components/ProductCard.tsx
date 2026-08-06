import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Page } from '@/types';
import { ShoppingCartIcon, HeartIcon, StarIcon, SparklesIcon, DocumentTextIcon } from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: boolean;
  setPage: (page: Page, productId?: number, category?: string) => void;
  rating?: { average: number; count: number };
  key?: any;
}

export function ProductCard({ product, onAddToCart, toggleWishlist, isInWishlist, setPage, rating }: ProductCardProps) {
  const { t, language, formatCurrency } = useI18n();
  // Enhanced weight-based detection for 0.5kg support
  const isWeightBased = 
    product.unit_en?.toLowerCase().includes('kg') || 
    product.unit_en?.toLowerCase().includes('500g') ||
    product.unit_ar?.includes('كيلو') ||
    product.unit_ar?.includes('جرام');

  const step = isWeightBased ? 0.5 : 1;
  const [quantity, setQuantity] = useState(isWeightBased ? 0.5 : 1);
  const [imgError, setImgError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const productName = language === 'ar' ? product.name_ar : product.name_en;
  const productUnit = language === 'ar' ? product.unit_ar : product.unit_en;
  
  const handleCardClick = () => {
    setPage('productDetail', product.id);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    // Reduced network delay for faster feel while keeping premium feedback
    await new Promise(resolve => setTimeout(resolve, 400));
    onAddToCart(product, quantity);
    setQuantity(isWeightBased ? 0.5 : 1);
    setIsAdding(false);
  };

  const fallbackImg = "/official_logo.png?v=2026";

  return (
    <>
      <div 
        className="bg-white rounded-3xl md:rounded-[3.5rem] shadow-lg hover:shadow-[0_60px_120px_rgba(0,0,0,0.18)] transition-all duration-700 overflow-hidden flex flex-col group border border-gray-50 ProductCard h-full"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden cursor-pointer aspect-square" onClick={handleCardClick}>
          <img 
            src={imgError ? fallbackImg : (product.image_url || product.image)} 
            alt={productName || 'منتج نجوم دلتا'} 
            onError={() => setImgError(true)}
            loading="lazy"
            className={`w-full h-full ${imgError ? 'object-contain p-4' : 'object-cover'} group-hover:scale-110 transition-transform duration-1000 bg-gray-50`} 
            referrerPolicy="no-referrer"
          />
          
          {/* Immersive Hover Overlay */}
          <div className="absolute inset-0 bg-primary/25 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none flex flex-col items-center justify-center gap-4 p-4 md:p-8">
              <button
                onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                aria-label={language === 'ar' ? 'نظرة سريعة على المنتج' : 'Quick View Product'}
                className="pointer-events-auto transform translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 flex items-center gap-4 px-6 md:px-10 py-3 md:py-4 rounded-full bg-primary text-white border-2 border-white/20 shadow-2xl hover:bg-secondary transition-all duration-700 delay-75"
              >
                <span className="text-sm md:text-base font-black uppercase tracking-widest pt-0.5">
                  {language === 'ar' ? 'نظرة سريعة' : 'QUICK VIEW'}
                </span>
              </button>
          </div>

          {/* Wishlist Toggle */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col gap-3 pointer-events-auto z-20">
              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                aria-label={isInWishlist ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                className={`p-3 md:p-4 rounded-full backdrop-blur-3xl transition-all duration-500 shadow-xl border border-white/10 ${
                  isInWishlist ? 'bg-red-500 text-white border-red-400' : 'bg-white/20 text-white hover:bg-white hover:text-red-500'
                }`}
              >
                <HeartIcon filled={isInWishlist} className="w-5 h-5 md:w-6 md:h-6" />
              </button>
          </div>

          {/* Quality Badge */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-primary/90 backdrop-blur-md text-white text-[8px] md:text-[9px] font-black px-4 md:px-6 py-2 md:py-2.5 rounded-full shadow-2xl uppercase tracking-[0.2em] md:tracking-[0.4em] border border-white/10 flex items-center gap-2 md:gap-3">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-ping"></div>
            Sovereign Standard
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] md:text-[10px] text-primary font-black opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em]">{t(`categories.${product.category}`)}</span>
            <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2 md:px-3 py-1 rounded-full border border-gray-100">
               <StarIcon filled className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-yellow-400" />
               <span className="text-[9px] md:text-[10px] font-black text-slate-700 tracking-tighter">
                 {rating ? rating.average.toFixed(1) : '5.0'}
               </span>
               <span className="text-[7px] md:text-[8px] font-bold text-gray-400">
                 ({rating ? rating.count : 0})
               </span>
            </div>
          </div>
          
          <h3 className="text-lg md:text-2xl font-black text-slate-800 mb-2 md:mb-3 flex-grow cursor-pointer line-clamp-2 leading-tight group-hover:text-primary transition-colors" onClick={handleCardClick}>{productName}</h3>
          
          {/* Brief Description */}
          <p className="text-[10px] md:text-[12px] text-slate-500 mb-4 md:mb-5 line-clamp-2 font-medium leading-relaxed">
            {language === 'ar' ? product.description_ar : product.description_en}
          </p>

          {/* Details Section */}
          <div className="mb-4 md:mb-5 grid grid-cols-2 gap-2 md:gap-4 bg-slate-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[9px] font-black text-primary/40 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'المصدر' : 'Origin'}</span>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] md:text-[11px] font-black text-slate-700 truncate">{product.origin_ar || '---'}</span>
                <span className="text-[7px] md:text-[8px] font-bold text-gray-400 italic truncate">{product.origin_en || '---'}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[9px] font-black text-primary/40 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'الوحدة' : 'Unit'}</span>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] md:text-[11px] font-black text-slate-700 truncate">{product.unit_ar || '---'}</span>
                <span className="text-[7px] md:text-[8px] font-bold text-gray-400 italic truncate">{product.unit_en || '---'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 md:mb-6 bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-[2rem] border border-gray-100 shadow-inner">
              <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('product.unit')}: <span className="text-slate-800">{productUnit}</span></p>
              <div className="flex items-center gap-3 md:gap-5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(step, quantity - step)); }}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-lg md:rounded-xl font-black text-primary transition-all border border-transparent hover:border-gray-200 shadow-sm active:scale-90"
                    disabled={isAdding}
                  >-</button>
                  <span className="font-black text-base md:text-xl w-6 md:w-10 text-center text-primary">{quantity}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setQuantity(quantity + step); }}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-lg md:rounded-xl font-black text-primary transition-all border border-transparent hover:border-gray-200 shadow-sm active:scale-90"
                    disabled={isAdding}
                  >+</button>
              </div>
          </div>
          
          <div className="flex justify-between items-center mt-auto">
            <div className="flex flex-col">
              <span className="text-xl md:text-3xl font-black text-black tracking-tighter drop-shadow-sm">{product.price > 0 ? formatCurrency(product.price * quantity) : '---'}</span>
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`bg-secondary text-white p-4 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary transition-all shadow-4xl border-b-[4px] md:border-b-[6px] border-secondary-dark active:border-b-0 flex items-center justify-center min-w-[50px] md:min-w-[60px] ${isAdding ? 'opacity-70 cursor-not-allowed' : ''}`}
              aria-label={t('product.addToCart')}
            >
              {isAdding ? (
                <div className="w-6 h-6 md:w-10 md:h-10 border-2 md:border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <ShoppingCartIcon className="w-6 h-6 md:w-10 md:h-10" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductCard;
