import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirebase, useI18n, useToast } from './lib/contexts';
import { useDriverTracking } from '../hooks/useDriverTracking';
import { useLocation } from '../hooks/useLocation';
import { 
  TruckIcon, PackageIcon, MapPinIcon, 
  CheckCircleIcon, ClockIcon, PhoneIcon,
  NavigationIcon, ShieldCheckIcon
} from './lib/contexts/Icons';

interface DriverDashboardPageProps {
  onLogout: () => void;
}

export const DriverDashboardPage: React.FC<DriverDashboardPageProps> = ({ onLogout }) => {
  const { user, orders, updateOrder } = useFirebase();
  const { language, formatCurrency } = useI18n();
  const { location, startWatching, stopWatching } = useLocation();
  const { updateMyLocation } = useDriverTracking();
  const { addToast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [knownOrderIds, setKnownOrderIds] = useState<string[]>([]);

  // Signature Modal states
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<any | null>(null);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const activeOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.driverId === user.id && o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders, user]);

  const completedToday = useMemo(() => {
    if (!user) return 0;
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(o => 
      o.driverId === user.id && 
      o.status === 'delivered' && 
      o.createdAt.startsWith(today)
    ).length;
  }, [orders, user]);

  useEffect(() => {
    if (isOnline) {
      startWatching();
    } else {
      stopWatching();
    }
  }, [isOnline, startWatching, stopWatching]);

  useEffect(() => {
    if (isOnline && location) {
      updateMyLocation(location.latitude, location.longitude);
    }
  }, [location, isOnline, updateMyLocation]);

  // Audio & Speech Synth setup for new incoming driver tasks
  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6

      osc2.frequency.setValueAtTime(293.66, audioCtx.currentTime); // D4
      osc2.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15); // A4
      osc2.frequency.exponentialRampToValueAtTime(587.33, audioCtx.currentTime + 0.3); // D5

      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.6);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Web Audio chime failed", e);
    }
  };

  useEffect(() => {
    const currentIds = activeOrders.map(o => o.id);
    if (knownOrderIds.length > 0) {
      const newOrders = currentIds.filter(id => !knownOrderIds.includes(id));
      if (newOrders.length > 0) {
        // Play notification chime
        playChimeSound();
        // Trigger automated Text-To-Speech announcement for drivers
        if ('speechSynthesis' in window) {
          const announcementText = language === 'ar' 
            ? 'تنبيه: لديك طلب جديد مستلم، يرجى تلبية الطلب فوراً' 
            : 'Alert: You have received a new delivery order, please fulfill it immediately';
          const utterance = new SpeechSynthesisUtterance(announcementText);
          utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
        addToast(
          language === 'ar' ? 'تنبيه: تم تعيين طلب توصيل جديد لك 📦' : 'Alert: A new delivery order has been assigned to you 📦',
          'success'
        );
      }
    }
    // Update active cache
    setKnownOrderIds(currentIds);
  }, [activeOrders, language]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    addToast(
      language === 'ar' 
        ? (isOnline ? 'أنت الآن غير متصل' : 'أنت الآن متصل وجاهز لاستلام الطلبات')
        : (isOnline ? 'You are now offline' : 'You are now online and ready for orders'),
      isOnline ? 'info' : 'success'
    );
  };

  const handleUpdateStatus = async (orderId: string, status: any, additionalData: any = {}) => {
    try {
      await updateOrder(orderId, { status, ...additionalData });
      addToast(
        language === 'ar' ? 'تم تحديث حالة الشحنة بنجاح' : 'Shipment status updated successfully',
        'success'
      );
    } catch (err) {
      addToast(
        language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status',
        'error'
      );
    }
  };

  // Canvas Signature Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#15803d'; // rich green primary color
    
    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImg(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImg(null);
  };

  const getEventCoords = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleConfirmDelivery = async () => {
    if (!signatureImg) {
      addToast(
        language === 'ar' ? 'يرجى الحصول على توقيع العميل لإثبات الاستلام' : 'Please obtain the customer signature to confirm delivery',
        'error'
      );
      return;
    }

    if (activeDeliveryOrder) {
      await handleUpdateStatus(activeDeliveryOrder.id, 'delivered', {
        deliveredAt: new Date().toISOString(),
        customerSignature: signatureImg,
        podVerified: true
      });
      setActiveDeliveryOrder(null);
      setSignatureImg(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-tajawal text-right animate-fade-in relative" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl shadow-xl flex justify-between items-center border-b-4 border-green-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <TruckIcon className="w-10 h-10 text-green-800" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-green-900">{language === 'ar' ? 'لوحة المندوب الميداني' : 'Field Agent Dashboard'}</h1>
              <p className="text-sm font-bold text-gray-500">{user?.full_name || user?.name || (language === 'ar' ? 'مندوب نجوم دلتا' : 'Delta Stars Driver')}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-red-600 font-black text-sm hover:bg-red-50 p-2 px-4 rounded-xl transition-all"
          >
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>

        {/* Status Card */}
        <div className={`p-8 rounded-3xl shadow-xl transition-all ${isOnline ? 'bg-green-600 text-white shadow-[0_10px_30px_rgba(22,163,74,0.3)]' : 'bg-gray-200 text-gray-600'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black mb-2">
                {isOnline 
                  ? (language === 'ar' ? 'متصل الآن ومتاح' : 'Online & Active')
                  : (language === 'ar' ? 'غير متصل' : 'Offline')}
              </h2>
              <p className="font-bold opacity-80">
                {isOnline 
                  ? (language === 'ar' ? 'يتم تتبع موقعك الجغرافي حالياً لتوصيل طلبات العملاء بسرعة' : 'Your live GPS location is tracked to route consumer supply lines')
                  : (language === 'ar' ? 'قم بتنشيط الاتصال لبدء استقبال وإشعار المهام الجديدة' : 'Enable online status to begin receiving job dispatches')
                }
              </p>
            </div>
            <button 
              onClick={toggleOnline}
              className={`px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all transform active:scale-95 ${
                isOnline ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isOnline 
                ? (language === 'ar' ? 'إيقاف التشغيل' : 'Go Offline')
                : (language === 'ar' ? 'بدء العمل وتفعيل GPS 🚀' : 'Start Duty & GPS 🚀')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: language === 'ar' ? 'طلبات اليوم المنجزة' : 'Delivered Today', value: completedToday.toString(), icon: PackageIcon, color: 'blue' },
            { label: language === 'ar' ? 'إجمالي المسافة (كم)' : 'Distance Traveled (km)', value: '45.2', icon: MapPinIcon, color: 'purple' },
            { label: language === 'ar' ? 'التقييم العام للمندوب' : 'Driver Rating', value: '4.9 ★', icon: CheckCircleIcon, color: 'yellow' },
            { label: language === 'ar' ? 'ساعات العمل اليوم' : 'Active Duty Hours', value: '6:30', icon: ClockIcon, color: 'green' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-lg border-b-4 border-gray-100">
              <stat.icon className="w-6 h-6 text-green-700 mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Active Orders */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="text-xl font-black text-green-900 mb-6 flex items-center gap-2">
            <PackageIcon className="w-6 h-6 text-green-600" />
            {language === 'ar' ? 'الطلبات النشطة للتوصيل اليوم' : 'Active Dispatches & Tasks'}
          </h3>
          
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">{language === 'ar' ? 'لا توجد طلبات معينة لك حالياً' : 'No active orders assigned currently'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-black text-slate-800">#{order.id.slice(-8)}</h4>
                      <p className="text-sm font-bold text-gray-500">{order.customerName}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black text-primary">{formatCurrency(order.total)}</p>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                    <MapPinIcon className="w-4 h-4 text-red-500" />
                    {order.address || (language === 'ar' ? 'العنوان غير محدد' : 'Address not specified')}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={() => {
                        if (order.customerPhone) window.open(`tel:${order.customerPhone}`);
                      }}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 p-4 rounded-2xl font-black text-slate-600 hover:bg-gray-100 transition-all"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      {language === 'ar' ? 'اتصال بالعميل' : 'Call Customer'}
                    </button>
                    <button 
                      onClick={() => {
                        const searchAddr = encodeURIComponent(order.address || 'Saudi Arabia');
                        window.open(`https://www.google.com/maps/search/?api=1&query=${searchAddr}`);
                      }}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 p-4 rounded-2xl font-black text-slate-600 hover:bg-gray-100 transition-all"
                    >
                      <NavigationIcon className="w-5 h-5 text-blue-500" />
                      {language === 'ar' ? 'توجيه الخريطة' : 'Route Navigation'}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                      {language === 'ar' ? 'مراحل التوصيل للمندوب' : 'Delivery Workflow Progress'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['preparing', 'setup', 'shipped', 'delivered'].map((status) => {
                        const isCurrent = order.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              if (status === 'delivered') {
                                setActiveDeliveryOrder(order);
                              } else {
                                handleUpdateStatus(order.id, status);
                              }
                            }}
                            disabled={order.status === status}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                              isCurrent
                                ? 'bg-green-700 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-400 border border-gray-200 hover:border-green-600 hover:text-green-600'
                            }`}
                          >
                            {status === 'preparing' && (language === 'ar' ? 'تجهيز بمستودع 🏢' : 'Preparing')}
                            {status === 'setup' && (language === 'ar' ? 'تحميل الشاحنة 🚚' : 'Setup')}
                            {status === 'shipped' && (language === 'ar' ? 'خرج للتوصيل 📍' : 'Shipped')}
                            {status === 'delivered' && (language === 'ar' ? 'تسليم وإثبات ✍️' : 'Confirm POD')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Electronic Proof of Delivery Signature Modal */}
      {activeDeliveryOrder && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-xl w-full border-4 border-green-700 shadow-2xl text-slate-800 relative">
            <button 
              onClick={() => {
                setActiveDeliveryOrder(null);
                setSignatureImg(null);
              }}
              className="absolute top-6 left-6 text-gray-400 hover:text-red-600 font-black p-2 rounded-full hover:bg-slate-50 transition-all text-xl"
            >
              ✕
            </button>

            <header className="border-b border-gray-100 pb-4 mb-6">
              <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase px-3 py-1 rounded-xl">
                {language === 'ar' ? 'إثبات التسليم الإلكتروني (POD)' : 'Electronic Proof Of Delivery'}
              </span>
              <h3 className="text-2xl font-black mt-2 text-green-900">
                {language === 'ar' ? 'توقيع العميل الإلكتروني الموثق' : 'Verify Customer Signature'}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                {language === 'ar' ? 'طلب رقم' : 'Order ID'}: #{activeDeliveryOrder.id.slice(-8)} • {activeDeliveryOrder.customerName}
              </p>
            </header>

            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-xs font-black text-slate-500">{language === 'ar' ? 'مبلغ التحصيل عند الاستلام' : 'Cash on Delivery Collection'}</p>
                <p className="text-xl font-black text-green-700">{formatCurrency(activeDeliveryOrder.total)}</p>
              </div>

              {/* Signature Pad */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'ارسم التوقيع هنا' : 'Draw Customer Signature Here'}</label>
                  <button 
                    onClick={clearCanvas}
                    className="text-[10px] text-red-500 font-black hover:underline"
                  >
                    {language === 'ar' ? 'مسح التوقيع 🔄' : 'Clear Pad 🔄'}
                  </button>
                </div>
                <div className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative">
                  <canvas 
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full h-32 block bg-gray-50"
                  />
                  {!signatureImg && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs pointer-events-none font-bold">
                      {language === 'ar' ? 'يرجى كتابة الاسم أو رسم التوقيع بالإصبع' : 'Please draw signature with finger or pointer'}
                    </div>
                  )}
                </div>
              </div>

              {/* Secure Delivery Authorization Check */}
              <div className="flex items-start gap-3 bg-green-50 p-4 rounded-2xl border border-green-100">
                <div className="p-1 bg-green-200 text-green-800 rounded-full mt-0.5">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
                <p className="text-xs text-green-950 font-bold leading-normal">
                  {language === 'ar' 
                    ? 'بتأكيد التوقيع، يشهد المندوب باستلام المستفيد كامل كمية المنتجات المبردة بحالة ممتازة وبأعلى درجات الجودة والمقاييس المعتمدة.'
                    : 'By confirming, the delegate certifies the customer has received the exact refrigerated produce in pristine certified condition.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setActiveDeliveryOrder(null);
                    setSignatureImg(null);
                  }}
                  className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-xl text-sm transition-all"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={handleConfirmDelivery}
                  className="py-4 bg-green-700 hover:bg-green-600 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-green-700/20"
                >
                  {language === 'ar' ? 'توثيق وتسليم الطلب 🔒' : 'Verify & Close Order 🔒'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

