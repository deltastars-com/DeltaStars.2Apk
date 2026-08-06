import React, { useState } from 'react';
import { useFirebase, useToast, useI18n } from './lib/contexts';
import { OrderAnalyticsCharts } from './OrderAnalyticsCharts';
import { 
  CheckCircleIcon, TrashIcon, EyeIcon, TruckIcon, FilterIcon,
  SearchIcon, MapPinIcon, PackageIcon, AlertCircleIcon, ArrowLeftIcon,
  RefreshCwIcon, NavigationIcon, PhoneIcon, RadarIcon, ActivityIcon,
  ShieldCheckIcon
} from './lib/contexts/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { BRANCH_LOCATIONS } from '../constants';
import { formatCurrency } from './lib/utils';
import { Order } from '../types';
import { LiveOrderConsole } from './LiveOrderConsole';
import { ConfirmationModal } from './ConfirmationModal';

interface OrderManagementSectionProps {
  orders: Order[];
  onViewOrder?: (order: Order) => void;
}

export const OrderManagementSection: React.FC<OrderManagementSectionProps> = ({ orders: initialOrders, onViewOrder }) => {
  const { updateOrder, deleteOrder, products, deliveryAgents, archivedOrders, archiveStats, runAutoArchive, restoreArchivedOrder } = useFirebase();
  const { addToast } = useToast();
  const { language } = useI18n();
  
  // Confirmation Modal States
  const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; newStatus: string; orderCode: string } | null>(null);
  const [pendingOrderDelete, setPendingOrderDelete] = useState<{ orderId: string; orderCode: string } | null>(null);

  // Outer tabs
  const [activeSubTab, setActiveSubTab] = useState<'realtime' | 'analytics' | 'all_orders' | 'archive' | 'routing'>('analytics');
  
  // Historical orders state
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [isArchivingLoading, setIsArchivingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Routing config states
  const [isAutoRoutingActive, setIsAutoRoutingActive] = useState(true);
  const [maxDistanceRadius, setMaxDistanceRadius] = useState<number>(25); // km
  const [branchStatus, setBranchStatus] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true
  });

  const filteredOrders = initialOrders?.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.customerPhone || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesBranch = selectedBranch === 'all' || order.branchId === selectedBranch;
    return matchesSearch && matchesStatus && matchesBranch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrder(orderId, { 
        status: newStatus as any,
        updatedAt: new Date().toISOString()
      });
      addToast(language === 'ar' ? `تم تحديث حالة الطلب إلى ${newStatus}` : `Order status updated to ${newStatus}`, 'success');
    } catch (error) {
      addToast(language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status', 'error');
    }
  };

  const handleAssignBranch = async (orderId: string, branchId: string) => {
    try {
      await updateOrder(orderId, { branchId });
      addToast(language === 'ar' ? 'تم تحويل الطلب للفرع المحدد بنجاح' : 'Order transferred to branch successfully', 'success');
    } catch (error) {
      addToast(language === 'ar' ? 'فشل تحويل الطلب للفرع' : 'Failed to transfer order', 'error');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast(language === 'ar' ? 'تم تحديث سجل الطلبات اللامركزية' : 'Order registry refreshed successfully', 'success');
    }, 1000);
  };

  const toggleBranchStatus = (id: number) => {
    setBranchStatus(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      addToast(
        language === 'ar' 
          ? `تم تحديث حالة الفرع ${BRANCH_LOCATIONS.find(b => b.id === id)?.name_ar} بمحرك التوجيه`
          : `Updated branch routing status`, 
        'info'
      );
      return updated;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 text-slate-800" dir="rtl">
      
      {/* Control Panel Header */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-slate-900 p-8 md:p-10 rounded-[3rem] shadow-sovereign text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden border-b-8 border-yellow-500">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
          <RadarIcon className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-yellow-500 text-slate-950 rounded-2xl font-black text-xs animate-pulse">LIVE OPERATIONAL RADAR</span>
            <span className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">Delta Stars Hub v8.4</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            {language === 'ar' ? 'مركز العمليات واللوجستيات السيادي' : 'Sovereign Operations & Logistics Center'}
          </h2>
          <p className="text-slate-300 font-bold text-xs">
            {language === 'ar' ? 'المراقبة الفورية للطلبات، التوزيع الجغرافي اللامركزي، وإدارة أساطيل المناديب ومخازن المملكة الستة' : 'Real-time order intake tracking, branch GPS allocations, and nationwide courier dispatches'}
          </p>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto relative z-10">
          <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/10 text-center">
            <p className="text-[9px] text-white/60 uppercase font-black">{language === 'ar' ? 'إجمالي طلبات النظام' : 'Global Orders Registry'}</p>
            <p className="text-3xl font-black text-yellow-400 mt-1">{initialOrders?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Controller Sub-Tabs */}
      <div className="flex flex-wrap gap-2 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => setActiveSubTab('analytics')}
          className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-gray-500 hover:bg-slate-100'}`}
        >
          <ActivityIcon className="w-4 h-4 text-slate-900" />
          {language === 'ar' ? 'الرسوم البيانية المتقدمة (Recharts)' : 'Analytics Charts (Recharts)'}
        </button>
        <button 
          onClick={() => setActiveSubTab('realtime')}
          className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === 'realtime' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
        >
          <RadarIcon className="w-4 h-4" />
          {language === 'ar' ? 'رادار البث والقبول اللحظي (مباشر)' : 'Real-time Radar Stream (Live)'}
        </button>
        <button 
          onClick={() => setActiveSubTab('all_orders')}
          className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === 'all_orders' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
        >
          <PackageIcon className="w-4 h-4" />
          {language === 'ar' ? 'سجل جميع طلبات المملكة' : 'Global Orders Register'}
        </button>
        <button 
          onClick={() => setActiveSubTab('archive')}
          className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === 'archive' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
        >
          <ShieldCheckIcon className="w-4 h-4 text-amber-300" />
          {language === 'ar' ? `أرشيف الطلبات 30+ يوم (${archivedOrders?.length || 0})` : `Order Archive 30+ Days (${archivedOrders?.length || 0})`}
        </button>
        <button 
          onClick={() => setActiveSubTab('routing')}
          className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === 'routing' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
        >
          <MapPinIcon className="w-4 h-4" />
          {language === 'ar' ? 'إعدادات التوجيه الجغرافي للفروع' : 'Branch GPS Routing Control'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Sub-Tab 0: Recharts Analytics Charts */}
        {activeSubTab === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <OrderAnalyticsCharts orders={initialOrders || []} language={language as 'ar' | 'en'} />
          </motion.div>
        )}
        
        {/* Sub-Tab 1: Real-time Live Radar Console */}
        {activeSubTab === 'realtime' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <LiveOrderConsole />
          </motion.div>
        )}

        {/* Sub-Tab 2: Historical Global Order Register */}
        {activeSubTab === 'all_orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Logic Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-md">
              <div className="relative group w-full md:w-80">
                <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="البحث برقم طلب، هاتف، أو اسم العميل..."
                  className="w-full pr-10 pl-6 py-3.5 bg-slate-50 border-none rounded-xl font-bold outline-none text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
                {(['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${filterStatus === status ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                  >
                    {status === 'all' ? 'الكل' : status === 'pending' ? '⏳ معلق' : status === 'preparing' ? '📦 قيد التجهيز' : status === 'shipped' ? '🚚 شحن' : status === 'delivered' ? '✅ اكتمل' : '❌ ملغي'}
                  </button>
                ))}
              </div>

              <div className="flex-grow" />
              
              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  className="bg-slate-50 border-none px-4 py-3.5 rounded-xl font-black text-xs outline-none cursor-pointer flex-grow md:flex-grow-0"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="all">كل فروع المملكة</option>
                  {BRANCH_LOCATIONS.map(b => (
                    <option key={b.id} value={b.id}>{language === 'ar' ? b.name_ar : b.name_en}</option>
                  ))}
                </select>
                
                <button 
                  onClick={handleRefresh}
                  className={`p-3.5 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                >
                  <RefreshCwIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[1000px] text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-white uppercase text-[9px] font-black tracking-widest text-center">
                      <th className="px-8 py-5">رقم الطلب</th>
                      <th>اسم العميل</th>
                      <th>القيمة النهائية</th>
                      <th>تاريخ الطلب</th>
                      <th>توجيه الفرع</th>
                      <th>حالة المعالجة</th>
                      <th className="pr-8 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold text-slate-700">
                    {filteredOrders?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-gray-400 font-bold">
                          لا يوجد طلبات تطابق معايير التصفية الحالية.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders?.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-all text-center">
                          <td className="px-8 py-5">
                            <span className="font-black text-primary font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</span>
                          </td>
                          <td className="py-5 text-right">
                            <div className="inline-block">
                              <p className="font-black text-slate-800 text-sm">{order.customerName || 'عميل المتجر VIP'}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{order.customerPhone}</p>
                            </div>
                          </td>
                          <td className="py-5 text-center">
                            <span className="text-sm font-black text-secondary">{formatCurrency(order.total)}</span>
                          </td>
                          <td className="py-5 text-center text-gray-400 text-[10px] font-bold">
                            {new Date(order.createdAt).toLocaleString('ar-SA')}
                          </td>
                          <td className="py-5 text-center">
                            <select 
                              value={order.branchId || ''}
                              onChange={(e) => handleAssignBranch(order.id, e.target.value)}
                              className="bg-slate-100 px-3 py-2 rounded-xl font-black text-[10px] border-none outline-none focus:ring-1 ring-primary cursor-pointer"
                            >
                              <option value="">توجيه يدوي للفرع</option>
                              {BRANCH_LOCATIONS.map(b => (
                                <option key={b.id} value={b.id}>{language === 'ar' ? b.name_ar : b.name_en}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-5 text-center">
                            <select
                              value={order.status}
                              onChange={(e) => {
                                const newStat = e.target.value;
                                if (newStat !== order.status) {
                                  setPendingStatusChange({
                                    orderId: order.id,
                                    newStatus: newStat,
                                    orderCode: '#' + order.id.slice(-8).toUpperCase()
                                  });
                                }
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 transition-all cursor-pointer ${
                                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                              }`}
                            >
                              <option value="pending">⏳ قيد الانتظار</option>
                              <option value="preparing">📦 قيد التجهيز</option>
                              <option value="shipped">🚚 تم الشحن والتحميل</option>
                              <option value="delivered">✅ اكتمل والتوصيل</option>
                              <option value="cancelled">❌ ملغي</option>
                            </select>
                          </td>
                          <td className="py-5 pr-8">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => onViewOrder ? onViewOrder(order) : setSelectedOrder(order)}
                                className="p-2.5 bg-white shadow-md rounded-xl text-primary hover:bg-primary hover:text-white transition-all border border-gray-100"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {order.status === 'shipped' && (
                                <button 
                                  onClick={() => window.open(`/tracking/${order.id}`, '_blank')}
                                  className="p-2.5 bg-white shadow-md rounded-xl text-secondary hover:bg-secondary hover:text-white transition-all border border-gray-100"
                                >
                                  <NavigationIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setPendingOrderDelete({
                                    orderId: order.id,
                                    orderCode: '#' + order.id.slice(-8).toUpperCase()
                                  });
                                }}
                                className="p-2.5 bg-white shadow-md rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-gray-100"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Tab 3: Intelligent Branch GPS Routing Control */}
        {activeSubTab === 'routing' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Master Auto-routing Toggle Card */}
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black">🗺️</div>
                  <h4 className="text-xl font-black text-primary">{language === 'ar' ? 'التوجيه الجغرافي اللامركزي التلقائي للفروع' : 'Automated Branch GPS Routing Protocol'}</h4>
                </div>
                <p className="text-gray-400 font-bold text-xs leading-relaxed">
                  {language === 'ar' 
                    ? 'عند تفعيل هذا النظام، يتولى المحرك مطابقة إحداثيات العميل مع أقرب فرع من فروع الشركة الستة آلياً وحساب قيمة التوصيل. إذا كان العميل خارج نطاق التغطية يرسل الطلب للمستودع الرئيسي كاحتياطي.'
                    : 'When active, incoming orders are automatically calculated against the company’s 6 regional hubs based on geodesic distance matrix and routed immediately to minimize cold chain delivery times.'}
                </p>
                <div className="flex items-center gap-6 pt-2">
                  <span className="text-xs font-black text-gray-500">{language === 'ar' ? 'أقصى قطر للتوصيل من الفرع:' : 'Max Delivery Radius:'}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={maxDistanceRadius}
                      onChange={(e) => setMaxDistanceRadius(Number(e.target.value))}
                      className="accent-primary cursor-pointer w-40"
                    />
                    <span className="text-sm font-black text-primary font-mono">{maxDistanceRadius} كم</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${isAutoRoutingActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                  {isAutoRoutingActive ? (language === 'ar' ? 'التوجيه الآلي نشط الآن 🟢' : 'Live Auto Routing Active') : (language === 'ar' ? 'مغلق ومقيد يدوياً' : 'Manual Assignment Only')}
                </span>
                <button 
                  onClick={() => {
                    setIsAutoRoutingActive(!isAutoRoutingActive);
                    addToast(
                      isAutoRoutingActive 
                        ? (language === 'ar' ? 'تم تحويل النظام للتوجيه اليدوي الكامل' : 'Switched to fully manual branch assignment')
                        : (language === 'ar' ? '✓ تم تنشيط خادم التوجيه الذكي عبر الكيلومترات' : '✓ Auto routing server activated successfully'), 
                      isAutoRoutingActive ? 'info' : 'success'
                    );
                  }}
                  className={`w-full py-4 rounded-xl font-black text-xs shadow-md transition-all ${isAutoRoutingActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-secondary text-white'}`}
                >
                  {isAutoRoutingActive ? (language === 'ar' ? 'تعطيل التوجيه التلقائي ✕' : 'Deactivate Auto-Routing ✕') : (language === 'ar' ? 'تنشيط التوجيه التلقائي ⚡' : 'Activate Auto-Routing ⚡')}
                </button>
              </div>
            </div>

            {/* KSA 6 Corporate Branches Monitor */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-primary px-4">{language === 'ar' ? 'رصد حالة جهوزية فروع ومستودعات المملكة' : 'KSA Branch & Warehouse Operational Status'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {BRANCH_LOCATIONS.map(branch => {
                  const isActive = branchStatus[branch.id];
                  return (
                    <div key={branch.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-md flex flex-col justify-between space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-800 text-base">{language === 'ar' ? branch.name_ar : branch.name_en}</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">{language === 'ar' ? branch.address_ar : branch.address_en}</p>
                        </div>
                        <span className={`w-3.5 h-3.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500'} animate-pulse`} />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-[10px] font-bold text-gray-500">
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'معدل الانتظار بالفرع:' : 'Avg Prep Delay:'}</span>
                          <span className="text-slate-800 font-black">12 دقيقة</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'المناديب المتصلين:' : 'Active Couriers:'}</span>
                          <span className="text-slate-800 font-black">8 مناديب</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'الإحداثيات الجغرافية:' : 'Coordinates:'}</span>
                          <span className="text-slate-800 font-mono">{branch.lat.toFixed(4)}, {branch.lng.toFixed(4)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => toggleBranchStatus(branch.id)}
                        className={`w-full py-3 rounded-xl font-black text-[10px] transition-all border ${isActive ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100' : 'bg-red-50 text-red-500 border-red-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                      >
                        {isActive ? (language === 'ar' ? 'حالة العمل: متصل ونشط ✓' : 'Status: Accepting Orders ✓') : (language === 'ar' ? 'حالة العمل: مغلق ✕' : 'Status: Offline ✕')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Tab 4: Automated Order Archive Dashboard (30+ Days) */}
        {activeSubTab === 'archive' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Archive Summary Header */}
            <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 p-8 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-amber-500 space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-xl uppercase tracking-widest">ARCHIVE & STORAGE OPTIMIZER</span>
                    <span className="text-xs text-amber-200/80 font-bold">Delta Stars Cloud DB v8.4</span>
                  </div>
                  <h3 className="text-3xl font-black text-amber-100">
                    {language === 'ar' ? 'نظام أرشفة الطلبات المكتملة (30+ يوم)' : '30+ Days Order Archive Console'}
                  </h3>
                  <p className="text-xs text-amber-200/70 font-medium max-w-2xl mt-1">
                    {language === 'ar' 
                      ? 'يقوم هذا النظام التلقائي بترحيل جميع الطلبات المكتملة أو الملغاة التي يتجاوز عمرها 30 يوماً إلى قاعدة الأرشيف الثانوية. يضمن ذلك تخفيف الضغط على قاعدة البيانات الرئيسية وسرعة استجابة التطبيق 100%.' 
                      : 'Automatically archives completed orders older than 30 days into secondary archive storage to keep the primary database lean and responsive.'}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setIsArchivingLoading(true);
                    const res = await runAutoArchive(30);
                    setIsArchivingLoading(false);
                    if (res.archivedCount > 0) {
                      addToast(language === 'ar' ? `تم أرشفة ${res.archivedCount} طلب بنجاح!` : `Archived ${res.archivedCount} orders!`, 'success');
                    } else {
                      addToast(language === 'ar' ? 'جميع الطلبات القديمة مأرشفة بالفعل' : 'All eligible orders are already archived', 'info');
                    }
                  }}
                  disabled={isArchivingLoading}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-xl transition-all flex items-center gap-3 whitespace-nowrap active:scale-95 disabled:opacity-50"
                >
                  <RefreshCwIcon className={`w-5 h-5 ${isArchivingLoading ? 'animate-spin' : ''}`} />
                  {isArchivingLoading 
                    ? (language === 'ar' ? 'جاري الفحص والأرشفة...' : 'Archiving...') 
                    : (language === 'ar' ? 'تشغيل الأرشفة التلقائية الآن' : 'Run Auto-Archive Now')}
                </button>
              </div>

              {/* Archive Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-amber-500/20">
                <div className="bg-amber-950/50 p-4 rounded-2xl border border-amber-500/30">
                  <p className="text-[10px] font-black text-amber-300 uppercase">{language === 'ar' ? 'إجمالي الطلبات المأرشفة' : 'Archived Orders'}</p>
                  <p className="text-2xl font-black text-amber-100 mt-1">{archiveStats.totalArchivedCount}</p>
                </div>
                <div className="bg-amber-950/50 p-4 rounded-2xl border border-amber-500/30">
                  <p className="text-[10px] font-black text-amber-300 uppercase">{language === 'ar' ? 'قيمة المبيعات المأرشفة' : 'Archived Sales'}</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(archiveStats.totalArchivedRevenue)}</p>
                </div>
                <div className="bg-amber-950/50 p-4 rounded-2xl border border-amber-500/30">
                  <p className="text-[10px] font-black text-amber-300 uppercase">{language === 'ar' ? 'المساحة المحررة بالداتابيز' : 'Database Space Saved'}</p>
                  <p className="text-2xl font-black text-cyan-300 mt-1">~{archiveStats.databaseSpaceSavedKB} KB</p>
                </div>
                <div className="bg-amber-950/50 p-4 rounded-2xl border border-amber-500/30">
                  <p className="text-[10px] font-black text-amber-300 uppercase">{language === 'ar' ? 'آخر عملية أرشفة' : 'Last Archive Date'}</p>
                  <p className="text-xs font-bold text-amber-200 mt-2 truncate">
                    {archiveStats.lastArchivedAt ? new Date(archiveStats.lastArchivedAt).toLocaleDateString('ar-SA') : (language === 'ar' ? 'تلقائية مستمرة' : 'Continuous Auto')}
                  </p>
                </div>
              </div>
            </div>

            {/* Archived Orders Table */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <PackageIcon className="w-6 h-6 text-amber-600" />
                  {language === 'ar' ? 'سجل الطلبات المؤرشفة بفرع الأرشيف' : 'Archived Orders Vault'}
                </h4>

                <div className="relative w-full md:w-80">
                  <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'البحث في الأرشيف...' : 'Search archive...'}
                    value={archiveSearchTerm}
                    onChange={(e) => setArchiveSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-6 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none border border-gray-100"
                  />
                </div>
              </div>

              {(!archivedOrders || archivedOrders.length === 0) ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <ShieldCheckIcon className="w-16 h-16 text-amber-400 mx-auto mb-4 opacity-50" />
                  <p className="font-black text-slate-700 text-lg">
                    {language === 'ar' ? 'لا توجد طلبات مؤرشفة حالياً' : 'No archived orders found'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto font-medium">
                    {language === 'ar' ? 'يتم أرشفة الطلبات المكتملة تلقائياً عندما يتجاوز تاريخ إنشائها 30 يوماً.' : 'Completed orders are automatically moved here after 30 days.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black border-b border-gray-100">
                      <tr>
                        <th className="p-4">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</th>
                        <th className="p-4">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th className="p-4">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        <th className="p-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="p-4">{language === 'ar' ? 'تاريخ الطلب' : 'Order Date'}</th>
                        <th className="p-4">{language === 'ar' ? 'تاريخ الأرشفة' : 'Archived At'}</th>
                        <th className="p-4 text-center">{language === 'ar' ? 'الإجراء' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-slate-700">
                      {archivedOrders
                        .filter(o => 
                          o.id.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
                          (o.customerName || '').toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
                          (o.customerPhone || '').includes(archiveSearchTerm)
                        )
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-amber-50/30 transition-all">
                            <td className="p-4 font-mono font-black text-amber-800">#{order.id.toUpperCase()}</td>
                            <td className="p-4">
                              <p className="font-black text-slate-900">{order.customerName || 'عميل المتجر'}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{order.customerPhone}</p>
                            </td>
                            <td className="p-4 font-black text-emerald-600">{formatCurrency(order.total)}</td>
                            <td className="p-4">
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                                {order.status === 'delivered' || order.status === 'completed' ? '✅ مكتمل' : order.status}
                              </span>
                            </td>
                            <td className="p-4 text-[11px] text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="p-4 text-[11px] text-amber-700 font-mono">
                              {order.archivedAt ? new Date(order.archivedAt).toLocaleDateString('ar-SA') : 'تلقائي'}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={async () => {
                                  await restoreArchivedOrder(order.id);
                                  addToast(language === 'ar' ? 'تم استعادة الطلب إلى السجل النشط' : 'Order restored to active registry', 'success');
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 font-black text-[10px] rounded-xl transition-all shadow-sm"
                              >
                                {language === 'ar' ? '🔄 استعادة للنشطة' : 'Restore'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Details Side Panel Logic / Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               className="bg-white w-full max-w-lg h-full ml-auto shadow-4xl p-10 overflow-y-auto"
            >
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-slate-800">{language === 'ar' ? 'تفاصيل الطلب' : 'Order Specifics'}</h3>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-gray-100 mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'الرقم المرجعي والباركود' : 'Voucher Serial'}</p>
                  <p className="text-xl font-black text-primary font-mono">#{selectedOrder.id.toUpperCase()}</p>
               </div>

               <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, idx: number) => {
                    const product = products.find(p => p.id === item.productId || p.id === item.id);
                    return (
                      <div key={idx} className="flex gap-4 items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <img src={product?.image} className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm" alt={product?.name_ar || product?.name_en || "صورة صنف الطلب"} />
                        <div className="flex-grow overflow-hidden">
                          <p className="font-black text-slate-800 text-sm truncate">{language === 'ar' ? product?.name_ar : product?.name_en}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{item.quantity} {language === 'ar' ? product?.unit_ar : product?.unit_en}</p>
                        </div>
                        <p className="font-black text-primary shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    );
                  })}
               </div>

               <div className="mt-10 pt-10 border-t-2 border-slate-50 space-y-4">
                  <div className="flex justify-between font-black text-slate-500">
                    <span>{language === 'ar' ? 'الإجمالي الفرعي قبل الخصومات:' : 'Pre-discount total:'}</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between font-black text-secondary text-2xl">
                    <span>{language === 'ar' ? 'صافي قيمة الفاتورة:' : 'Invoice Net Due:'}</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
               </div>

               <button 
                  onClick={() => {
                    window.open(`/tracking/${selectedOrder.id}`, '_blank');
                    setSelectedOrder(null);
                  }}
                  className="w-full mt-10 bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-xl"
               >
                 <TruckIcon className="w-6 h-6" /> {language === 'ar' ? 'تتبع الشحنة المباشر عبر GPS' : 'Track live GPS courier'}
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Order Status Change */}
      <ConfirmationModal
        isOpen={!!pendingStatusChange}
        onClose={() => setPendingStatusChange(null)}
        type="status_change"
        title="تأكيد تغيير حالة الطلب"
        message={`هل أنت متأكد من تغيير حالة الطلب ${pendingStatusChange?.orderCode || ''} في النظام والتحويل فوراً؟`}
        itemDetails={pendingStatusChange ? [
          { label: 'الطلب المرجعي', value: pendingStatusChange.orderCode },
          { label: 'الحالة الجديدة', value: pendingStatusChange.newStatus === 'delivered' ? '✅ اكتمل والتوصيل' : pendingStatusChange.newStatus === 'cancelled' ? '❌ ملغي' : pendingStatusChange.newStatus === 'shipped' ? '🚚 تم الشحن' : pendingStatusChange.newStatus }
        ] : []}
        confirmText="تأكيد تحديث الحالة"
        onConfirm={async () => {
          if (pendingStatusChange) {
            await handleStatusChange(pendingStatusChange.orderId, pendingStatusChange.newStatus);
            setPendingStatusChange(null);
          }
        }}
      />

      {/* Confirmation Modal for Order Deletion */}
      <ConfirmationModal
        isOpen={!!pendingOrderDelete}
        onClose={() => setPendingOrderDelete(null)}
        type="delete"
        title="تأكيد حذف سجل الطلب"
        message={`هل أنت متأكد من حذف الطلب ${pendingOrderDelete?.orderCode || ''} بشكل نهائي من قاعدة بيانات النظام؟`}
        itemDetails={pendingOrderDelete ? [
          { label: 'الرمز المرجعي', value: pendingOrderDelete.orderCode }
        ] : []}
        confirmText="تأكيد الحذف النهائي"
        onConfirm={async () => {
          if (pendingOrderDelete) {
            await deleteOrder(pendingOrderDelete.orderId);
            addToast(language === 'ar' ? 'تم حذف سجل الطلب بنجاح' : 'Order record deleted', 'info');
            setPendingOrderDelete(null);
          }
        }}
      />
    </div>
  );
};
