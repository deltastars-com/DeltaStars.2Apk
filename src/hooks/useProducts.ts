import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: p, error: pErr }, { data: c, error: cErr }] = await Promise.all([
          supabase.from('products').select('*').order('id', { ascending: true }),
          supabase.from('categories').select('*').order('id', { ascending: true }),
        ]);
        if (pErr) throw pErr;
        if (cErr) throw cErr;
        if (isMounted) {
          setProducts(p || []);
          setCategories(c || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []); // ✅ مصفوفة فارغة تمنع التكرار اللامتناهي

  return { products, categories, loading, error };
};
