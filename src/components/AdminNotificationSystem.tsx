import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, TruckIcon, ZapIcon, CheckCircleIcon, Volume2Icon, VolumeXIcon, XIcon, ArrowRightIcon } from './lib/contexts/Icons';

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'driver_update' | 'stock_alert' | 'system_alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  driverName?: string;
  amount?: number;
  branchName?: string;
}

interface AdminNotificationSystemProps {
  orders?: any[];
  onNavigateTab: (tabId: string) => void;
}

// Web Audio API chime synthesizer for crisp instantaneous feedback
const playAudioAlert = (type: 'order' | 'driver' | 'alert') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'order') {
      // Upbeat double-tone chime for new order
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6

      osc2.frequency.setValueAtTime(261.63, ctx.currentTime);
      osc2.frequency.setValueAtTime(329.63, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.75);
      osc2.stop(ctx.currentTime + 0.75);
    } else if (type === 'driver') {
      // Smooth double tone for driver update
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.15); // C#5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Alert pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.warn('Audio play prevented or unsupported:', err);
  }
};

export const AdminNotificationSystem: React.FC<AdminNotificationSystemProps> = ({
  orders = [],
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    // Initial sample seed notifications for immediate rich UI
    return [
      {
        id: 'notif-seed-1',
        type: 'new_order',
        title: '📦 طلب جديد واصل للفرع الرئيسي',
        message: 'طلب #DS-2091 بقيمة 195 ريال - عميل VIP (أحمد الغامدي)',
        timestamp: new Date(),
        read: false,
        orderId: 'DS-2091',
        amount: 195,
        branchName: 'فرع الرياض - الملقا'
      },
      {
        id: 'notif-seed-2',
        type: 'driver_update',
        title: '🚚 السائق في الطريق للعميل',
        message: 'الكابتن فهد الشهري استلم الطلب #DS-2088 وهو في طريقه الآن (تتبع GPS نشط)',
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        read: false,
        driverName: 'فهد الشهري',
        orderId: 'DS-2088'
      },
      {
        id: 'notif-seed-3',
        type: 'stock_alert',
        title: '⚠️ تنبيه المخزون الذكي',
        message: 'تمر صقعي فاخر ينخفض إلى أقل من 15 كجم في المستودع الرئيسي',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: true,
      }
    ];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'drivers' | 'alerts'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<AdminNotification | null>(null);

  // Track known order IDs to detect brand new incoming orders
  const knownOrderIds = useRef<Set<string>>(new Set(orders.map(o => o.id)));
  const knownOrderStatuses = useRef<Map<string, string>>(new Map(orders.map(o => [o.id, o.status])));

  // Monitor incoming orders array in real-time
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    let hasNewOrder = false;
    let latestNewOrder: any = null;

    orders.forEach((ord) => {
      // Detect new order
      if (!knownOrderIds.current.has(ord.id)) {
        knownOrderIds.current.add(ord.id);
        knownOrderStatuses.current.set(ord.id, ord.status);
        hasNewOrder = true;
        latestNewOrder = ord;
      } else {
        // Detect order status / driver update
        const prevStatus = knownOrderStatuses.current.get(ord.id);
        if (prevStatus && prevStatus !== ord.status) {
          knownOrderStatuses.current.set(ord.id, ord.status);
          
          // Trigger driver / order status update alert
          const notif: AdminNotification = {
            id: 'notif-status-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            type: 'driver_update',
            title: `🚚 تحديث حالة الطلب #${ord.orderNumber || ord.id.slice(-5)}`,
            message: `تغيرت الحالة إلى: (${getStatusLabelAr(ord.status)}) - المندوب: ${ord.driverName || 'كابتن نجوم دلتا'}`,
            timestamp: new Date(),
            read: false,
            orderId: ord.id,
            driverName: ord.driverName
          };

          setNotifications(prev => [notif, ...prev]);
          setActiveToast(notif);
          if (soundEnabled) playAudioAlert('driver');
        }
      }
    });

    if (hasNewOrder && latestNewOrder) {
      const newNotif: AdminNotification = {
        id: 'notif-new-' + Date.now(),
        type: 'new_order',
        title: `⚡ طلب جديد واصل #${latestNewOrder.orderNumber || latestNewOrder.id.slice(-5)}`,
        message: `طلب بقيمة ${latestNewOrder.totalAmount || 150} ريال - ${latestNewOrder.customerName || 'عميل المتجر'}`,
        timestamp: new Date(),
        read: false,
        orderId: latestNewOrder.id,
        amount: latestNewOrder.totalAmount,
        branchName: latestNewOrder.branchName
      };

      setNotifications(prev => [newNotif, ...prev]);
      setActiveToast(newNotif);
      if (soundEnabled) playAudioAlert('order');
    }
  }, [orders, soundEnabled]);

  // Auto hide active toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const getStatusLabelAr = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'جاري التجهيز';
      case 'delivering': return 'في الطريق مع السائق';
      case 'completed': return 'تم التوصيل بنجاح';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  // Simulation Trigger for Admin testing
  const triggerSimulatedOrder = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const mockAmounts = [120, 245, 380, 510, 85];
    const mockNames = ['عبدالله العتيبي', 'سارة الماجد', 'محمد الشمري', 'شركة الأفق التجارية', 'خالد الدوسري'];
    const mockBranches = ['فرع الملقا الرئيسي', 'فرع الروضة', 'فرع جدة الشاطئ', 'فرع الخبر الشمالية'];

    const newNotif: AdminNotification = {
      id: 'sim-order-' + Date.now(),
      type: 'new_order',
      title: `📦 طلب جديد واصل الآن #DS-${randomId}`,
      message: `المبلغ: ${mockAmounts[randomId % mockAmounts.length]} ريال - العميل: ${mockNames[randomId % mockNames.length]}`,
      timestamp: new Date(),
      read: false,
      orderId: `DS-${randomId}`,
      amount: mockAmounts[randomId % mockAmounts.length],
      branchName: mockBranches[randomId % mockBranches.length]
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    if (soundEnabled) playAudioAlert('order');
  };

  const triggerSimulatedDriverUpdate = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const drivers = ['الكابتن ياسر القحطاني', 'الكابتن طارق السالم', 'الكابتن عمر العمودي'];
    const statuses = ['في الطريق للعميل 🚚', 'وصل لموقع التسليم 📍', 'تم تسليم الشحنة والتوقيع ✍️'];

    const newNotif: AdminNotification = {
      id: 'sim-driver-' + Date.now(),
      type: 'driver_update',
      title: `🚚 تحديث أسطول السائقين`,
      message: `${drivers[randomId % drivers.length]} - الحالة: ${statuses[randomId % statuses.length]} (طلب #DS-${randomId})`,
      timestamp: new Date(),
      read: false,
      driverName: drivers[randomId % drivers.length],
      orderId: `DS-${randomId}`
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    if (soundEnabled) playAudioAlert('driver');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'orders') return n.type === 'new_order';
    if (activeFilter === 'drivers') return n.type === 'driver_update';
    if (activeFilter === 'alerts') return n.type === 'stock_alert' || n.type === 'system_alert';
    return true;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative font-tajawal">
      {/* Top Header Bar Control Controls */}
      <div className="flex items-center gap-3">
        {/* Simulation Action Buttons for Testing */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={triggerSimulatedOrder}
            className="px-3 py-1.5 text-xs font-black text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-xl transition flex items-center gap-1.5 border border-amber-500/30 active:scale-95 shadow-sm"
            title="تجربة تلقي طلب جديد فوري"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>+ طلب جديد فوري</span>
          </button>
          <button
            onClick={triggerSimulatedDriverUpdate}
            className="px-3 py-1.5 text-xs font-black text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl transition flex items-center gap-1.5 border border-emerald-500/30 active:scale-95 shadow-sm"
            title="تجربة تحديث موقع السائق"
          >
            <span>🚚 تحديث سائق</span>
          </button>
        </div>

        {/* Mute/Unmute Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-2xl transition-all border ${
            soundEnabled 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'
          }`}
          title={soundEnabled ? 'التنبيه الصوتي مفعّل' : 'التنبيه الصوتي مكتوم'}
        >
          {soundEnabled ? <Volume2Icon className="w-5 h-5" /> : <VolumeXIcon className="w-5 h-5" />}
        </button>

        {/* Main Notification Bell Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-3 rounded-2xl transition-all duration-300 border flex items-center justify-center ${
            isOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
              : unreadCount > 0
              ? 'bg-slate-900 text-amber-400 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BellIcon className={`w-6 h-6 ${unreadCount > 0 && !isOpen ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse shadow-md">
              {unreadCount > 9 ? '+9' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Instant Toast Banner Overlay at Top Right */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 z-[9999] max-w-md w-full bg-slate-950/95 text-white p-5 rounded-3xl border-2 border-amber-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden font-tajawal"
          >
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              activeToast.type === 'new_order' ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500' : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
            }`} />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold shadow-lg ${
                  activeToast.type === 'new_order' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {activeToast.type === 'new_order' ? '📦' : '🚚'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      تنبيه فوري الآن
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(activeToast.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-white mt-1 leading-snug">{activeToast.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeToast.message}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveToast(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                تم إخطار مركز المراقبة السيادي
              </span>
              <button
                onClick={() => {
                  setActiveToast(null);
                  onNavigateTab('orders');
                }}
                className="px-3 py-1.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-1 shadow-md active:scale-95"
              >
                <span>معاينة الطلب</span>
                <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Down / Dropdown Notification Command Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Dismiss Overlay */}
            <div 
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute left-0 top-14 z-[101] w-[380px] sm:w-[440px] bg-slate-950/95 text-white rounded-3xl border-2 border-amber-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden font-tajawal"
            >
              {/* Drawer Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <ZapIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">مركز الإشعارات الفورية</h3>
                    <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">
                      Live Command & Control System
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="px-4 py-3 bg-slate-900/60 border-b border-white/5 flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('orders')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'orders'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>📦 الطلبات</span>
                  <span className="text-[10px] opacity-80">
                    ({notifications.filter(n => n.type === 'new_order').length})
                  </span>
                </button>
                <button
                  onClick={() => setActiveFilter('drivers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
                    activeFilter === 'drivers'
                      ? 'bg-emerald-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🚚 السائقين</span>
                  <span className="text-[10px] opacity-80">
                    ({notifications.filter(n => n.type === 'driver_update').length})
                  </span>
                </button>
                <button
                  onClick={() => setActiveFilter('alerts')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
                    activeFilter === 'alerts'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  ⚡ التنبيهات
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[380px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <BellIcon className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-bold">لا توجد إشعارات في هذا القسم حالياً</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border transition-all relative group ${
                        !notif.read
                          ? 'bg-slate-900 border-amber-500/40 shadow-md shadow-amber-500/5'
                          : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl text-lg shrink-0 ${
                            notif.type === 'new_order' 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : notif.type === 'driver_update'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {notif.type === 'new_order' ? '📦' : notif.type === 'driver_update' ? '🚚' : '⚠️'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-xs text-white leading-tight">{notif.title}</h4>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{notif.message}</p>

                            {/* Additional metadata tags */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(notif.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {notif.branchName && (
                                <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-amber-300 font-bold border border-white/10">
                                  {notif.branchName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct action button */}
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            if (notif.type === 'driver_update') {
                              onNavigateTab('branches');
                            } else {
                              onNavigateTab('orders');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-slate-950 text-amber-400 text-[10px] font-black transition border border-amber-500/20 shrink-0 self-center"
                        >
                          عرض
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-400">
                <button
                  onClick={markAllRead}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span>تحديد الكل كمقروء</span>
                </button>

                <button
                  onClick={clearAll}
                  className="hover:text-red-400 transition"
                >
                  مسح جميع الإشعارات
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
