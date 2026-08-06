import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TruckIcon, MapPinIcon, CheckCircleIcon, 
  ClockIcon, PhoneIcon, MessageCircleIcon,
  ArrowRightIcon, ShieldCheckIcon
} from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';
import { COMPANY_INFO } from '../constants';

const SweetMap = React.lazy(() => import('./SweetMap').then(module => ({ default: module.SweetMap })));

interface LiveTrackingPageProps {
  orderId: string;
  onBack: () => void;
}

export default function LiveTrackingPage({ orderId, onBack }: LiveTrackingPageProps) {
  const { language } = useI18n();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'shipped' | 'delivered'>('preparing');

  // Simulation/Real coordinates
  const warehouse = { lat: 21.5433, lng: 39.1728 };
  const [destination, setDestination] = useState({ lat: 21.5678, lng: 39.2238 });
  const [userGpsActive, setUserGpsActive] = useState(false);

  // Get current user real location via Browser Geolocation API
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDestination({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setUserGpsActive(true);
        },
        (err) => {
          console.warn('Geolocation access denied or unavailable, using default delivery location:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Calculate current driver position based on live progress
  const driverPos = useMemo(() => {
    const ratio = progress / 100;
    return {
      lat: Number((warehouse.lat + (destination.lat - warehouse.lat) * ratio).toFixed(6)),
      lng: Number((warehouse.lng + (destination.lng - warehouse.lng) * ratio).toFixed(6))
    };
  }, [progress, destination]);

  const mapMarkers = useMemo(() => [
    {
      id: 'driver',
      position: driverPos,
      title: language === 'ar' ? 'مندوب نجوم دلتا المباشر' : 'Delta Stars Live Driver',
      description: language === 'ar' 
        ? `احداثيات المندوب: ${driverPos.lat}, ${driverPos.lng} | درجة التبريد: 4° م` 
        : `Coordinates: ${driverPos.lat}, ${driverPos.lng} | Temp: 4°C`,
      icon: 'https://cdn-icons-png.flaticon.com/64/744/744465.png' // Truck icon
    },
    {
      id: 'destination',
      position: destination,
      title: language === 'ar' ? 'موقع التسليم (موقعك)' : 'Delivery Location (You)',
      description: userGpsActive 
        ? (language === 'ar' ? 'موقعك المباشر عبر GPS' : 'Your Live GPS Location')
        : (language === 'ar' ? 'حي المنار، جدة' : 'Al Manar District, Jeddah')
    }
  ], [driverPos, destination, language, userGpsActive]);

  // Simulate progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 2000); // Slower for real map feel

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress < 40) setStatus('preparing');
    else if (progress < 90) setStatus('shipped');
    else setStatus('delivered');
  }, [progress]);

  const steps = [
    { id: 'preparing', label_ar: 'جاري التجهيز', label_en: 'Preparing', icon: ClockIcon },
    { id: 'shipped', label_ar: 'في الطريق إليك', label_en: 'On the Way', icon: TruckIcon },
    { id: 'delivered', label_ar: 'تم التوصيل', label_en: 'Delivered', icon: CheckCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-tajawal pb-24">
      {/* Header */}
      <div className="bg-primary text-white py-16 md:py-24 border-b-[10px] border-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80')] bg-cover"></div>
        <div className="relative z-10 container mx-auto px-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-secondary font-black text-sm mb-8 hover:translate-x-2 transition-transform"
          >
            <ArrowRightIcon className="w-5 h-5 rotate-180" />
            {language === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}
          </button>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            {language === 'ar' ? 'تتبع طلبك المباشر' : 'Live Order Tracking'}
          </h2>
          <p className="text-xl text-yellow-500 font-bold italic">طلب رقم: #{orderId.slice(0, 8)}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Status Timeline */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sovereign border border-gray-100">
              <div className="flex justify-between items-center mb-12">
                {steps.map((step, idx) => {
                  const isActive = (step.id === 'preparing') || 
                                   (step.id === 'shipped' && progress >= 40) ||
                                   (step.id === 'delivered' && progress >= 90);
                  const isCompleted = (step.id === 'preparing' && progress >= 40) ||
                                      (step.id === 'shipped' && progress >= 90);

                  return (
                    <div key={step.id} className="flex flex-col items-center gap-4 relative flex-1">
                      {/* Line */}
                      {idx < steps.length - 1 && (
                        <div className="absolute top-8 left-1/2 w-full h-1 bg-slate-100 -z-10">
                          <motion.div 
                            className="h-full bg-secondary"
                            initial={{ width: 0 }}
                            animate={{ width: isCompleted ? '100%' : (isActive && step.id === 'preparing' ? `${(progress/40)*100}%` : (isActive && step.id === 'shipped' ? `${((progress-40)/50)*100}%` : 0)) }}
                          />
                        </div>
                      )}
                      
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-secondary text-white shadow-lg scale-110' : 'bg-slate-100 text-gray-300'}`}>
                        <step.icon className="w-8 h-8" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-300'}`}>
                        {language === 'ar' ? step.label_ar : step.label_en}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-gray-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-black text-primary">
                    {status === 'preparing' ? (language === 'ar' ? 'جاري تجهيز طلبك بعناية' : 'Preparing your order with care') :
                     status === 'shipped' ? (language === 'ar' ? 'طلبك في الطريق مع المندوب' : 'Your order is on the way') :
                     (language === 'ar' ? 'تم توصيل الطلب بنجاح' : 'Order delivered successfully')}
                  </h4>
                  <span className="text-2xl font-black text-secondary">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-gray-100">
                  <motion.div 
                    className="h-full bg-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 font-bold leading-relaxed">
                  {status === 'preparing' ? (language === 'ar' ? 'نقوم الآن بفرز وتغليف المنتجات الطازجة لضمان وصولها إليكم بأفضل جودة.' : 'We are currently sorting and packaging fresh products to ensure they reach you in top quality.') :
                   status === 'shipped' ? (language === 'ar' ? 'المندوب غادر المستودع المبرد وهو في طريقه إلى موقعكم الآن.' : 'The delegate has left the refrigerated warehouse and is on the way to your location.') :
                   (language === 'ar' ? 'نتمنى أن تنال منتجاتنا رضاكم. شكراً لثقتكم بنجوم دلتا.' : 'We hope our products meet your satisfaction. Thank you for trusting Delta Stars.')}
                </p>
              </div>
            </div>

            {/* Real SweetMap Integration */}
            <div className="bg-white p-4 rounded-[3rem] shadow-sovereign border border-gray-100 h-[500px] relative overflow-hidden group">
              <div className="absolute inset-0 z-0">
                <React.Suspense fallback={<div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-white/50 font-black tracking-widest uppercase">يتم تحميل الخريطة السيادية...</div>}>
                  <SweetMap 
                    center={driverPos}
                    zoom={14}
                    markers={mapMarkers}
                  />
                </React.Suspense>
              </div>
              
              <div className="absolute top-6 right-6 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/10 z-10 flex items-center gap-2 text-xs font-mono">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="font-bold text-amber-300">GPS:</span>
                <span>{driverPos.lat.toFixed(4)}°, {driverPos.lng.toFixed(4)}°</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl shadow-xl flex justify-between items-center border border-slate-200 dark:border-slate-800 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-green-100 dark:bg-emerald-950/60 rounded-xl flex items-center justify-center text-green-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-primary dark:text-emerald-300">توصيل عالي الجودة مبرد</p>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400">نظام تتبع مباشر Smart GPS Google Maps</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-secondary">الوصول المتوقع</p>
                  <p className="text-base sm:text-lg font-black text-primary dark:text-amber-400 tracking-tighter">{Math.max(2, 45 - Math.floor(progress/2))} دقيقة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delegate Info */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-sovereign border border-gray-100 text-center space-y-6">
              <div className="relative inline-block">
                <img 
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80" 
                  className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-secondary shadow-xl mx-auto"
                  alt="Delegate"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary">أحمد محمد</h3>
                <p className="text-gray-400 font-bold">مندوب توصيل معتمد</p>
              </div>
              <div className="flex justify-center gap-4">
                <a href="tel:0500000000" className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                  <PhoneIcon className="w-6 h-6" />
                </a>
                <a href="https://wa.me/966500000000" className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm">
                  <MessageCircleIcon className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="bg-primary text-white p-10 rounded-[3rem] shadow-sovereign space-y-6">
              <h4 className="text-xl font-black">تفاصيل التوصيل</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPinIcon className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase">عنوان التوصيل</p>
                    <p className="text-sm font-bold">حي المنار، جدة، المملكة العربية السعودية</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <ClockIcon className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase">وقت الطلب</p>
                    <p className="text-sm font-bold">اليوم، 10:30 صباحاً</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-xs font-bold text-white/70 leading-relaxed">
                  {language === 'ar' ? 'سيصلك المندوب قريباً. يرجى التأكد من بقاء هاتفك متاحاً.' : 'The delegate will arrive soon. Please ensure your phone remains available.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
