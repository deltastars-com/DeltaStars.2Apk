import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrainIcon, TrendingUpIcon, UserIcon, PackageIcon, CalendarIcon } from './lib/contexts/Icons';
import { useI18n } from './lib/contexts';
import { Order, Product } from '../types';

interface PredictiveOrdersSectionProps {
  orders: Order[];
  products: Product[];
}

export const PredictiveOrdersSection: React.FC<PredictiveOrdersSectionProps> = ({ orders, products }) => {
  const { language, formatCurrency } = useI18n();

  // Simple heuristic for predicted orders:
  // Customers who buy fresh produce frequently (e.g., weekly) are likely to order again.
  const predictions = useMemo(() => {
    const customerFrequency: Record<string, { count: number, lastOrder: Date, items: string[], name: string }> = {};
    
    orders.forEach(order => {
      const cid = order.customerId;
      if (!cid) return;
      
      const date = new Date(order.createdAt);
      if (!customerFrequency[cid]) {
        customerFrequency[cid] = { count: 0, lastOrder: date, items: [], name: order.customerName || 'VIP Customer' };
      }
      
      customerFrequency[cid].count++;
      if (date > customerFrequency[cid].lastOrder) {
        customerFrequency[cid].lastOrder = date;
      }
      
      // Collect product names
      order.items?.forEach(item => {
        if (!customerFrequency[cid].items.includes(item.name_ar)) {
          customerFrequency[cid].items.push(item.name_ar);
        }
      });
    });

    return Object.values(customerFrequency)
      .filter(c => c.count > 1) // Only recurring customers
      .map(c => {
        const nextExpected = new Date(c.lastOrder);
        nextExpected.setDate(nextExpected.getDate() + 7); // Default 7 days frequency
        
        return {
          customerName: c.name,
          frequency: c.count,
          lastOrder: c.lastOrder,
          nextExpected,
          topItems: c.items.slice(0, 3),
          probability: Math.min(60 + (c.count * 5), 98)
        };
      })
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-primary flex items-center gap-3">
            <BrainIcon className="w-8 h-8 text-secondary" />
            {language === 'ar' ? 'توقعات الطلبات القادمة' : 'Predicted Upcoming Orders'}
          </h3>
          <p className="text-gray-400 font-bold text-sm">محرك عُدي يتوقع الطلبات بناءً على السلوك الشرائي التاريخي</p>
        </div>
        <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-full text-xs font-black border border-secondary/20">
          AI MODEL: ODAY-PREDICT-v1
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {predictions.map((p, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-sovereign transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-gray-100 group-hover:bg-primary group-hover:text-white transition-colors">
                <UserIcon className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-primary">{p.customerName}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Last: {p.lastOrder.toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <TrendingUpIcon className="w-3 h-3" />
                    Freq: {p.frequency} orders
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items Likely Needed</p>
                <div className="flex gap-2">
                  {p.topItems.map((item, idx) => (
                    <span key={idx} className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-primary border border-gray-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center min-w-[120px]">
                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Next Expected</p>
                <p className="text-sm font-black text-emerald-800">{p.nextExpected.toLocaleDateString()}</p>
              </div>

              <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100 stroke-current"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-secondary stroke-current"
                    strokeWidth="4"
                    strokeDasharray={`${p.probability}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black">{p.probability}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center">
            <BrainIcon className="w-8 h-8 text-secondary" />
          </div>
          <div>
            <h4 className="text-xl font-black">AI Auto-Restock Strategy</h4>
            <p className="text-gray-400 font-bold text-xs">Oday recommends pre-allocating inventory for these customers in the Riyadh branch.</p>
          </div>
        </div>
        <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl">
          Apply Allocation Plan
        </button>
      </div>
    </div>
  );
};
