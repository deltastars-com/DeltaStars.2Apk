import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useI18n } from './lib/contexts/I18nContext';
import { Product, StockMovement, Invoice, Order } from '../types';
import { ChartBarIcon, PlusIcon, TrashIcon, PencilIcon, SparklesIcon, DocumentTextIcon, PackageIcon, TruckIcon, CheckCircleIcon, ClockIcon, MapPinIcon } from './lib/contexts/Icons';
import { useFirebase } from './lib/contexts/FirebaseContext';
import { motion, AnimatePresence } from 'framer-motion';

interface WarehouseViewProps {
    products: Product[];
    orders: Order[];
    onUpdateStock: (productId: number, newQuantity: number) => void;
    onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
    onAddBulkProducts?: (products: Product[]) => void;
    onBack: () => void;
    invoices: Invoice[];
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ 
    products = [], 
    orders = [], 
    onUpdateStock = (productId: number, newQuantity: number) => {}, 
    onUpdateOrderStatus = (orderId: string, status: Order['status']) => {}, 
    onBack = () => {}, 
    invoices = [] 
}) => {
    const { t, language, formatCurrency } = useI18n();
    const { notifications = [] } = useFirebase();
    const [searchTerm, setSearchTerm] = useState('');
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
    const [showRadar, setShowRadar] = useState<string | null>(null);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastNotificationId = useRef<string | null>(null);

    // Audio Alert for New Orders
    useEffect(() => {
        const latestNotif = notifications[0];
        if (latestNotif && latestNotif.type === 'order' && latestNotif.id !== lastNotificationId.current) {
            if (latestNotif.message_ar.includes('استلام طلب جديد')) {
                audioRef.current?.play().catch(e => console.warn('Audio play failed:', e));
            }
            lastNotificationId.current = latestNotif.id;
        }
    }, [notifications]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            (language === 'ar' ? p.name_ar : p.name_en).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm, language]);

    const pendingOrders = useMemo(() => {
        return orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'setup');
    }, [orders]);

    const handleStockAdjustment = (productId: number, amount: number, type: 'IN' | 'OUT') => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newQty = type === 'IN' ? product.stock_quantity + amount : product.stock_quantity - amount;
        onUpdateStock(productId, newQty);
        
        const movement: StockMovement = {
            id: Date.now().toString(),
            productId,
            type,
            quantity: amount,
            reason: type === 'IN' ? 'توريد بضاعة جديدة' : 'مبيعات / صرف مخزني',
            date: new Date().toISOString(),
            user: 'Admin/Developer'
        };
        setMovements([movement, ...movements].slice(0, 20));
    };

    return (
        <div className="space-y-12 animate-fade-in-up">
            {/* Audio Alert Element */}
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

            {/* Header Dashboard */}
            <div className="bg-slate-900 text-white p-12 rounded-[4.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border-b-[20px] border-secondary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-3xl rounded-full"></div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-24 h-24 bg-secondary/20 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner border border-white/10">📦</div>
                    <div>
                        <h2 className="text-6xl font-black uppercase tracking-tighter">Delta Logistics WMS</h2>
                        <p className="text-xl font-bold opacity-70">إدارة المستودعات الذكية والتحكم في المخزون</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="flex bg-white/10 p-2 rounded-2xl gap-2">
                        <button 
                            onClick={() => setActiveTab('inventory')}
                            className={`px-8 py-3 rounded-xl font-black transition-all ${activeTab === 'inventory' ? 'bg-secondary text-white shadow-lg' : 'hover:bg-white/5'}`}
                        >
                            المخزون
                        </button>
                        <button 
                            onClick={() => setActiveTab('orders')}
                            className={`px-8 py-3 rounded-xl font-black transition-all ${activeTab === 'orders' ? 'bg-secondary text-white shadow-lg' : 'hover:bg-white/5'}`}
                        >
                            تجهيز الطلبات ({pendingOrders.length})
                        </button>
                    </div>
                    <button onClick={onBack} className="bg-red-600 hover:bg-red-700 px-10 py-5 rounded-3xl font-black text-xl shadow-xl transition-all">إغلاق النظام</button>
                </div>
            </div>

            {activeTab === 'inventory' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-black">
                    {/* Product Inventory Table */}
                    <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-slate-800">جرد المخزون الفعلي</h3>
                            <div className="relative w-80">
                                <input 
                                    type="text" 
                                    placeholder="بحث في المستودعات..." 
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-8 py-4 font-bold focus:border-primary outline-none transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-right" dir="rtl">
                                <thead>
                                    <tr className="text-gray-400 border-b">
                                        <th className="p-4 font-black text-xs uppercase tracking-widest">المنتج</th>
                                        <th className="p-4 font-black text-xs uppercase tracking-widest">المخزون</th>
                                        <th className="p-4 font-black text-xs uppercase tracking-widest">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-6">
                                                    <img src={p.image} alt={p.name_ar || p.name_en || "صورة المخزون"} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                                                    <p className="font-black text-lg text-slate-800">{language === 'ar' ? p.name_ar : p.name_en}</p>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-6 py-2 rounded-2xl font-black text-lg ${p.stock_quantity <= p.min_threshold ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                                    {p.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-4">
                                                    <button onClick={() => handleStockAdjustment(p.id, 50, 'IN')} className="bg-green-500 text-white w-10 h-10 rounded-xl font-black">+</button>
                                                    <button onClick={() => handleStockAdjustment(p.id, 50, 'OUT')} className="bg-slate-200 text-slate-700 w-10 h-10 rounded-xl font-black">-</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 text-black">
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-slate-800">كنترول استقبال وتجهيز الطلبات</h3>
                            <div className="flex gap-4">
                                <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5" />
                                    قيد التجهيز: {pendingOrders.filter(o => o.status === 'preparing').length}
                                </div>
                                <div className="bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2">
                                    <PackageIcon className="w-5 h-5" />
                                    بانتظار الاستلام: {pendingOrders.filter(o => o.status === 'pending').length}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {pendingOrders.map(order => (
                                <div key={order.id} className="bg-slate-50 p-8 rounded-[3rem] border-2 border-transparent hover:border-primary transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800">#{order.id.slice(-6)}</h4>
                                            <p className="text-sm font-bold text-gray-400">{new Date(order.createdAt).toLocaleTimeString('ar-SA')}</p>
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                                            order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                                            'bg-indigo-100 text-indigo-600'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.image} alt={item.name_ar || item.name_en || "صورة صنف الطلب"} className="w-10 h-10 rounded-lg object-cover" />
                                                    <span className="font-black text-sm">{language === 'ar' ? item.name_ar : item.name_en}</span>
                                                </div>
                                                <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-xs">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        {order.status === 'pending' && (
                                            <button 
                                                onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <ClockIcon className="w-5 h-5" />
                                                بدء التجهيز
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button 
                                                onClick={() => onUpdateOrderStatus(order.id, 'setup')}
                                                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <PackageIcon className="w-5 h-5" />
                                                جاهز للشحن
                                            </button>
                                        )}
                                        {order.status === 'setup' && (
                                            <button 
                                                onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                                                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <TruckIcon className="w-5 h-5" />
                                                تم الشحن
                                            </button>
                                        )}
                                        {order.status === 'shipped' && (
                                            <button 
                                                onClick={() => setShowRadar(order.id)}
                                                className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <MapPinIcon className="w-5 h-5 text-secondary" />
                                                تتبع (FleetRadar)
                                            </button>
                                        )}
                                    </div>

                                    {/* FleetRadar Modal Mockup */}
                                    <AnimatePresence>
                                        {showRadar === order.id && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                                            >
                                                <motion.div 
                                                    initial={{ scale: 0.9, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl"
                                                >
                                                    <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-2xl font-black">FleetRadar - تتبع حي للمندوب</h3>
                                                            <p className="text-sm opacity-60">طلب رقم: {order.id}</p>
                                                        </div>
                                                        <button onClick={() => setShowRadar(null)} className="text-4xl font-light hover:text-secondary transition-colors">&times;</button>
                                                    </div>
                                                    <div className="h-[500px] bg-slate-100 relative">
                                                        {/* Mock Map Background */}
                                                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 grayscale"></div>
                                                        
                                                        {/* Animated Driver Marker */}
                                                        <motion.div 
                                                            animate={{ 
                                                                x: [100, 200, 150, 300],
                                                                y: [100, 150, 250, 200]
                                                            }}
                                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                            className="absolute z-10"
                                                        >
                                                            <div className="relative">
                                                                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
                                                                    <TruckIcon className="w-6 h-6 text-white" />
                                                                </div>
                                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                                                                    <p className="text-[10px] font-black text-slate-800">مندوب التوصيل: أحمد</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>

                                                        {/* Destination Marker */}
                                                        <div className="absolute top-[200px] left-[400px]">
                                                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                                                                <MapPinIcon className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                                                                <p className="text-[10px] font-black text-slate-800">موقع العميل</p>
                                                            </div>
                                                        </div>

                                                        {/* Radar Overlay */}
                                                        <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur p-6 rounded-3xl shadow-xl border border-gray-100 w-64">
                                                            <h5 className="font-black text-sm mb-4 border-b pb-2">بيانات الرحلة</h5>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-gray-400 font-bold">المسافة المتبقية:</span>
                                                                    <span className="font-black">4.2 كم</span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-gray-400 font-bold">الوقت المتوقع:</span>
                                                                    <span className="font-black text-secondary">12 دقيقة</span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-gray-400 font-bold">درجة حرارة الحاوية:</span>
                                                                    <span className="font-black text-blue-600">4° مئوية</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                        <CheckCircleIcon className="w-12 h-12" />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-300">لا توجد طلبات بانتظار التجهيز</h4>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
