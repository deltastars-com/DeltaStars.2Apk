import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Product, Page, Review, CategoryKey, CategoryConfig } from '@/types';
import { SkeletonProductCard } from '../../SkeletonProductCard';
import { ProductCard } from '../../ProductCard';
import { PullToRefresh } from '../../PullToRefresh';
import { useI18n } from './I18nContext';
import { StarIcon, AdiSparklesIcon as SparklesIcon } from './Icons';

// Replaced lazy import with synchronous import to resolve potential hook issues

interface ProductsPageProps {
  addToCart: (product: Product, quantity: number) => void;
  products: Product[];
  toggleWishlist: (product: Product) => void;
  isProductInWishlist: (productId: number) => boolean;
  setPage: (page: Page, productId?: number, category?: string) => void;
  getAverageRating: (productId: number) => { average: number; count: number };
  reviews: Review[];
  initialCategory?: CategoryKey | 'all';
  categories: CategoryConfig[];
  onRefresh?: () => Promise<void> | void;
}

const ALL_CATEGORIES_KEY = 'all';

export function ProductsPage({ 
    addToCart, products, toggleWishlist, isProductInWishlist, 
    setPage, getAverageRating, initialCategory = ALL_CATEGORIES_KEY,
    categories, onRefresh
}: ProductsPageProps) {
  const { t, language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>(initialCategory);
  const [sortOption, setSortOption] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  const handlePullRefresh = async () => {
    setIsLoading(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise(res => setTimeout(res, 800));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setSelectedCategory(initialCategory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Simulate loading
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [initialCategory]);

  const sortedAndFilteredProducts = useMemo(() => {
    const filtered = (products || []).filter(product => {
      let matchesCategory = false;
      if (selectedCategory === ALL_CATEGORIES_KEY) {
        matchesCategory = true;
      } else if (selectedCategory === 'imported') {
        matchesCategory = product.origin_ar?.includes('مستورد') || !product.origin_ar?.includes('وطني');
      } else if (selectedCategory === 'qassim') {
        matchesCategory = product.origin_ar?.includes('القصيم') || product.category === 'qassim';
      } else {
        matchesCategory = product.category === selectedCategory;
      }
      const productName = language === 'ar' ? (product.name_ar || '') : (product.name_en || '');
      return matchesCategory && productName.toLowerCase().includes((searchTerm || '').toLowerCase());
    });

    const sortableProducts = [...filtered];
    switch (sortOption) {
      case 'priceAsc': sortableProducts.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': sortableProducts.sort((a, b) => b.price - a.price); break;
      case 'newest': sortableProducts.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      case 'stock': sortableProducts.sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0)); break;
    }
    return sortableProducts;
  }, [searchTerm, selectedCategory, sortOption, language, products]);

  useEffect(() => { 
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, sortOption]);

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-24 text-black min-h-screen flex flex-col">
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-flex items-center gap-4 bg-primary/5 px-6 md:px-10 py-3 md:py-4 rounded-full border border-primary/10 mb-6 md:mb-10">
              <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
              <span className="text-primary font-black text-xs md:text-sm uppercase tracking-widest">{t('products.certifiedCatalog')}</span>
          </div>
          <h1 className="text-[clamp(2.5rem,8vw,8rem)] font-black text-primary mb-4 md:mb-6 tracking-tighter uppercase leading-none">{t('products.title')}</h1>
          <p className="text-lg md:text-3xl text-gray-400 font-bold max-w-4xl mx-auto leading-relaxed">{t('products.subtitle')}</p>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[4rem] shadow-sovereign mb-12 md:mb-20 flex flex-col lg:flex-row gap-6 md:gap-10 border border-gray-100 items-center">
          <div className="flex-1 w-full relative group">
              <input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-5 md:p-8 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl md:rounded-[2.5rem] focus:ring-8 focus:ring-primary/5 font-black text-lg md:text-2xl transition-all outline-none"
              />
              <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-2xl md:text-4xl opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as CategoryKey)}
                    className="w-full p-5 md:p-8 bg-gray-50 border-2 border-transparent hover:border-secondary/20 rounded-2xl md:rounded-[2.5rem] font-black text-base md:text-xl focus:ring-8 focus:ring-primary/5 cursor-pointer appearance-none outline-none transition-all"
                  >
                    <option value={ALL_CATEGORIES_KEY}>{t('products.allCategories')}</option>
                    {(categories || []).filter(c => c.isVisible).map(cat => (
                      <option key={cat.key} value={cat.key}>{language === 'ar' ? cat.label_ar : cat.label_en}</option>
                    ))}
                  </select>
                  <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">📂</span>
              </div>

              <div className="relative flex-1 lg:w-72">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full p-5 md:p-8 bg-gray-50 border-2 border-transparent hover:border-secondary/20 rounded-2xl md:rounded-[2.5rem] font-black text-base md:text-xl focus:ring-8 focus:ring-primary/5 cursor-pointer appearance-none outline-none transition-all"
                  >
                    <option value="default">{t('products.sort.default')}</option>
                    <option value="priceAsc">{t('products.sort.priceAsc')}</option>
                    <option value="priceDesc">{t('products.sort.priceDesc')}</option>
                    <option value="newest">{t('products.sort.newest')}</option>
                    <option value="stock">{t('products.sort.stock')}</option>
                  </select>
                  <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">🔃</span>
              </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-grow min-h-[400px] md:min-h-[600px] relative">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-12">
              {[...Array(8)].map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : sortedAndFilteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-12 pb-12 md:pb-24">
              <Suspense fallback={
                <>
                  {[...Array(4)].map((_, i) => <SkeletonProductCard key={`fallback-${i}`} />)}
                </>
              }>
                {sortedAndFilteredProducts.map(product => (
                  <ProductCard 
                    key={product.id}
                    product={product} 
                    onAddToCart={addToCart}
                    toggleWishlist={toggleWishlist}
                    isInWishlist={isProductInWishlist(product.id)}
                    setPage={setPage}
                    rating={getAverageRating(product.id)}
                  />
                ))}
              </Suspense>
            </div>
          ) : (
            <div className="col-span-full text-center py-16 md:py-32 bg-white rounded-3xl md:rounded-[5rem] shadow-inner border-4 border-dashed border-gray-100 animate-pulse">
              <span className="text-6xl md:text-9xl block mb-4 md:mb-8">📦</span>
              <p className="text-2xl md:text-4xl font-black text-gray-300 uppercase tracking-tighter">{t('products.noResults')}</p>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
