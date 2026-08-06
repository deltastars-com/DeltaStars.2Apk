import React from 'react';
import { useFirebase } from './lib/contexts/FirebaseContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardStats() {
  const { orders, products } = useFirebase();
  
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = (orders || []).filter(o => o.createdAt?.startsWith(today));
  const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
  const activeShipments = (orders || []).filter(o => o.status === 'preparing' || o.status === 'setup').length;

  const statCards = [
    { title: 'إجمالي الطلبات اليوم', value: todayOrders.length, color: 'text-primary', delay: 0.1, trend: '+12% من أمس', trendColor: 'text-green-500' },
    { title: 'الشحنات النشطة', value: activeShipments, color: 'text-secondary', delay: 0.2, trend: 'في الوقت المحدد', trendColor: 'text-blue-500' },
    { title: 'إجمالي المبيعات', value: totalRevenue.toLocaleString() + ' ر.س', color: 'text-primary', delay: 0.3, trend: '+5% هذا الشهر', trendColor: 'text-green-500' },
    { title: 'إجمالي المنتجات', value: (products || []).length, color: 'text-yellow-500', delay: 0.4, trend: 'نشط في المتجر', trendColor: 'text-yellow-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <AnimatePresence>
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: stat.delay }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sovereign border border-slate-100 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <p className="text-slate-500 text-sm font-black mb-2 uppercase tracking-widest">{stat.title}</p>
            <h3 className={`text-4xl font-black ${stat.color} tracking-tighter relative z-10`}>{stat.value}</h3>
            <div className={`mt-6 flex items-center ${stat.trendColor} text-[10px] font-black uppercase tracking-widest`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
