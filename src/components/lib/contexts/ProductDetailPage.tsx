
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Page, Review } from '@/types';
import { useI18n } from './I18nContext';
import { useToast } from '../../../contexts/ToastContext';
import { StarIcon, ShoppingCartIcon, GlobeAltIcon, QualityIcon, DocumentTextIcon, XIcon, PlusIcon, HeartIcon, SparklesIcon } from './Icons';
import { ProductCard } from '../../ProductCard';
import { mockProducts } from '../vip/products';

const ProductReviews = React.lazy(() => import('../../ProductReviews'));

interface ProductDetailPageProps {
    product: Product;
    setPage: (page: Page, productId?: number) => void;
    reviews: Review[];
    onAddReview: (review: any) => void;
    addToCart: (product: Product, quantity: number) => void;
    averageRating: { average: number; count: number };
    toggleWishlist: (product: Product) => void;
    isInWishlist: boolean;
    isProductInWishlistFn?: (id: number) => boolean;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ 
    product, 
    setPage, 
    reviews,
    onAddReview,
    addToCart,
    averageRating,
    toggleWishlist,
    isInWishlist,
    isProductInWishlistFn
}) => {
  const { t, language, formatCurrency } = useI18n();
  const { addToast } = useToast();
  const isWeightBased = 
    product.unit_en?.toLowerCase().includes('kg') || 
    product.unit_en?.toLowerCase().includes('500g') ||
    product.unit_ar?.includes('كيلو') ||
    product.unit_ar?.includes('جرام');
    
  const [quantity, setQuantity] = useState(isWeightBased ? 0.5 : 1);
  const step = isWeightBased ? 0.5 : 1;
  const [activeImage, setActiveImage] = useState(product.image_url || product.image);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(isWeightBased ? 0.5 : 1);
    setActiveImage(product.image_url || product.image);
  }, [product.id]);

  const similarProducts = mockProducts.filter(
    p => p.category === product.category && p.id !== product.id
  );

  const gallery = product.gallery || [product.image_url || product.image];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;
    onAddReview({
      ...newReview,
      productId: product.id,
      author: t('productDetail.anonymous'),
      date: new Date().toISOString()
    });
    setNewReview({ rating: 5, comment: '' });
    addToast(t('productDetail.thankYou'), 'success');
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-20 text-black selection:bg-secondary selection:text-white">
      
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <button className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-secondary transition-colors">
              <XIcon className="w-8 h-8 md:w-12 md:h-12" />
          </button>
          <img 
            src={activeImage} 
            alt={product.name_ar} 
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/official_logo.png?v=2026'; }}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl md:rounded-3xl"
          />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 gap-4">
        <button 
          onClick={() => setPage('products')} className="bg-white border border-primary/10 text-primary font-black px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-2 text-sm md:text-xl shadow-lg"
        >
            &rarr; {t('productDetail.back')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-16">
        {/* Product Image Viewer */}
        <div className="lg:col-span-6">
            <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[5rem] shadow-sovereign border border-gray-100 sticky top-24 md:top-40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                <div 
                    ref={imgRef}
                    className="aspect-square rounded-xl md:rounded-[4rem] overflow-hidden bg-gray-50 border-2 md:border-4 border-white shadow-inner relative cursor-zoom-in"
                    onMouseEnter={() => setShowMagnifier(true)}
                    onMouseLeave={() => setShowMagnifier(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setIsZoomed(true)}
                >
                    <img 
                        src={activeImage} 
                        alt={product.name_ar} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/official_logo.png?v=2026'; }}
                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
                    />
                    
                    {showMagnifier && (
                        <div 
                            className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.5rem] md:rounded-[4rem]"
                            style={{
                                backgroundImage: `url(${activeImage})`,
                                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                                backgroundSize: '250%',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    )}

                    <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-white/80 backdrop-blur-md p-2 md:p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusIcon className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                    </div>
                </div>

                {gallery.length > 1 && (
                    <div className="flex gap-2 md:gap-4 mt-4 md:mt-8 justify-center">
                        {gallery.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`w-14 h-14 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-secondary scale-105 md:scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 bg-white/90 backdrop-blur-md p-2 md:p-4 rounded-full border border-secondary shadow-2xl animate-[spin_20s_linear_infinite]">
                    <QualityIcon className="w-6 h-6 md:w-10 md:h-10 text-secondary" />
                </div>
            </div>
        </div>
        
        {/* Product Details Content */}
        <div className="lg:col-span-6 flex flex-col">
            <div className="bg-primary text-white px-4 py-1 md:px-8 md:py-2.5 rounded-full w-fit font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] mb-3 md:mb-6 shadow-xl">
                {t(`categories.${product.category}`)}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black text-primary mb-3 md:mb-5 leading-tight tracking-tighter uppercase">
                {language === 'ar' ? product.name_ar : product.name_en}
            </h1>

            <div className="flex items-center gap-3 md:gap-6 mb-4 md:mb-8">
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(averageRating.average)} className={`w-3.5 h-3.5 md:w-5 md:h-5 ${i <= Math.round(averageRating.average) ? 'text-yellow-500' : 'text-gray-200'}`} />)}
                </div>
                <span className="text-gray-400 font-bold text-xs md:text-lg uppercase tracking-widest">{t('productDetail.gradeQuality')}</span>
            </div>

            <div className="bg-slate-50 p-4 sm:p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-gray-100 mb-4 md:mb-8 space-y-4 md:space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full"></div>
                
                <div className="relative z-10">
                    <p className="text-gray-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-2 md:mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-3.5 h-3.5 text-secondary" /> {t('productDetail.narrativeLabel')}
                    </p>
                    <p className="text-lg md:text-2xl font-bold leading-relaxed text-slate-800">
                        {language === 'ar' ? product.description_ar : product.description_en}
                    </p>
                </div>

                {product.features_ar && (
                    <div className="relative z-10">
                        <p className="text-gray-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                            <SparklesIcon className="w-3.5 h-3.5 text-secondary" /> {t('productDetail.technicalAttributes')}
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {(language === 'ar' ? product.features_ar : product.features_en)?.split('،').map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm md:text-lg font-black text-primary group">
                                    <div className="w-5 h-5 bg-white shadow-md rounded flex items-center justify-center text-secondary shrink-0 border border-gray-100 group-hover:bg-secondary group-hover:text-white transition-all text-xs">✓</div>
                                    <span className="leading-tight pt-0.5">{f.trim()}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {product.benefits_ar && (
                    <div className="relative z-10">
                        <p className="text-gray-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                            <QualityIcon className="w-3.5 h-3.5 text-secondary" /> {t('productDetail.healthBenefits')}
                        </p>
                        <ul className="grid grid-cols-1 gap-3">
                            {(language === 'ar' ? product.benefits_ar : product.benefits_en)?.split('،').map((b, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm md:text-lg font-bold text-slate-700 group">
                                    <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 shrink-0"></div>
                                    <span className="leading-tight">{b.trim()}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="pt-6 md:pt-10 border-t border-gray-200 flex items-center gap-4 md:gap-8 relative z-10">
                    <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-gray-100">
                        <GlobeAltIcon className="w-6 h-6 md:w-10 md:h-10 text-secondary" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('productDetail.originLabel')}</p>
                        <p className="text-xl md:text-3xl font-black text-primary flex items-center gap-2 md:gap-3">
                            {language === 'ar' ? product.origin_ar : product.origin_en}
                            <span className="bg-green-500 w-2 h-2 rounded-full animate-ping"></span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 mb-4 md:mb-8">
                <div className="text-center md:text-right">
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('productDetail.supplyPriceLabel')}</p>
                    <p className="text-3xl sm:text-4xl md:text-6xl font-black text-primary leading-none">
                        {product.price > 0 ? formatCurrency(product.price) : '---'}
                    </p>
                    <p className="text-xs md:text-lg font-bold text-secondary mt-1 md:mt-2 italic">{t('productDetail.unitPer', { unit: language === 'ar' ? product.unit_ar : product.unit_en })}</p>
                </div>
                
                <div className="flex-grow w-full">
                    <div className="bg-white border-2 md:border-4 border-gray-100 p-2 sm:p-3 md:p-4 rounded-xl md:rounded-[3rem] flex items-center justify-between shadow-inner">
                        <button onClick={() => setQuantity(Math.max(step, quantity - step))} className="w-10 h-10 md:w-14 md:h-14 bg-gray-50 rounded-lg md:rounded-2xl font-black text-lg md:text-3xl hover:bg-primary hover:text-white transition-all shadow-sm">-</button>
                        <span className="text-xl md:text-4xl font-black text-primary">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + step)} className="w-10 h-10 md:w-14 md:h-14 bg-gray-50 rounded-lg md:rounded-2xl font-black text-lg md:text-3xl hover:bg-primary hover:text-white transition-all shadow-sm">+</button>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 md:gap-6 mb-4 md:mb-8">
                <button 
                    onClick={() => { addToCart(product, quantity); addToast(t('productDetail.addedToCart'), 'success'); }}
                    className="flex-grow py-3.5 md:py-6 lg:py-8 bg-primary text-white rounded-xl md:rounded-[3.5rem] font-black text-base sm:text-lg md:text-2xl lg:text-3xl shadow-4xl transition-all border-b-4 md:border-b-8 lg:border-b-10 border-primary-dark active:border-b-0 flex items-center justify-center gap-2 md:gap-4"
                >
                    <ShoppingCartIcon className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                    {t('product.addToCart')}
                </button>
                <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-3.5 md:p-6 lg:p-8 rounded-xl md:rounded-[3.5rem] transition-all duration-500 shadow-4xl border-b-4 md:border-b-8 lg:border-b-10 active:border-b-0 flex items-center justify-center ${
                        isInWishlist ? 'bg-red-500 text-white border-red-700' : 'bg-white text-red-500 border-gray-200 hover:bg-red-50'
                    }`}
                >
                    <HeartIcon filled={isInWishlist} className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                </button>
            </div>

            <div className="mt-4 md:mt-12 p-4 md:p-10 bg-blue-50 rounded-2xl md:rounded-[3rem] border border-blue-100 flex items-start gap-4 md:gap-8">
                <QualityIcon className="w-8 h-8 md:w-14 md:h-14 text-blue-500 shrink-0" />
                <p className="text-xs md:text-base font-bold text-blue-800 leading-relaxed pt-1">
                    {t('productDetail.qualityNotice')}
                </p>
            </div>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="mt-20 md:mt-32 border-t border-gray-100 pt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
          <div>
            <span className="text-secondary font-black text-xs md:text-sm uppercase tracking-[0.3em]">
              {language === 'ar' ? 'من أجلك فقط' : 'CURATED FOR YOU'}
            </span>
            <h2 className="text-2xl md:text-5xl font-black text-primary mt-1 md:mt-2 leading-none tracking-tighter">
              {language === 'ar' ? 'منتجات مقترحة مشابهة' : 'Suggested Similar Products'}
            </h2>
            <p className="text-gray-500 font-bold text-xs md:text-lg mt-2 md:mt-3">
              {language === 'ar' ? 'بناءً على تصفحك لهذا المنتج، قد تعجبك هذه الخيارات الطازجة' : 'Based on your interest in this product, you might also like these fresh selections'}
            </p>
          </div>
          <button 
            onClick={() => setPage('products')}
            className="text-primary font-black text-sm md:text-lg hover:text-secondary transition-colors border-b-2 border-primary hover:border-secondary pb-1 flex items-center gap-2 shrink-0"
          >
            {language === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'} &larr;
          </button>
        </div>

        {similarProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {similarProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={addToCart}
                toggleWishlist={toggleWishlist}
                isInWishlist={isProductInWishlistFn ? isProductInWishlistFn(p.id) : false}
                setPage={(pPage, pId) => setPage(pPage, pId)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-gray-100 rounded-[2rem] p-12 text-center text-gray-500 font-bold">
            {language === 'ar' ? 'لا توجد منتجات مشابهة حالياً في هذا القسم' : 'No similar products found in this category at the moment'}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <React.Suspense fallback={<div className="mt-24 h-64 bg-gray-50 rounded-[4rem] animate-pulse"></div>}>
        <ProductReviews 
          productId={product.id}
          reviews={reviews}
          averageRating={averageRating}
          onAddReview={onAddReview}
        />
      </React.Suspense>
    </div>
  );
};
