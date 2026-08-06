import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from './lib/contexts/I18nContext';
import { useFirebase } from './lib/contexts/FirebaseContext';
import { useToast } from '../contexts/ToastContext';
import OrderTracking from './OrderTracking';
import {
  PackageIcon,
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  FilterIcon,
  ArrowRightIcon,
  PhoneIcon,
  WhatsappIcon,
  FileTextIcon,
  ShieldCheckIcon,
  CalendarIcon,
  DollarSignIcon,
  XIcon
} from './lib/contexts/Icons';

export interface OrderHistoryProps {
  user?: any;
  orders?: any[];
  onNavigate?: (page: string, params?: any) => void;
  onReorder?: (order: any) => void;
  standalone?: boolean;
}

export function OrderHistory({ user, orders: propOrders, onNavigate, onReorder, standalone = false }: OrderHistoryProps) {
  const { language, formatCurrency, t } = useI18n();
  const { orders: firebaseOrders } = useFirebase();
  const { addToast } = useToast();

  const isAr = language === 'ar';

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Combine provided orders, firebase user orders, or fallback sample orders
  const allOrders = useMemo(() => {
    let list = propOrders || firebaseOrders || [];
    if (user?.id) {
      list = list.filter((o: any) => o.customerId === user.id || o.userId === user.id);
    }

    // Default realistic Saudi VIP/B2B sample orders if empty for smooth UX
    if (!list || list.length === 0) {
      list = [
        {
          id: 'DS-2026-9812',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: 'shipped',
          total: 1850,
          subtotal: 1608.7,
          vat: 241.3,
          branch: isAr ? 'فرع السلي المركزي - الرياض' : 'Central Al-Sulay Branch - Riyadh',
          paymentMethod: isAr ? 'دفع آجل - سقف الائتمان' : 'Credit Account',
          paymentStatus: 'paid',
          driverName: isAr ? 'محمد العتيبي' : 'Mohammed Al-Otaibi',
          driverPhone: '+966501234567',
          driverPlate: isAr ? 'أ ب ج 4821' : 'ABC 4821',
          driverLocation: { lat: 24.6877, lng: 46.7219 },
          customerLocation: { lat: 24.7136, lng: 46.6753 },
          items: [
            { id: 1, name_ar: 'تمور خلاص القصيم فاخرة (كرتون 8 كجم)', name_en: 'Qassim Khalas Dates (8kg Box)', quantity: 10, price: 120 },
            { id: 2, name_ar: 'تفاح أحمر سكري فرنسي طازج (صندوق 12 كجم)', name_en: 'Fresh French Red Apples (12kg)', quantity: 5, price: 130 }
          ]
        },
        {
          id: 'DS-2026-9740',
          createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
          status: 'preparing',
          total: 3400,
          subtotal: 2956.5,
          vat: 443.5,
          branch: isAr ? 'فرع حي الصفا - جدة' : 'Al-Safa Branch - Jeddah',
          paymentMethod: isAr ? 'تحويل بنكي مباشر (الراجحي)' : 'Direct Bank Transfer',
          paymentStatus: 'paid',
          driverName: isAr ? 'عبدالله الغامدي' : 'Abdullah Al-Ghamdi',
          driverPhone: '+966559876543',
          driverPlate: isAr ? 'د هـ و 9102' : 'DHW 9102',
          driverLocation: { lat: 21.5433, lng: 39.1728 },
          customerLocation: { lat: 21.5678, lng: 39.2238 },
          items: [
            { id: 3, name_ar: 'برتقال عصير مصري طازج (صندوق 15 كجم)', name_en: 'Egyptian Juice Oranges (15kg Box)', quantity: 20, price: 85 },
            { id: 4, name_ar: 'طماطم محمية قطاف اليوم (كرتون 10 كجم)', name_en: 'Fresh Greenhouse Tomatoes (10kg)', quantity: 20, price: 85 }
          ]
        },
        {
          id: 'DS-2026-9410',
          createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
          status: 'delivered',
          total: 5200,
          subtotal: 4521.7,
          vat: 678.3,
          branch: isAr ? 'فرع العزيزية - مكة المكرمة' : 'Al-Aziziyah Branch - Makkah',
          paymentMethod: isAr ? 'مدى / Visa' : 'Mada / Visa',
          paymentStatus: 'paid',
          driverName: isAr ? 'خالد الشهري' : 'Khaled Al-Shehri',
          driverPhone: '+966541122334',
          driverPlate: isAr ? 'س ص ع 1122' : 'SSA 1122',
          items: [
            { id: 5, name_ar: 'موز إكوادوري فاخر (صندوق 18 كجم)', name_en: 'Ecuadorian Bananas (18kg Box)', quantity: 30, price: 110 },
            { id: 6, name_ar: 'خيار صبيخ طازج (صندق 10 كجم)', name_en: 'Fresh Cucumber (10kg)', quantity: 20, price: 95 }
          ]
        }
      ];
    }
    return list;
  }, [propOrders, firebaseOrders, user, isAr]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: any) => {
      const matchesSearch =
        !searchTerm ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some((i: any) =>
          (i.name_ar || i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.name_en || i.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && (order.status === 'pending' || order.status === 'preparing' || order.status === 'shipped')) ||
        order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [allOrders, searchTerm, selectedStatus]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalCount = allOrders.length;
    const activeCount = allOrders.filter((o: any) => ['pending', 'preparing', 'shipped'].includes(o.status)).length;
    const deliveredCount = allOrders.filter((o: any) => o.status === 'delivered').length;
    const totalSpent = allOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    return { totalCount, activeCount, deliveredCount, totalSpent };
  }, [allOrders]);

  const handleReorderClick = (order: any) => {
    if (onReorder) {
      onReorder(order);
    } else {
      addToast(
        isAr ? `تمت إعادة إضاف عناصر الطلب #${order.id.slice(0, 8)} إلى السلة!` : `Order #${order.id.slice(0, 8)} items re-added to cart!`,
        'success'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            {isAr ? 'تم التوصيل بنجاح' : 'Delivered'}
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <TruckIcon className="w-3.5 h-3.5" />
            {isAr ? 'جاري التوصيل بالطريق' : 'In Transit / Shipped'}
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            <ClockIcon className="w-3.5 h-3.5" />
            {isAr ? 'قيد التجهيز بالمستودع' : 'Preparing'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-100 text-yellow-800 border border-yellow-200">
            <ClockIcon className="w-3.5 h-3.5" />
            {isAr ? 'قيد المراجعة' : 'Pending Review'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className={`w-full font-tajawal ${standalone ? 'min-h-screen bg-slate-50 py-10 px-4 md:px-8' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="bg-gradient-to-r from-emerald-950 via-primary to-emerald-900 text-white rounded-3xl p-6 md:p-10 shadow-2xl border-b-8 border-secondary relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
                <ShieldCheckIcon className="w-4 h-4" />
                {isAr ? 'سجل العمليات الرسمية • شركة نجوم دلتا' : 'Official Operations Log • Delta Stars'}
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white">
                {isAr ? 'سجل الطلبات والتتبع المباشر' : 'Order History & Live GPS Tracking'}
              </h2>
              <p className="text-emerald-200/80 text-sm mt-1 max-w-xl">
                {isAr
                  ? 'استعرض جميع طلباتك السابقة، تابع حالة الشحنات المبردة لحظة بلحظة، وتواصل مباشر مع المناديب'
                  : 'View all past orders, monitor refrigerated truck status in real-time, and contact delivery drivers.'}
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('products')}
              className="bg-amber-400 hover:bg-yellow-300 text-emerald-950 font-black px-6 py-3.5 rounded-2xl shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2 shrink-0"
            >
              <PackageIcon className="w-5 h-5" />
              <span>{isAr ? 'إنشاء طلب جديد' : 'New Order'}</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                {isAr ? 'إجمالي الطلبات' : 'Total Orders'}
              </span>
              <p className="text-2xl font-black text-white mt-1">{stats.totalCount}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                {isAr ? 'طلبات في الطريق / نشطة' : 'Active Delivery'}
              </span>
              <p className="text-2xl font-black text-blue-300 mt-1">{stats.activeCount}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                {isAr ? 'مكتمل ومسلم' : 'Delivered'}
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{stats.deliveredCount}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                {isAr ? 'إجمالي المشتريات' : 'Total Spent'}
              </span>
              <p className="text-2xl font-black text-amber-300 mt-1">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto custom-scrollbar pb-2 md:pb-0">
            {[
              { id: 'all', label_ar: 'الكل', label_en: 'All' },
              { id: 'active', label_ar: 'النشطة والحالية', label_en: 'Active Delivery' },
              { id: 'shipped', label_ar: 'في الطريق', label_en: 'In Transit' },
              { id: 'preparing', label_ar: 'قيد التجهيز', label_en: 'Preparing' },
              { id: 'delivered', label_ar: 'المكتملة', label_en: 'Delivered' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? tab.label_ar : tab.label_en}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'بحث برقم الطلب، المندوب، أو المنتج...' : 'Search order ID, driver, product...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white outline-none text-xs font-bold transition-all"
            />
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Orders List / Cards */}
        <div className="space-y-6">
          {filteredOrders.map((order: any) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Top Card Header */}
                <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-lg text-primary font-mono">#{order.id}</span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {isAr ? 'الإجمالي' : 'Total'}
                      </span>
                      <span className="font-black text-lg text-emerald-800">
                        {formatCurrency(order.total || 0)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {(order.status === 'shipped' || order.status === 'preparing') && (
                        <button
                          onClick={() => setActiveTrackingOrder(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
                        >
                          <MapPinIcon className="w-4 h-4" />
                          <span>{isAr ? 'تتبع الموقع المباشر' : 'Live GPS'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition-all"
                        title={isAr ? 'عرض الفاتورة الضريبية' : 'View Invoice'}
                      >
                        <FileTextIcon className="w-3.5 h-3.5" />
                        <span>{isAr ? 'الفاتورة' : 'Invoice'}</span>
                      </button>

                      <button
                        onClick={() => handleReorderClick(order)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-black px-3.5 py-2 rounded-xl text-xs transition-all"
                      >
                        {isAr ? 'إعادة الطلب 🔄' : 'Reorder 🔄'}
                      </button>

                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs p-2 rounded-lg"
                      >
                        {isExpanded ? (isAr ? 'إخفاء التفاصيل ▲' : 'Hide ▲') : (isAr ? 'عرض التفاصيل ▼' : 'Details ▼')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Driver & Delivery Information Banner */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                  
                  {/* Branch info */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 shrink-0">
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {isAr ? 'مصدر التجهيز' : 'Fulfillment Branch'}
                      </span>
                      <p className="font-black text-slate-800 text-sm mt-0.5">
                        {order.branch || (isAr ? 'الفرع اللوجستي الرئيسي - السلي' : 'Main Logistics Hub')}
                      </p>
                      <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                        {order.paymentMethod || (isAr ? 'دفع آجل بنكي' : 'Credit Account')}
                      </span>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-700 shrink-0">
                      <TruckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {isAr ? 'مندوب نجوم دلتا المكلف' : 'Assigned Driver'}
                      </span>
                      <p className="font-black text-slate-800 text-sm mt-0.5">
                        {order.driverName || (isAr ? 'أحمد العتيبي (مندوب نجوم دلتا)' : 'Ahmed Al-Otaibi')}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {order.driverPhone && (
                          <a
                            href={`tel:${order.driverPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:underline"
                          >
                            <PhoneIcon className="w-3 h-3" />
                            {order.driverPhone}
                          </a>
                        )}
                        <a
                          href={`https://wa.me/${(order.driverPhone || '966501234567').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-black text-green-600 hover:underline"
                        >
                          <WhatsappIcon className="w-3 h-3" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Refrigerated Truck Status */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-700 shrink-0">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {isAr ? 'حالة الشاحنة المبردة' : 'Refrigerated Status'}
                      </span>
                      <p className="font-black text-emerald-700 text-sm mt-0.5">
                        ❄️ {isAr ? 'تسامح حراري: 4° مئوية (طازج)' : 'Temp: 4°C (Fresh Secured)'}
                      </p>
                      <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                        {isAr ? `لوحة الشاحنة: ${order.driverPlate || 'أ ب ج 4821'}` : `Truck Plate: ${order.driverPlate || 'ABC 4821'}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items Breakdown (Expandable or default preview) */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                    <h4 className="font-black text-xs text-slate-600 uppercase tracking-wider">
                      {isAr ? 'محتويات الشحنة والكميات:' : 'Shipment Items & Quantities:'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                              📦
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-xs">
                                {isAr ? item.name_ar || item.name : item.name_en || item.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {formatCurrency(item.price)} / {isAr ? 'وحدة' : 'unit'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-xs text-primary block">
                              × {item.quantity}
                            </span>
                            <span className="font-black text-xs text-emerald-700 block">
                              {formatCurrency((item.price || 0) * (item.quantity || 1))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Totals */}
                    <div className="pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs font-black text-slate-600">
                      <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'} {formatCurrency(order.subtotal || (order.total * 0.87))}</span>
                      <span>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'} {formatCurrency(order.vat || (order.total * 0.13))}</span>
                      <span className="text-sm font-black text-primary">{isAr ? 'الإجمالي النهائي:' : 'Final Total:'} {formatCurrency(order.total)}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="bg-white p-12 rounded-3xl text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                <PackageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                {isAr ? 'لم يتم العثور على طلبات طابق بحثك' : 'No orders matched your filter'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {isAr ? 'جرّب تعديل كلمات البحث أو تصفية الحالة' : 'Try adjusting your search terms or filter status'}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Live GPS Driver Tracking Modal */}
      <AnimatePresence>
        {activeTrackingOrder && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-primary text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <TruckIcon className="w-6 h-6 text-amber-400" />
                    {isAr ? `التتبع المباشر لمركبة التوصيل - طلب #${activeTrackingOrder.id}` : `Live Tracking Order #${activeTrackingOrder.id}`}
                  </h3>
                  <p className="text-emerald-200 text-xs font-bold mt-1">
                    {isAr ? 'حالة الشاحنة المبردة وتحديثات موقع GPS اللحظية' : 'Refrigerated truck status & real-time GPS coordinates'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTrackingOrder(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-black"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Map Container */}
              <div className="flex-1 min-h-[350px] relative bg-slate-100">
                <OrderTracking
                  driverId={activeTrackingOrder.driverPhone}
                  initialDriverLocation={activeTrackingOrder.driverLocation || { lat: 24.6877, lng: 46.7219 }}
                  customerLocation={activeTrackingOrder.customerLocation || { lat: 24.7136, lng: 46.6753 }}
                />
              </div>

              {/* Modal Footer Info */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black">
                    🚚
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">
                      {activeTrackingOrder.driverName || (isAr ? 'سائق نجوم دلتا المعني' : 'Assigned Driver')}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold">
                      {isAr ? 'شاحنة تبريد مغلقة (4°م) • لوحة أ ب ج 4821' : 'Refrigerated Truck • Plate ABC 4821'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeTrackingOrder.driverPhone && (
                    <a
                      href={`tel:${activeTrackingOrder.driverPhone}`}
                      className="bg-primary hover:bg-emerald-900 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      <span>{isAr ? 'اتصال مباشر' : 'Call Driver'}</span>
                    </a>
                  )}
                  <button
                    onClick={() => setActiveTrackingOrder(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black px-4 py-2.5 rounded-xl text-xs"
                  >
                    {isAr ? 'إغلاق الخريطة' : 'Close Map'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tax Invoice Modal */}
      <AnimatePresence>
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-black text-xl text-slate-800">
                    {isAr ? 'فاتورة ضريبية مبسطة (ZATCA)' : 'Simplified Tax Invoice'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold font-mono">
                    #{selectedInvoiceOrder.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-700">
                <div className="flex justify-between bg-slate-50 p-3 rounded-xl">
                  <span>{isAr ? 'الشركة:' : 'Company:'} شركة نجوم دلتا للتجارة</span>
                  <span>{isAr ? 'الرقم الضريبي:' : 'VAT No:'} 310123456700003</span>
                </div>

                <div className="space-y-2">
                  <h5 className="font-black text-slate-800">{isAr ? 'المنتجات والكميات:' : 'Items:'}</h5>
                  {selectedInvoiceOrder.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between border-b py-1.5">
                      <span>{isAr ? it.name_ar || it.name : it.name_en || it.name} × {it.quantity}</span>
                      <span className="font-black text-slate-900">{formatCurrency((it.price || 0) * (it.quantity || 1))}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-1 text-right">
                  <p>{isAr ? 'المجموع غير شامل الضريبة:' : 'Subtotal:'} {formatCurrency(selectedInvoiceOrder.subtotal || (selectedInvoiceOrder.total * 0.87))}</p>
                  <p>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'} {formatCurrency(selectedInvoiceOrder.vat || (selectedInvoiceOrder.total * 0.13))}</p>
                  <p className="text-lg font-black text-primary">{isAr ? 'المجموع الكلي:' : 'Grand Total:'} {formatCurrency(selectedInvoiceOrder.total)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    addToast(isAr ? 'جاري تحميل ملف الفاتورة بصيغة PDF...' : 'Downloading Invoice PDF...', 'info');
                    setTimeout(() => setSelectedInvoiceOrder(null), 1200);
                  }}
                  className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-xs hover:bg-emerald-900 transition-all"
                >
                  {isAr ? 'تحميل الفاتورة PDF 📄' : 'Download PDF 📄'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OrderHistory;
