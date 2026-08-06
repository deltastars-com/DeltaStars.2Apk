import { useState, useEffect, useCallback } from 'react';
import api from './api';
import { Product } from '../types';
import { useToast } from '../contexts/ToastContext';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const { addToast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      if (data && data.length > 0) {
        setProducts(data);
        setFilteredProducts(data);
      } else {
        const { mockProducts } = await import('../components/lib/vip/products');
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
      }
    } catch (error) {
      console.warn('Using offline catalog for products');
      const { mockProducts } = await import('../components/lib/vip/products');
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...products];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name_ar.toLowerCase().includes(query) ||
        p.name_en.toLowerCase().includes(query) ||
        p.description_ar?.toLowerCase().includes(query) ||
        p.description_en?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => 
        p.category_ar === selectedCategory || 
        p.category_en === selectedCategory
      );
    }
    
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.price_1kg || 0) - (b.price_1kg || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price_1kg || 0) - (a.price_1kg || 0));
        break;
      default:
        result.sort((a, b) => a.id - b.id);
        break;
    }
    
    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, sortBy]);

  const getProduct = useCallback(async (id: number): Promise<Product | null> => {
    try {
      return await api.getProduct(id);
    } catch (error) {
      console.error('Failed to get product:', error);
      return null;
    }
  }, []);

  const categories = useCallback(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category_ar) cats.add(p.category_ar);
      if (p.category_en) cats.add(p.category_en);
    });
    return Array.from(cats);
  }, [products]);

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters, searchQuery, selectedCategory, sortBy]);

  return {
    products: filteredProducts,
    allProducts: products,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    getProduct,
    categories: categories(),
    refresh: fetchProducts,
  };
};

export default useProducts;
