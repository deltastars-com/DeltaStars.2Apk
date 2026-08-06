import React, { useState, useEffect } from 'react';
import { useI18n } from './lib/contexts/I18nContext';
import OrderTracking from './OrderTracking';
import { db, doc, onSnapshot } from '../firebase';
import { SearchIcon, PackageIcon, LocationMarkerIcon, WhatsappIcon, PhoneIcon } from './lib/contexts/Icons';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackOrderPageProps {
  initialOrderId?: string;
}

interface TrackedOrderDetails {
  id: string;
  customerName: string;
  items: { id: number; name_ar: string; name_en: string; quantity: number; price: number }[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  address: string;
  status: 'pending' | 'preparing' | 'setup' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderId }) => {
  const { language, t, formatCurrency } = useI18n();
  const { addToast } = useToast();
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [activeOrderId, setActiveOrderId] = useState(initialOrderId || '');
  const [orderData, setOrderData] = useState<TrackedOrderDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [isMockData, setIsMockData] = useState(false);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);

  // Load recent orders on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('delta_recent_orders');
      if (saved) {
        setRecentOrders(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load recent orders from localStorage', e);
    }
  }, []);

  // Save new tracked order to recent list
  const saveToRecentOrders = (id: string) => {
    try {
      const current = localStorage.getItem('delta_recent_orders');
      let list: string[] = current ? JSON.parse(current) : [];
      if (!list.includes(id)) {
        list = [id, ...list].slice(0, 5); // keep last 5
        setRecentOrders(list);
        localStorage.setItem('delta_recent_orders', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to save order to recent list', e);
    }
  };

  // Listen to Firestore order updates in real-time
  useEffect(() => {
    if (!activeOrderId) {
      setOrderData(null);
      setSearchAttempted(false);
      return;
    }

    setIsSearching(true);
    setSearchAttempted(true);
    setIsMockData(false);

    // 1. Set up live database listener
    const docRef = doc(db, 'orders', activeOrderId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Map database document to our local UI state interface
          const mappedItems = Array.isArray(data.items)
            ? data.items.map((it: any) => ({
                id: it.id || 0,
                name_ar: it.name_ar || it.name || '',
                name_en: it.name_en || it.name || '',
                quantity: it.quantity || 1,
                price: it.price || 0,
              }))
            : [];

          setOrderData({
            id: docSnap.id,
            customerName: data.customerName || '',
            items: mappedItems,
            subtotal: data.subtotal || 0,
            shippingFee: data.shippingFee || 0,
            discountAmount: data.discountAmount || 0,
            total: data.total || 0,
            address: data.address || '',
            status: data.status || 'pending',
            paymentStatus: data.paymentStatus || 'pending',
            paymentMethod: data.paymentMethod || 'cod',
            createdAt: data.createdAt || new Date().toISOString(),
            driverId: data.driverId || 'driver-101',
            driverName: data.driverName || (language === 'ar' ? 'محمد العتيبي' : 'Mohammed Al-Otaibi'),
            driverPhone: data.driverPhone || '0555555555',
            driverRating: data.driverRating || 4.9,
          });
          
          saveToRecentOrders(docSnap.id);
          setIsSearching(false);
          addToast(
            language === 'ar'
              ? 'تم العثور على الطلب وتحديث حالته مباشرة 🔔'
              : 'Order found. Tracking live database updates 🔔',
            'success'
          );
        } else {
          // 2. Fallback to high-fidelity mock simulator if order doesn't exist in Firestore yet
          generateMockTracking(activeOrderId);
        }
      },
      (error) => {
        console.warn('Firestore tracking error:', error);
        generateMockTracking(activeOrderId);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeOrderId, language]);

  // Generate high fidelity mock simulation if order not found in database
  const generateMockTracking = (id: string) => {
    setIsMockData(true);
    saveToRecentOrders(id);

    // Dynamic state based on ID string hash so it stays consistent for the same ID
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    const statusList: TrackedOrderDetails['status'][] = ['pending', 'preparing', 'setup', 'shipped', 'delivered'];
    const determinedStatus = statusList[sum % statusList.length];

    setTimeout(() => {
      setOrderData({
        id: id.toUpperCase(),
        customerName: language === 'ar' ? 'عميل نجوم دلتا الفاخر' : 'Delta Stars Premium Customer',
        items: [
          {
            id: 1,
            name_ar: 'تمر خلاص القصيم فاخر - كرتون مفرغ',
            name_en: 'Premium Qassim Khalas Dates - Vacuum Box',
            quantity: 2,
            price: 45,
          },
          {
            id: 2,
            name_ar: 'برتقال عصير طازج - سلة وسط',
            name_en: 'Fresh Juice Orange - Medium Basket',
            quantity: 1,
            price: 30,
          },
          {
            id: 3,
            name_ar: 'طماطم بلدي طازجة - صندوق محمي',
            name_en: 'Fresh Local Tomatoes - Greenhouse Box',
            quantity: 1,
            price: 25,
          }
        ],
        subtotal: 145,
        shippingFee: 0, // Order total is high enough for free delivery
        discountAmount: 15,
        total: 149.5, // (145 - 15) * 1.15 (VAT)
        address: language === 'ar' ? 'جدة، حي الشاطئ، شارع الأمير فيصل بن فهد' : 'Jeddah, Al-Shati, Prince Faisal Bin Fahd St',
        status: determinedStatus,
        paymentStatus: determinedStatus === 'delivered' ? 'paid' : 'pending',
        paymentMethod: 'mada',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
        driverId: 'driver-default',
        driverName: language === 'ar' ? 'مروان الحربي' : 'Marwan Al-Harbi',
        driverPhone: '0543210987',
        driverRating: 4.95,
      });
      setIsSearching(false);
    }, 400);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setActiveOrderId(orderIdInput.trim());
    }
  };

  // Helper to get status step active index and progress percentage
  const getProgressDetails = (status: TrackedOrderDetails['status']) => {
    switch (status) {
      case 'pending':
      case 'preparing':
        return { index: 0, percent: 25, label_ar: 'قيد التحضير', label_en: 'In Preparation' };
      case 'setup':
        return { index: 1, percent: 50, label_ar: 'تم الشحن', label_en: 'Shipped' };
      case 'shipped':
        return { index: 2, percent: 75, label_ar: 'في الطريق', label_en: 'On the Way' };
      case 'delivered':
        return { index: 3, percent: 100, label_ar: 'تم التوصيل', label_en: 'Delivered' };
      case 'cancelled':
        return { index: -1, percent: 0, label_ar: 'تم الإلغاء', label_en: 'Cancelled' };
      default:
        return { index: 0, percent: 25, label_ar: 'قيد التحضير', label_en: 'In Preparation' };
    }
  };

  const progressInfo = orderData ? getProgressDetails(orderData.status) : { index: 0, percent: 25, label_ar: 'قيد التحضير', label_en: 'In Preparation' };
  const currentStep = progressInfo.index;

  const stepsList = [
    {
      key: 'preparing',
      title_ar: 'قيد التحضير',
      title_en: 'In Preparation',
      desc_ar: 'نقوم الآن بتجهيز طلبك وانتقاء وتغليف المنتجات وتعقيمها',
      desc_en: 'Order items handpicked, sanitized and packaged',
      emoji: '🥬',
      percent: 25
    },
    {
      key: 'setup',
      title_ar: 'تم الشحن',
      title_en: 'Shipped',
      desc_ar: 'تم فحص جودة الشحنة وتحميلها على الأسطول المبرد',
      desc_en: 'Quality checked and loaded onto distribution fleet',
      emoji: '📦',
      percent: 50
    },
    {
      key: 'shipped',
      title_ar: 'في الطريق',
      title_en: 'On the Way',
      desc_ar: 'المندوب في الطريق إلى موقعك مع إمكانية التتبع الفوري بالـ GPS',
      desc_en: 'Courier on the way to your door with live GPS track',
      emoji: '🚚',
      percent: 75
    },
    {
      key: 'delivered',
      title_ar: 'تم التوصيل',
      title_en: 'Delivered',
      desc_ar: 'تم تسليم طلبك وثمارك الطازجة بنجاح بالصحة والعافية!',
      desc_en: 'Successfully delivered to your doorstep',
      emoji: '🏠',
      percent: 100
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 font-tajawal text-slate-800">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-black tracking-wider uppercase inline-block">
            {language === 'ar' ? 'التتبع اللوجستي الذكي' : 'SMART LOGISTICS PORTAL'}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
            {language === 'ar' ? 'تتبع مسار شحنتك المباشر' : 'Track Your Shipment'}
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            {language === 'ar'
              ? 'شاهد رحلة طلبك خطوة بخطوة وتتبع المندوب على الخريطة لحظياً'
              : 'Watch your premium fresh produce travel from our warehouses to your door'}
          </p>
        </div>

        {/* Input & Search Section */}
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sovereign border-2 border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 relative z-10">
            <div className="flex-grow relative">
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل رقم طلبك هنا (مثال: ORD-10023)' : 'Enter your order ID (e.g. ORD-10023)'}
                className="w-full p-5 pl-12 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg md:text-xl focus:border-primary outline-none transition-all shadow-inner focus:bg-white"
                required
              />
              <PackageIcon className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400`} />
            </div>
            
            <button
              type="submit"
              disabled={isSearching}
              className="bg-primary text-white hover:bg-primary-hover px-10 py-5 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SearchIcon className="w-6 h-6" />
                  <span>{language === 'ar' ? 'بحث وتتبع' : 'Track Order'}</span>
                </>
              )}
            </button>
          </form>

          {/* Recent Searches Quick Links */}
          {recentOrders.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">
                {language === 'ar' ? 'طلباتك الأخيرة:' : 'Recent Tracks:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {recentOrders.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setOrderIdInput(id);
                      setActiveOrderId(id);
                    }}
                    className="bg-slate-50 hover:bg-primary/5 hover:text-primary px-3.5 py-1.5 rounded-lg text-xs font-black transition border border-slate-100"
                  >
                    #{id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Display */}
        <AnimatePresence mode="wait">
          {activeOrderId && orderData && (
            <motion.div
              key={orderData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Order Status Badge & Meta */}
              <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold text-sm">#{orderData.id}</span>
                    {isMockData && (
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        {language === 'ar' ? 'محاكاة تفاعلية' : 'Simulation Mode'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black">
                    {language === 'ar' ? `أهلاً بك، ${orderData.customerName}` : `Welcome, ${orderData.customerName}`}
                  </h2>
                  <p className="text-slate-400 text-xs">
                    {language === 'ar' ? 'العنوان اللوجستي للتسليم: ' : 'Delivery Address: '}
                    <span className="text-slate-200 font-bold">{orderData.address}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">
                    {language === 'ar' ? 'قيمة الطلب الإجمالية مع الضريبة:' : 'Total Order with VAT:'}
                  </p>
                  <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                    {formatCurrency(orderData.total)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ar'
                      ? `طريقة الدفع: ${
                          orderData.paymentMethod === 'cod'
                            ? 'الدفع عند الاستلام'
                            : orderData.paymentMethod === 'bank_transfer'
                            ? 'تحويل بنكي'
                            : 'سداد إلكتروني آمن'
                        }`
                      : `Payment: ${orderData.paymentMethod.toUpperCase()}`}
                  </p>
                </div>
              </div>

              {/* Steps Progress Timeline */}
              {orderData.status === 'cancelled' ? (
                <div className="bg-red-50 border-2 border-red-100 p-8 rounded-3xl text-center space-y-2">
                  <span className="text-4xl">❌</span>
                  <h3 className="text-xl font-black text-red-600">
                    {language === 'ar' ? 'تم إلغاء هذا الطلب' : 'This Order has been Cancelled'}
                  </h3>
                  <p className="text-sm text-red-500">
                    {language === 'ar'
                      ? 'يرجى التواصل مع خدمة عملاء نجوم دلتا لمزيد من التفاصيل.'
                      : 'Please contact Delta Stars customer support for additional details.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sovereign border border-slate-100 space-y-8">
                  <h3 className="text-xl font-black border-b pb-4 text-slate-900 flex items-center gap-2">
                    <span>⏳</span>
                    {language === 'ar' ? 'مراحل تحضير وتسليم الطلب:' : 'Order Journey Progress:'}
                  </h3>

                  {/* Real-time GPS Coordinates Progress Visualization */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/10">
                    {/* Blinking green locator glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                          <h4 className="font-black text-sm tracking-wide text-emerald-400 uppercase">
                            {language === 'ar' ? 'التحقق والمطابقة اللوجستية بالـ GPS الفوري' : 'LIVE GPS METRICS & TELEMETRY'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {language === 'ar' 
                            ? 'إحداثيات المندوب والموقع الجغرافي الفوري للمركبة المبردة من قاعدة البيانات' 
                            : 'Real-time vehicle position and cold chain telemetry stream from database'}
                        </p>
                      </div>

                      <div className="font-mono bg-slate-800 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-xs space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400 font-bold">LAT:</span>
                          <span className="text-emerald-400 font-black">{driverLoc?.lat ? driverLoc.lat.toFixed(6) : '21.543300'}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400 font-bold">LNG:</span>
                          <span className="text-emerald-400 font-black">{driverLoc?.lng ? driverLoc.lng.toFixed(6) : '39.172800'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                      {[
                        {
                          title_ar: 'انطلق من المستودع',
                          title_en: 'Departed Depot',
                          desc_ar: 'أكثر من ٣ كم',
                          desc_en: '> 3 km remaining',
                          emoji: '🏢',
                          isActive: gpsDistance === null || gpsDistance > 3000,
                          isPassed: gpsDistance !== null && gpsDistance <= 3000,
                        },
                        {
                          title_ar: 'على الطريق السريع',
                          title_en: 'In Chilled Transit',
                          desc_ar: 'بين ١.٢ كم و ٣ كم',
                          desc_en: '1.2km to 3km',
                          emoji: '🛣️',
                          isActive: gpsDistance !== null && gpsDistance > 1200 && gpsDistance <= 3000,
                          isPassed: gpsDistance !== null && gpsDistance <= 1200,
                        },
                        {
                          title_ar: 'يقترب من منطقتك',
                          title_en: 'Approaching Area',
                          desc_ar: 'بين ٣٠0 م و ١.٢ كم',
                          desc_en: '300m to 1.2km',
                          emoji: '🏘️',
                          isActive: gpsDistance !== null && gpsDistance > 300 && gpsDistance <= 1200,
                          isPassed: gpsDistance !== null && gpsDistance <= 300,
                        },
                        {
                          title_ar: 'وصل عند بابك',
                          title_en: 'Arrived at Door',
                          desc_ar: 'أقل من ٣٠٠ م',
                          desc_en: '< 300m remaining',
                          emoji: '📍',
                          isActive: gpsDistance !== null && gpsDistance <= 300,
                          isPassed: false,
                        },
                      ].map((subStep, sIdx) => {
                        const isCurrent = subStep.isActive;
                        const isCompleted = subStep.isPassed;
                        
                        return (
                          <div 
                            key={sIdx}
                            className={`p-4 rounded-2xl transition-all duration-300 border ${
                              isCurrent
                                ? 'bg-primary/20 border-primary text-white scale-[1.02] shadow-lg ring-1 ring-primary/30'
                                : isCompleted
                                ? 'bg-slate-800/40 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800/10 border-slate-800 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{subStep.emoji}</span>
                              <div className="space-y-0.5">
                                <h5 className={`font-black text-xs md:text-sm ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {language === 'ar' ? subStep.title_ar : subStep.title_en}
                                </h5>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  {language === 'ar' ? subStep.desc_ar : subStep.desc_en}
                                </p>
                              </div>
                            </div>
                            
                            {/* Visual indicator bar at the bottom of the card */}
                            <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${
                                isCurrent 
                                  ? 'w-full bg-amber-400' 
                                  : isCompleted 
                                  ? 'w-full bg-emerald-500' 
                                  : 'w-0'
                              }`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Numeric Distance Visualizer */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">{language === 'ar' ? 'المسافة الجغرافية المحسوبة للعميل:' : 'Calculated GPS Distance to Customer:'}</span>
                        <span className="text-amber-400 font-black text-sm font-mono">
                          {gpsDistance !== null 
                            ? (gpsDistance >= 1000 ? `${(gpsDistance / 1000).toFixed(2)} km` : `${Math.round(gpsDistance)} m`) 
                            : '2.40 km'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <span>📦</span>
                          <span>{language === 'ar' ? 'حرارة الحفظ:' : 'Chilled Temp:'}</span>
                          <span className="text-emerald-400 font-black font-mono">4.1°C</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <span>⏱️</span>
                          <span>{language === 'ar' ? 'الوصول المتوقع:' : 'ETA:'}</span>
                          <span className="text-emerald-400 font-black font-mono">
                            {gpsDistance !== null ? `${Math.ceil(gpsDistance / 250)} min` : '10 min'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Dynamic Progress Bar & Status Switcher */}
                  <div className="space-y-6 pt-2">
                    {/* Header bar info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h4 className="font-black text-slate-800 text-sm md:text-base">
                            {language === 'ar' ? 'شريط تقدم حالة الطلب المباشر:' : 'Live Order Progress Bar:'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-bold">
                          {language === 'ar'
                            ? `الحالة الحالية: ${progressInfo.label_ar} (${progressInfo.percent}%)`
                            : `Current Status: ${progressInfo.label_en} (${progressInfo.percent}%)`}
                        </p>
                      </div>

                      {/* Interactive Simulation Switcher */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-bold hidden md:inline">
                          {language === 'ar' ? 'تبديل التتبع للتجربة:' : 'Test Status:'}
                        </span>
                        {[
                          { key: 'preparing', label_ar: '🥬 قيد التحضير', label_en: '🥬 Preparing' },
                          { key: 'setup', label_ar: '📦 تم الشحن', label_en: '📦 Shipped' },
                          { key: 'shipped', label_ar: '🚚 في الطريق', label_en: '🚚 On Way' },
                          { key: 'delivered', label_ar: '🏠 تم التوصيل', label_en: '🏠 Delivered' },
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={() => {
                              setOrderData((prev) => prev ? { ...prev, status: btn.key as any } : null);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                              orderData.status === btn.key
                                ? 'bg-primary text-white shadow-md scale-105'
                                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {language === 'ar' ? btn.label_ar : btn.label_en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black text-slate-500 px-1">
                        <span>0%</span>
                        <span className="text-amber-500 font-mono text-sm">{progressInfo.percent}%</span>
                        <span>100%</span>
                      </div>
                      
                      <div className="h-6 bg-slate-100 rounded-full p-1 border border-slate-200 relative shadow-inner overflow-hidden">
                        {/* Animated Glow Fill */}
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-green-600 transition-all duration-1000 ease-out shadow-lg relative flex items-center justify-end pr-2 text-white font-mono text-[11px] font-black"
                          style={{ width: `${progressInfo.percent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none rounded-full" />
                          <span className="relative z-10 drop-shadow-sm">{progressInfo.percent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* 4 Core Milestone Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {stepsList.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;
                        const isUpcoming = idx > currentStep;

                        return (
                          <div
                            key={step.key}
                            onClick={() => {
                              setOrderData((prev) => prev ? { ...prev, status: step.key as any } : null);
                            }}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                              isActive
                                ? 'bg-amber-50/80 border-amber-400 shadow-md scale-[1.02] ring-2 ring-amber-400/30'
                                : isCompleted
                                ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
                                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-70'
                            }`}
                          >
                            {/* Top Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl">{step.emoji}</span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-amber-400 text-slate-900 animate-pulse'
                                    : isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isCompleted ? '✓ ' + (language === 'ar' ? 'مكتمل' : 'Done') : isActive ? (language === 'ar' ? 'جارٍ الآن' : 'Active') : `${step.percent}%`}
                              </span>
                            </div>

                            <h5 className={`font-black text-sm md:text-base ${isActive ? 'text-amber-600' : isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {language === 'ar' ? step.title_ar : step.title_en}
                            </h5>

                            <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                              {language === 'ar' ? step.desc_ar : step.desc_en}
                            </p>

                            {/* Bottom Mini Progress Line */}
                            <div className="mt-3 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-700 ${
                                  isActive
                                    ? 'w-full bg-amber-500 animate-pulse'
                                    : isCompleted
                                    ? 'w-full bg-emerald-500'
                                    : 'w-0'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Map & Delivery Driver Portal details */}
              {orderData.status !== 'cancelled' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left block: Shipment tracker on Map (Span 2) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-[2.5rem] shadow-sovereign border border-slate-100">
                      <OrderTracking
                        driverId={orderData.driverId}
                        initialDriverLocation={{ lat: 21.5433, lng: 39.1728 }}
                        customerLocation={{ lat: 21.5833, lng: 39.2128 }}
                        onLocationUpdate={(loc, dist) => {
                          setDriverLoc(loc);
                          setGpsDistance(dist);
                        }}
                      />
                    </div>
                  </div>

                  {/* Right block: Courier, branch and items node (Span 1) */}
                  <div className="space-y-6">
                    {/* Courier Node */}
                    {orderData.status !== 'pending' && (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-[2rem] shadow-xl border border-white/5 space-y-4">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          {language === 'ar' ? 'مندوب التوصيل المعتمد:' : 'ASSIGNED COURIER:'}
                        </h4>
                        
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden">
                            <span className="text-3xl">👨‍✈️</span>
                          </div>
                          <div>
                            <p className="font-black text-lg text-white">{orderData.driverName}</p>
                            <div className="flex items-center gap-1.5 text-amber-400 text-sm mt-0.5 font-bold">
                              <span>⭐</span>
                              <span>{orderData.driverRating}</span>
                              <span className="text-slate-400 text-xs">({language === 'ar' ? 'أعلى تقييم للعملاء' : 'Premium'})</span>
                            </div>
                          </div>
                        </div>

                        {/* Driver Actions */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <a
                            href={`https://wa.me/${orderData.driverPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                          >
                            <WhatsappIcon className="w-4 h-4" />
                            <span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                          </a>
                          <a
                            href={`tel:${orderData.driverPhone}`}
                            className="bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border border-white/10"
                          >
                            <PhoneIcon className="w-4 h-4" />
                            <span>{language === 'ar' ? 'اتصال مباشر' : 'Call'}</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Order Items Breakdown */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sovereign border border-slate-100 space-y-4">
                      <h4 className="text-sm font-black border-b pb-3 text-slate-900">
                        {language === 'ar' ? 'الأصناف المطلوبة:' : 'Order Items:'}
                      </h4>
                      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                        {orderData.items.map((item, idx) => (
                          <div key={idx} className="py-3 flex justify-between items-center gap-4">
                            <div>
                              <p className="font-black text-sm text-slate-800 line-clamp-2">
                                {language === 'ar' ? item.name_ar : item.name_en}
                              </p>
                              <p className="text-xs text-slate-400 font-bold mt-0.5">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                            <span className="font-black text-sm text-slate-900 font-mono">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Summary */}
                      <div className="border-t pt-3 space-y-2 text-xs font-bold text-slate-500">
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                          <span className="font-mono text-slate-700">{formatCurrency(orderData.subtotal)}</span>
                        </div>
                        {orderData.discountAmount > 0 && (
                          <div className="flex justify-between text-red-500">
                            <span>{language === 'ar' ? 'الخصم الكوبوني:' : 'Coupon Discount:'}</span>
                            <span className="font-mono">- {formatCurrency(orderData.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'رسوم التوصيل:' : 'Delivery Fee:'}</span>
                          <span className="font-mono text-slate-700">
                            {orderData.shippingFee === 0 ? (language === 'ar' ? 'مجاني' : 'Free') : formatCurrency(orderData.shippingFee)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-dashed pt-2 text-sm font-black text-slate-950">
                          <span>{language === 'ar' ? 'الإجمالي النهائي (شامل ضريبة القيمة المضافة 15%):' : 'Grand Total (Incl. 15% VAT):'}</span>
                          <span className="font-mono text-primary text-base">{formatCurrency(orderData.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!activeOrderId && !orderData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-50 grayscale transition duration-300">
              <div className="bg-white p-8 rounded-3xl text-center space-y-4 shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl">📦</div>
                <h4 className="font-black text-slate-800 text-lg">{language === 'ar' ? 'تجهيز الطلب' : 'Preparing produce'}</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  {language === 'ar' ? 'يتم غسل، تبريد وتغليف منتجاتكم بأعلى المعايير الصحية.' : 'Produce is washed, sanitised and chilled to preserve maximum freshness.'}
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl text-center space-y-4 shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl">🚚</div>
                <h4 className="font-black text-slate-800 text-lg">{language === 'ar' ? 'شحن مبرد سريع' : 'Chilled Fleet Delivery'}</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  {language === 'ar' ? 'تتحرك شاحناتنا مجهزة بنظام تحكم ذكي لدرجة الحرارة.' : 'Our fleet is fully refrigerated and dynamically tracked via real-time satellite GPS.'}
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl text-center space-y-4 shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl">🏠</div>
                <h4 className="font-black text-slate-800 text-lg">{language === 'ar' ? 'توصيل عند بابك' : 'Doorstep Handover'}</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  {language === 'ar' ? 'يتم تسليم السلة آمنة بدون لمس مع توقيع العميل إلكترونياً.' : 'Secure contact-free handover with dynamic electronic delivery signature.'}
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
