import React, { useState, useEffect, useMemo } from 'react';
import { Order, User, Branch } from '../types';
import { useI18n, useToast, ShoppingBagIcon, CheckCircleIcon, ClockIcon, MapPinIcon, UserIcon, PhoneIcon, TruckIcon, PackageIcon, SearchIcon, FilterIcon, RefreshCwIcon, FileTextIcon, ArrowLeftIcon, XIcon, ShieldCheckIcon } from './lib/contexts';
import { motion, AnimatePresence } from 'framer-motion';
import { db, collection, query, onSnapshot, orderBy, updateDoc, doc, handleFirestoreError, OperationType, where, limit, addDoc } from '@/firebase';
import { BRANCH_LOCATIONS } from '../constants';
import { api } from '@/services/api';

interface WarehouseControlCenterProps {
  user: User;
  onBack?: () => void;
}

export const WarehouseControlCenter: React.FC<WarehouseControlCenterProps> = ({ user, onBack }) => {
  const { language, formatCurrency, t } = useI18n();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTab, setActiveTab] = useState<'orders' | 'logistics' | 'accounting'>('orders');
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    // Staff can see all orders usually, but we guard against permission issues for branch agents
    let q = query(ordersRef, orderBy('createdAt', 'desc'), limit(100));
    
    if (user?.role === 'branch_agent' && user?.assignedBranchId) {
      q = query(ordersRef, where('branchId', '==', user.assignedBranchId), orderBy('createdAt', 'desc'), limit(100));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn('Warehouse Control restricted: check user role permissions.');
      } else {
        handleFirestoreError(error, OperationType.GET, 'warehouse_control');
      }
      setLoading(false);
    });

    // Fetch drivers for assignment
    api.getDrivers().then(setDrivers).catch(console.error);

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updateData: any = { 
        status,
        updatedAt: new Date().toISOString(),
        processedBy: user?.email
      };

      if (status === 'preparing') {
        const order = orders.find(o => o.id === orderId);
        
        // AUTOMATED NOTIFICATION TO BRANCH DELEGATES
        await addDoc(collection(db, 'notifications'), {
          title_ar: `طلب جديد لتجهيزه - فرع ${order?.branchId || 'الرئيسي'}`,
          title_en: `New Order for Preparation - ${order?.branchId || 'Main'} Branch`,
          message_ar: `الرجاء البدء في تجهيز الطلب رقم #${orderId.slice(-6)} فوراً لتسليمه للمندوب`,
          message_en: `Please start preparing order #${orderId.slice(-6)} immediately for delegate delivery`,
          type: 'order',
          orderId,
          status: 'unread',
          createdAt: new Date().toISOString(),
          branchId: order?.branchId || 'all',
          metadata: { sound: 'alert_new_order', priority: 'high' }
        });
        
        addToast(language === 'ar' ? 'تم إرسال إشعار آلي لمناديب التجهيز في المستودع' : 'Automated notification sent to warehouse preparation delegates', 'success');
      }

      if (status === 'shipped') {
        updateData.shippedAt = new Date().toISOString();
        updateData.shippingStatus = 'in_transit';
        
        // Find and assign nearest driver automatically
        const order = orders.find(o => o.id === orderId);
        const nearestDriver = findNearestDriver(order as Order);
        
        if (nearestDriver) {
          updateData.driverId = nearestDriver.id;
          updateData.assignedDriverId = nearestDriver.id;
          
          // NOTIFICATION TO THE DRIVER
          await addDoc(collection(db, 'notifications'), {
            title_ar: 'شحنة بانتظار الاستلام 🚛',
            title_en: 'Shipment Waiting for Pickup 🚛',
            message_ar: `تم تعيينك لتوصيل الطلب #${orderId.slice(-6)} للعميل ${order?.customerName}`,
            message_en: `You have been assigned to deliver order #${orderId.slice(-6)} to customer ${order?.customerName}`,
            userId: nearestDriver.id, 
            type: 'dispatch',
            orderId,
            status: 'unread',
            createdAt: new Date().toISOString(),
            metadata: { sound: 'alert_new_dispatch' }
          });
          
          addToast(language === 'ar' ? `تم تخصيص المندوب ${nearestDriver.users?.full_name || ''} وإرسال إشعارات فورية للنظام` : `Driver ${nearestDriver.users?.full_name || ''} assigned and instant notices sent`, 'success');
        } else {
          addToast(language === 'ar' ? 'تم تجهيز الشحنة - بانتظار توفر أقرب مندوب' : 'Shipment ready - waiting for nearest driver to become online', 'info');
        }
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
      addToast(language === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated', 'success');
      
      // Integration with Advanced Accounting System
      if (status === 'shipped' || status === 'delivered') {
        api.syncToOnyx('order', orderId).then(() => {
          console.log(`💎 Accounting: Order ${orderId} synced to Onyx Pro`);
        }).catch(console.error);
      }

      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (err) {
      addToast(language === 'ar' ? 'فشل في التحديث' : 'Update failed', 'error');
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        assignedDriverId: driverId,
        status: 'shipped',
        shippedAt: new Date().toISOString()
      });
      console.log(`🚛 Manual Dispatch: Driver ${driverId} assigned to Order ${orderId}`);
      addToast(language === 'ar' ? 'تم تعيين السائق وإرسال الإشعار' : 'Driver assigned and notification sent', 'success');
    } catch (err) {
      addToast(language === 'ar' ? 'فشل تعيين السائق' : 'Driver assignment failed', 'error');
    }
  };

  const calculateDistance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2));
  };

  const findNearestDriver = (order: Order) => {
    if (!order.location || !drivers.length) return null;
    const availableDrivers = drivers.filter(d => d.status === 'online');
    if (availableDrivers.length === 0) return null;
    
    return availableDrivers.reduce((prev, curr) => {
      const prevDist = calculateDistance(order.location, prev.location || { lat: 0, lng: 0 });
      const currDist = calculateDistance(order.location, curr.location || { lat: 0, lng: 0 });
      return prevDist < currDist ? prev : curr;
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesBranch = selectedBranch === 'all' || String(order.branchId) === String(selectedBranch);
      const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [orders, selectedBranch, searchTerm]);

  const stats = {
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    preparing: filteredOrders.filter(o => o.status === 'preparing').length,
    ready: filteredOrders.filter(o => o.status === 'setup').length,
    shipped: filteredOrders.filter(o => o.status === 'shipped').length,
  };

  return (
    <div className="min-h-screen bg-primary-dark text-white p-6 md:p-10 font-tajawal animate-fade-in relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-secondary/5 blur-[150px] rounded-full pointer-events-none"></div>

      <main className="max-w-[1700px] mx-auto space-y-12 relative z-10">
        <header className="bg-primary-dark/60 backdrop-blur-2xl p-12 rounded-[4rem] border-2 border-white/5 shadow-sovereign flex flex-col xl:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-secondary/20 rounded-[2.5rem] flex items-center justify-center text-5xl border border-secondary/30 shadow-sovereign animate-pulse">
              📡
            </div>
            <div className="text-center xl:text-right">
              <h2 className="text-4xl md:text-6xl font-black text-white text-shadow-sovereign mb-2 uppercase tracking-tighter">مركز دلتا للتحكم اللوجستي</h2>
              <div className="flex items-center justify-center xl:justify-start gap-4 text-secondary font-bold text-sm tracking-widest">
                <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
                SOVEREIGN COMMAND & LOGISTICS CENTER (SCLC)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-white/5 p-2 rounded-[2.5rem] border border-white/10">
              {['orders', 'logistics', 'accounting'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-10 py-5 rounded-[2rem] font-black text-sm transition-all ${
                    activeTab === tab 
                      ? 'bg-secondary text-white shadow-sovereign scale-105' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'orders' ? 'الاستقبال والعمليات 📦' : 
                   tab === 'logistics' ? 'إدارة المناديب 🚛' : 'الرقابة المالية 💎'}
                </button>
              ))}
            </div>
            {onBack && (
              <button onClick={onBack} className="w-16 h-16 bg-red-600/20 text-red-500 rounded-3xl border border-red-500/30 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                <XIcon className="w-8 h-8" />
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="bg-primary/20 backdrop-blur-md p-10 rounded-[4rem] border border-white/5 shadow-2xl relative">
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
                  <h3 className="text-3xl font-black text-white text-shadow-sovereign flex items-center gap-4">
                    <span className="w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                    استقبال الطلبات
                  </h3>
                  <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black text-gray-500">{stats.pending} طلب جديد</span>
                </div>
                <div className="space-y-6 max-h-[850px] overflow-y-auto pr-2 scrollbar-hide">
                  {filteredOrders.filter(o => o.status === 'pending').map(order => (
                    <motion.div 
                      layout
                      key={order.id} 
                      className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:border-secondary transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className="bg-secondary/20 text-secondary text-[10px] font-black px-4 py-1 rounded-full">#{order.id.slice(-6)}</span>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(order.createdAt).toLocaleTimeString()}</p>
                           <p className="text-2xl font-black text-secondary mt-1">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                      <h4 className="text-xl font-black text-white mb-2">{order.customerName}</h4>
                      <p className="text-gray-400 text-xs font-bold line-clamp-1 mb-8">📍 {order.address}</p>
                      <div className="bg-black/20 p-6 rounded-2xl mb-8 border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">توقيت التوصيل المتوقع</p>
                           <span className="text-[10px] text-emerald-400 font-black">Standard: 4-8h</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                              <p className="text-[10px] text-gray-500 mb-1">الفرع الأقرب</p>
                              <p className="text-white font-black text-xs">Jeddah Main</p>
                           </div>
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                              <p className="text-[10px] text-gray-500 mb-1">المحاسبة</p>
                              <p className="text-secondary font-black text-xs flex items-center justify-center gap-1">
                                 <ShieldCheckIcon className="w-3 h-3" /> Onyx Sync
                              </p>
                           </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="w-full bg-blue-600/20 text-blue-400 py-5 rounded-2xl font-black text-base border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                      >
                        بدء التجهيز والفرز ⚡
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-md p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
                  <h3 className="text-3xl font-black text-white text-shadow-sovereign flex items-center gap-4">
                    <PackageIcon className="w-8 h-8 text-yellow-500" />
                    التجهيز والوزن
                  </h3>
                  <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black text-gray-500">{stats.preparing} قيد العمل</span>
                </div>
                <div className="space-y-6 max-h-[850px] overflow-y-auto pr-2 scrollbar-hide">
                  {filteredOrders.filter(o => o.status === 'preparing' || o.status === 'setup').map(order => (
                    <motion.div 
                      layout
                      key={order.id} 
                      className="bg-slate-700/30 p-8 rounded-[2.5rem] border-l-8 border-yellow-500 border-y border-r border-white/5"
                    >
                      <div className="flex justify-between items-center mb-6">
                         <span className="text-white font-black">#{order.id.slice(-6)}</span>
                         <span className="text-yellow-500 font-black text-[10px] flex items-center gap-2 animate-pulse">
                            <ClockIcon className="w-4 h-4" /> جاري التغليف المبرد
                         </span>
                      </div>
                      <h4 className="text-xl font-black text-white mb-6 leading-tight">{order.customerName}</h4>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                        className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-base shadow-xl hover:scale-105 transition-all"
                      >
                        جاهز للشحن الفوري ✅
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-md p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
                  <h3 className="text-3xl font-black text-white text-shadow-sovereign flex items-center gap-4">
                    <TruckIcon className="w-8 h-8 text-emerald-500" />
                    تحرك المناديب والشحن
                  </h3>
                  <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black text-gray-500">{stats.shipped} شحنة نشطة</span>
                </div>
                <div className="space-y-6 max-h-[850px] overflow-y-auto pr-2 scrollbar-hide">
                  {filteredOrders.filter(o => o.status === 'shipped').map(order => (
                    <motion.div 
                      layout
                      key={order.id} 
                      className="bg-slate-700/30 p-8 rounded-[2.5rem] border border-white/5"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className="font-black text-emerald-400 text-shadow-sovereign">خروج فوري #{order.id.slice(-6)}</span>
                        <div className="flex items-center gap-2">
                          <TruckIcon className="w-5 h-5 text-emerald-500 animate-bounce" />
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-black">جاري التحرك</span>
                        </div>
                      </div>
                      <div className="bg-black/20 p-6 rounded-2xl mb-8 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">المندوب القائم بالتوصيل (Auto-Assigned)</p>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500 font-black text-lg">
                              {order.driverId?.slice(0,1) || 'D'}
                           </div>
                           <p className="text-white font-black text-lg">{order.driverId || 'جاري ربط المندوب...'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        className="w-full bg-secondary text-white py-5 rounded-2xl font-black shadow-sovereign hover:scale-110 transition-all border-b-4 border-yellow-800"
                      >
                        تأكيد إتمام التوصيل والتحصيل 💎
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logistics' && (
            <motion.div
              key="logistics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="bg-slate-800/60 p-12 rounded-[4rem] border-2 border-white/5 shadow-sovereign">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-4xl font-black text-white text-shadow-sovereign">إدارة أسطول النقل المبرد 🚛</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(drivers || []).map(driver => (
                    <motion.div 
                      key={driver.id} 
                      className="bg-slate-700/30 p-8 rounded-[3rem] border border-white/5 hover:border-secondary transition-all relative overflow-hidden group"
                    >
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-secondary/10 rounded-[2.5rem] flex items-center justify-center text-4xl border border-secondary/20 shadow-inner group-hover:scale-110 transition-transform">
                          👤
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white leading-none mb-2">{driver.users?.full_name}</h4>
                          <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                             <PhoneIcon className="w-3 h-3" /> {driver.users?.phone}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm font-bold">
                           <span className="text-gray-500 font-black uppercase tracking-widest">نوع المركبة</span>
                           <span className="text-white">{driver.vehicle_type === 'truck' ? 'شاحنة مبردة' : 'سيارة نقل طازج'}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                           <span className="text-gray-500 font-black uppercase tracking-widest">رقم اللوحة</span>
                           <span className="text-secondary tracking-widest">{driver.vehicle_plate || '---'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-6">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase ${driver.status === 'online' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                          {driver.status === 'online' ? 'متاح الآن' : 'غير متصل'}
                        </span>
                        <button className="text-secondary font-black text-xs underline underline-offset-4 decoration-2">لوحة التحكم السريعة</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'accounting' && (
            <motion.div
              key="accounting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/60 p-12 rounded-[4rem] border-2 border-white/5 shadow-sovereign"
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <div>
                  <h3 className="text-4xl font-black text-white text-shadow-sovereign mb-2">النظام المحاسبي و Onyx Pro</h3>
                  <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">Real-time Financial Orchestration</p>
                </div>
                <div className="flex gap-6">
                  <div className="bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 text-center min-w-[200px]">
                    <p className="text-gray-400 font-black text-[10px] uppercase mb-2">مبيعات اليوم السيادية</p>
                    <h4 className="text-3xl font-black text-emerald-500">{formatCurrency(filteredOrders.reduce((sum, o) => sum + o.total, 0))}</h4>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden bg-black/20 rounded-[3rem] border border-white/5">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-white/5 text-gray-500 font-black text-xs uppercase tracking-widest">
                      <th className="py-8 px-10">الفاتورة / القيد</th>
                      <th>العميل</th>
                      <th>المبلغ</th>
                      <th>طريقة السداد</th>
                      <th>حالة Onyx Pro</th>
                      <th>المزامنة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 15).map(order => (
                      <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-8 px-10">
                          <div className="flex items-center gap-4">
                            <FileTextIcon className="w-5 h-5 text-secondary" />
                            <span className="font-black text-white">#{order.id.slice(-8)}</span>
                          </div>
                        </td>
                        <td className="font-bold text-gray-400">{order.customerName}</td>
                        <td className="font-black text-secondary">{formatCurrency(order.total)}</td>
                        <td className="font-bold text-gray-500">{order.paymentMethod || 'مدى / أبل باي'}</td>
                        <td>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${order.onyx_sync_status === 'synced' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {order.onyx_sync_status === 'synced' ? 'مكتمل (Synced)' : 'بانتظار الترحيل'}
                          </span>
                        </td>
                        <td>
                          <button className="p-3 bg-white/5 rounded-xl text-secondary hover:bg-secondary hover:text-white transition-all">
                            <RefreshCwIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
