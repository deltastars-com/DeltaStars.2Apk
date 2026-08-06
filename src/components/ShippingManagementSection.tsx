import React, { useState, useEffect } from 'react';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { 
  MapPinIcon, 
  TruckIcon, 
  PlusIcon, 
  TrashIcon, 
  BellIcon, 
  SettingsIcon, 
  TrendingUpIcon,
  NavigationIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PhoneIcon,
  MessageSquareIcon
} from './lib/contexts/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SweetMap } from './SweetMap';

export default function ShippingManagementSection() {
  const { language } = useI18n();
  const { addToast } = useToast();
  const { orders } = useFirebase();
  
  const [activeView, setActiveView] = useState<'zones' | 'fleet' | 'automation'>('zones');
  const [zones, setZones] = useState([
    { id: 1, name_ar: 'جدة - المنطقة المركزية', name_en: 'Jeddah - Central', price: 25, minOrder: 100, active: true },
    { id: 2, name_ar: 'مكة المكرمة - حي الشوقية', name_en: 'Makkah - Al Shauqia', price: 35, minOrder: 150, active: true },
    { id: 3, name_ar: 'الرياض - حي المنار', name_en: 'Riyadh - Al Manar', price: 50, minOrder: 200, active: true },
    { id: 4, name_ar: 'المدينة المنورة', name_en: 'Madinah', price: 45, minOrder: 180, active: false },
  ]);

  const [automationSettings, setAutomationSettings] = useState({
    autoAssign: true,
    whatsappAlerts: true,
    emailNotifications: true,
    smsConfirmation: false,
    realTimeTracking: true,
    courierSync: true
  });

  const fleet = [
    { id: 'T01', name: 'شاحنة - جدة 01', status: 'available', load: '0%', lat: 21.5433, lng: 39.1728 },
    { id: 'T02', name: 'شاحنة - مكة 02', status: 'delivering', load: '85%', lat: 21.3891, lng: 39.8579 },
    { id: 'T03', name: 'شاحنة - الرياض 05', status: 'preparing', load: '40%', lat: 24.7136, lng: 46.6753 },
  ];

  const handleDeleteZone = (id: number) => {
    setZones(zones.filter(z => z.id !== id));
    addToast(language === 'ar' ? 'تم حذف منطقة الشحن' : 'Shipping zone deleted', 'success');
  };

  const toggleAutomation = (key: keyof typeof automationSettings) => {
    setAutomationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    addToast(language === 'ar' ? 'تم تحديث إعدادات الأتمتة' : 'Automation settings updated', 'success');
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Dynamic Header */}
      <div className="bg-slate-900 p-10 md:p-14 rounded-[4rem] text-white relative overflow-hidden shadow-sovereign">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <TruckIcon className="w-10 h-10 text-primary animate-bounce-slow" />
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Delta Logistics</h1>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">نظام إدارة الشحن والتوصيل المتكامل والذكي</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setActiveView('zones')}
              className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all ${activeView === 'zones' ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              Shipping Zones
            </button>
            <button 
              onClick={() => setActiveView('fleet')}
              className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all ${activeView === 'fleet' ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              Fleet Radar
            </button>
            <button 
              onClick={() => setActiveView('automation')}
              className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all ${activeView === 'automation' ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              Smart Automation
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'zones' && (
          <motion.div 
            key="zones"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
               <div>
                 <h2 className="text-2xl font-black text-slate-800">تغطية المناطق الحالية 🌍</h2>
                 <p className="text-gray-400 font-bold text-xs uppercase">إدارة تسعير الشحن والحد الأدنى للطلبات لكل منطقة</p>
               </div>
               <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                  <PlusIcon className="w-6 h-6" /> إضافة منطقة ذكية
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {zones.map(zone => (
                <div key={zone.id} className="bg-white p-8 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-primary transition-all group flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${zone.active ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}>
                      <MapPinIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">{language === 'ar' ? zone.name_ar : zone.name_en}</h3>
                      <div className="flex gap-4 mt-2">
                        <span className="px-4 py-1 bg-slate-50 rounded-full text-[10px] font-black text-secondary">السعر: {zone.price} ر.س</span>
                        <span className="px-4 py-1 bg-slate-50 rounded-full text-[10px] font-black text-primary">الحد الأدنى: {zone.minOrder} ر.س</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-4 text-gray-300 hover:text-primary transition-all">
                        <SettingsIcon className="w-6 h-6" />
                     </button>
                     <button onClick={() => handleDeleteZone(zone.id)} className="p-4 text-gray-300 hover:text-red-500 transition-all">
                        <TrashIcon className="w-6 h-6" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'fleet' && (
          <motion.div 
            key="fleet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[70vh]">
              <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                {fleet.map(vehicle => (
                  <div key={vehicle.id} className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-gray-50 hover:border-secondary transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                         <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-primary">
                            <TruckIcon className="w-7 h-7" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Vehicle ID: {vehicle.id}</p>
                            <h4 className="text-xl font-black text-slate-800 uppercase">{vehicle.name}</h4>
                         </div>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                        vehicle.status === 'delivering' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between text-xs font-bold uppercase">
                          <span className="text-gray-400">Current Load Capacity</span>
                          <span className="text-slate-800">{vehicle.load}</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: vehicle.load }}></div>
                       </div>
                       <button className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-secondary transition-all">
                          <NavigationIcon className="w-5 h-5 md:w-6 md:h-6" /> تتبع الشاحنة مباشر
                       </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-3 bg-slate-100 rounded-[4rem] relative overflow-hidden shadow-inner border-4 border-white">
                <SweetMap 
                  markers={fleet.map(v => ({
                    id: v.id,
                    position: { lat: v.lat, lng: v.lng },
                    title: v.name,
                    description: `الحالة: ${v.status} | الحمولة: ${v.load}`
                  }))}
                  zoom={6}
                />
                <div className="absolute top-8 left-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white flex items-center gap-4 animate-fade-in">
                   <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-glow" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Live Satellite Pulse Active</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'automation' && (
          <motion.div 
            key="automation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { id: 'autoAssign', label_ar: 'التعيين الآلي للمناديب', label_en: 'Auto-Assign Fleet', icon: NavigationIcon, desc: 'توزيع الطلبات تلقائياً على أقرب مندوب متاح' },
              { id: 'whatsappAlerts', label_ar: 'اشعارات واتساب فورية', label_en: 'WhatsApp Sync', icon: MessageSquareIcon, desc: 'إرسال تحديثات الحالة للعميل والشركة آلياً' },
              { id: 'realTimeTracking', label_ar: 'التتبع اللحظي للعملاء', label_en: 'Client Live Track', icon: TrendingUpIcon, desc: 'السماح للعميل بمتابعة الشحنة عبر الخريطة' },
              { id: 'courierSync', label_ar: 'مزامنة شركات الشحن الخارجية', label_en: 'Global Courier Sync', icon: RefreshCwIcon, desc: 'ربط الأنظمة آلياً مع أرامكس وسمسا' },
              { id: 'emailNotifications', label_ar: 'تقارير البريد اليومية', label_en: 'Email Operations', icon: BellIcon, desc: 'إرسال ملخص الشحن اليومي لقسم العمليات' },
              { id: 'smsConfirmation', label_ar: 'تحقق SMS عند التسليم', label_en: 'SMS Delivery OTP', icon: PhoneIcon, desc: 'كود سري للتأكيد النهائي عند استلام الشحنة' },
            ].map(setting => (
              <div key={setting.id} className="bg-white p-10 rounded-[3.5rem] shadow-xl border-2 border-transparent hover:border-primary transition-all group">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all mb-8">
                  <setting.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2">{language === 'ar' ? setting.label_ar : setting.label_en}</h4>
                <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 leading-relaxed">{setting.desc}</p>
                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                   <span className={`text-[10px] font-black uppercase ${automationSettings[setting.id as keyof typeof automationSettings] ? 'text-emerald-500' : 'text-gray-300'}`}>
                      {automationSettings[setting.id as keyof typeof automationSettings] ? 'Active' : 'Disabled'}
                   </span>
                   <button 
                      onClick={() => toggleAutomation(setting.id as keyof typeof automationSettings)}
                      className={`w-14 h-8 rounded-full p-1 transition-all ${automationSettings[setting.id as keyof typeof automationSettings] ? 'bg-primary' : 'bg-slate-200'}`}
                   >
                      <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-md ${automationSettings[setting.id as keyof typeof automationSettings] ? 'translate-x-6' : 'translate-x-0'}`} />
                   </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-primary p-12 rounded-[5rem] shadow-2xl text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/truck/1920/1080')] opacity-5 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-right">
          <div className="space-y-4">
             <h3 className="text-4xl font-black">الربط مع النظام الفوري لشركة نجوم دلتا 🚀</h3>
             <p className="text-white/60 font-medium max-w-2xl leading-relaxed">تكامل شامل مع الأقمار الصناعية (GPS) ونظام SAP/Onyx ERP لضمان وصول كل صنف طازجاً وبأعلى معايير الجودة العالمية.</p>
          </div>
          <button className="bg-white text-primary px-12 py-5 rounded-[2.5rem] font-black text-xl hover:bg-secondary hover:text-white transition-all shadow- sovereign active:scale-95">
             تحديث البيانات السيادية
          </button>
        </div>
      </div>
    </div>
  );
}
