import React from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, TruckIcon, HomeIcon, NavigationIcon } from './lib/contexts/Icons';

interface ShipmentMapProps {
  orderLocation?: { lat: number; lng: number };
  branchLocation?: { lat: number; lng: number };
  status: string;
}

export const ShipmentMap: React.FC<ShipmentMapProps> = ({ orderLocation, branchLocation, status }) => {
  // Saudi Arabia region bounds approx
  // We'll just draw a stylized abstract map visualization
  
  const isShipped = ['shipped', 'delivered'].includes(status);
  
  return (
    <div className="relative w-full h-[300px] bg-slate-100 rounded-[2.5rem] overflow-hidden border-2 border-slate-200">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--color-primary-dark) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      {/* Paths */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.path
          d="M 100 200 Q 250 100 400 200"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="4"
          strokeDasharray="8 8"
        />
        {isShipped && (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: status === 'delivered' ? 1 : 0.6 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d="M 100 200 Q 250 100 400 200"
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
          />
        )}
      </svg>

      {/* Branch (Start) */}
      <div className="absolute left-[80px] top-[180px] flex flex-col items-center">
        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white z-10">
          <HomeIcon className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-black mt-2 text-primary uppercase">Branch</span>
      </div>

      {/* Destination (End) */}
      <div className="absolute left-[380px] top-[180px] flex flex-col items-center">
        <div className={`w-10 h-10 ${status === 'delivered' ? 'bg-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-gray-300'} text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white z-10 transition-all`}>
          <MapPinIcon className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-black mt-2 text-gray-500 uppercase">Customer</span>
      </div>

      {/* Active Truck */}
      {isShipped && status !== 'delivered' && (
        <motion.div 
          animate={{ 
            left: [80, 250, 250],
            top: [180, 80, 80],
            rotate: [0, 0, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute z-20"
        >
          <div className="bg-secondary text-white p-3 rounded-xl shadow-xl border-2 border-white flex items-center gap-2">
            <TruckIcon className="w-4 h-4 animate-bounce" />
            <span className="text-[8px] font-black">EN ROUTE</span>
          </div>
        </motion.div>
      )}

      {/* Map Decoration */}
      <div className="absolute bottom-6 left-6 text-primary/30">
        <NavigationIcon className="w-12 h-12" />
      </div>

      <div className="absolute top-6 right-6 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 flex items-center gap-2 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${isShipped ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-[10px] font-black text-primary uppercase">GPS Active: TRUCK-102</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 flex items-center gap-2 shadow-sm">
          <span className="text-[10px] font-black text-gray-400 capitalize">Route: Jeddah → Riyadh</span>
        </div>
      </div>
    </div>
  );
};
