import React, { useState, useEffect, useMemo } from 'react';
import { Order, Branch } from '../types';
import { useI18n, useFirebase, useToast } from './lib/contexts';
import { useNotifications } from '../contexts/NotificationContext';
import { DeliveryIcon, LocationMarkerIcon, QualityIcon, EyeIcon, XIcon, PrintIcon } from './lib/contexts/Icons';
import { BRANCH_LOCATIONS } from '../constants';

interface BranchOrdersViewProps {
    branchId: string;
    onBack: () => void;
}

export const BranchOrdersView: React.FC<BranchOrdersViewProps> = ({ branchId, onBack }) => {
    const { language, t } = useI18n();
    const { orders: allOrders, updateOrder, invoices: allInvoices } = useFirebase();
    const { sendNotification } = useNotifications();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'orders' | 'accounts'>('orders');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [lastOrderCount, setLastOrderCount] = useState(0);

    const branchName = useMemo(() => {
        const branch = BRANCH_LOCATIONS.find(b => b.id.toString() === branchId.toString());
        return branch ? (language === 'ar' ? branch.name_ar : branch.name_en) : branchId;
    }, [branchId, language]);

    const orders = useMemo(() => {
        return allOrders
            .filter(o => o.branchId?.toString() === branchId.toString())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allOrders, branchId]);

    const invoices = useMemo(() => {
        return allInvoices.filter(inv => inv.branchId?.toString() === branchId.toString());
    }, [allInvoices, branchId]);

    const branchStats = useMemo(() => {
        const branchOrders = allOrders.filter(o => o.branchId?.toString() === branchId.toString());
        const totalSales = branchOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingSales = branchOrders.filter(o => o.paymentStatus === 'pending').reduce((sum, o) => sum + (o.total || 0), 0);
        const deliveredCount = branchOrders.filter(o => o.status === 'delivered').length;
        return { totalSales, pendingSales, deliveredCount, totalCount: branchOrders.length };
    }, [allOrders, branchId]);

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    useEffect(() => {
        if (orders.length > lastOrderCount && lastOrderCount !== 0) {
            playNotificationSound();
            const latestOrder = orders[0];
            addToast(language === 'ar' ? 'طلب جديد وارد!' : 'New incoming order!', 'info');
            
            // Logic for real-time integrated notification
            sendNotification({
              userId: 'admin-broadcast', // Placeholder for broadcast or specific admin
              title: language === 'ar' ? `طلب جديد #${latestOrder.id.slice(-6)}` : `New Order #${latestOrder.id.slice(-6)}`,
              message: language === 'ar' ? `وصل طلب جديد بقيمة ${latestOrder.total} ر.س لفرع ${branchName}` : `New order for ${latestOrder.total} SAR at ${branchName}`,
              type: 'order',
              priority: 'high',
              targetRole: 'admin'
            });
        }
        setLastOrderCount(orders.length);
    }, [orders.length, lastOrderCount, language, addToast, sendNotification, branchName, orders]);

    const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
        try {
            await updateOrder(orderId, { status });
            addToast(language === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated', 'success');
            
            // Real-time update notification
            sendNotification({
                userId: 'admin-broadcast',
                title: language === 'ar' ? 'تحديث حالة الطلب' : 'Order Status Update',
                message: language === 'ar' ? `الطلب #${orderId.slice(-6)} انتقل للحالة: ${status}` : `Order #${orderId.slice(-6)} moved to: ${status}`,
                type: status === 'shipped' ? 'shipping' : 'order',
                priority: 'medium'
            });
        } catch (e) {
            addToast('Error updating status', 'error');
        }
    };

    return (
        <div className="space-y-6 md:space-y-12 animate-fade-in pb-24 text-black">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-10 rounded-2xl md:rounded-[4rem] shadow-xl border border-gray-100 gap-6">
                <div className="text-center md:text-right">
                    <h2 className="text-2xl md:text-4xl font-black text-primary mb-2">شاشة استقبال الطلبات</h2>
                    <p className="text-sm md:text-gray-400 font-bold flex items-center justify-center md:justify-start gap-2">
                        <span className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full animate-ping"></span>
                        رادار مباشر • {branchName}
                    </p>
                </div>
                <div className="flex bg-slate-100 p-2 rounded-2xl gap-2">
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
                    >
                        {language === 'ar' ? 'الطلبات الواردة' : 'Incoming Orders'}
                    </button>
                    <button 
                        onClick={() => setActiveTab('accounts')}
                        className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'accounts' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
                    >
                        {language === 'ar' ? 'الحسابات الإقليمية' : 'Regional Accounts'}
                    </button>
                </div>
                <button onClick={onBack} className="w-full md:w-auto bg-gray-100 text-gray-500 px-8 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[2rem] font-black hover:bg-red-500 hover:text-white transition-all">الرجوع</button>
            </div>

            {/* Regional Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl border-b-8 border-primary transform hover:scale-105 transition-all">
                    <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2">إجمالي مبيعات المنطقة</p>
                    <h4 className="text-2xl md:text-4xl font-black text-primary">{branchStats.totalSales.toFixed(2)} ر.س</h4>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl border-b-8 border-secondary transform hover:scale-105 transition-all">
                    <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2">مبالغ قيد التحصيل</p>
                    <h4 className="text-2xl md:text-4xl font-black text-secondary">{branchStats.pendingSales.toFixed(2)} ر.س</h4>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl border-b-8 border-emerald-500 transform hover:scale-105 transition-all">
                    <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2">طلبات تم تسليمها</p>
                    <h4 className="text-2xl md:text-4xl font-black text-emerald-600">{branchStats.deliveredCount}</h4>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl border-b-8 border-blue-500 transform hover:scale-105 transition-all">
                    <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2">إجمالي الطلبات</p>
                    <h4 className="text-2xl md:text-4xl font-black text-blue-600">{branchStats.totalCount}</h4>
                </div>
            </div>

            {activeTab === 'orders' ? (
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {orders.length === 0 ? (
                        <div className="bg-white p-10 md:p-20 rounded-2xl md:rounded-[4rem] text-center border-2 border-dashed border-gray-100">
                            <p className="text-xl md:text-2xl font-black text-gray-300 uppercase">لا توجد طلبات لهذا الفرع حالياً</p>
                        </div>
                    ) : (
                        (orders || []).map(order => (
                            <div key={order.id} className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[4rem] shadow-xl border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-6 md:gap-8 group hover:shadow-4xl transition-all">
                                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full">
                                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-3xl md:text-4xl shadow-2xl transform group-hover:rotate-12 transition-all flex-shrink-0 ${
                                        order.status === 'delivered' ? 'bg-emerald-500 text-white' : 
                                        order.status === 'pending' ? 'bg-amber-500 text-white animate-pulse' :
                                        order.status === 'preparing' ? 'bg-blue-500 text-white' :
                                        order.status === 'shipped' ? 'bg-orange-500 text-white' :
                                        'bg-primary text-white'
                                    }`}>
                                        {order.status === 'delivered' ? '✅' : 
                                         order.status === 'pending' ? '🔔' :
                                         order.status === 'preparing' ? '👨‍🍳' :
                                         order.status === 'shipped' ? '🚚' : '📦'}
                                    </div>
                                    <div className="text-center md:text-right flex-grow">
                                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-1">
                                            <h3 className="text-2xl md:text-3xl font-black text-slate-800">#{order.id.slice(-6)}</h3>
                                            <span className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                                                order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                                                order.status === 'shipped' ? 'bg-orange-100 text-orange-600' :
                                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="font-bold text-gray-400 text-base md:text-lg">{order.customerName}</p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 mt-3">
                                            <span className="text-[10px] md:text-xs font-black bg-slate-100 text-slate-500 px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full"></span>
                                                {order.paymentMethod}
                                            </span>
                                            <span className="text-[10px] md:text-xs font-black bg-secondary/10 text-secondary px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-secondary rounded-full"></span>
                                                {order.total} ر.س
                                            </span>
                                            <span className="text-[10px] md:text-xs font-bold text-gray-300 flex items-center gap-2">
                                                {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full xl:w-auto">
                                    <button 
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setIsOrderModalOpen(true);
                                        }}
                                        className="p-3 md:p-4 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl hover:bg-primary hover:text-white transition-all"
                                    >
                                        <EyeIcon className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                        className={`flex-grow md:flex-grow-0 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all ${
                                            order.status === 'preparing' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                    >
                                        تجهيز
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'setup')}
                                        className={`flex-grow md:flex-grow-0 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all ${
                                            order.status === 'setup' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
                                        }`}
                                    >
                                        إعداد
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                        className={`flex-grow md:flex-grow-0 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all ${
                                            order.status === 'shipped' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-600'
                                        }`}
                                    >
                                        شحن
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                        className={`flex-grow md:flex-grow-0 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all ${
                                            order.status === 'delivered' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                    >
                                        تسليم
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white p-6 md:p-12 rounded-2xl md:rounded-[4rem] shadow-2xl border border-gray-100 space-y-8">
                    <div className="flex justify-between items-center border-b pb-6">
                        <h3 className="text-2xl font-black text-primary">سجل الفواتير والعمليات المالية للفرع</h3>
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-black uppercase">إجمالي مبيعات الفرع</p>
                            <p className="text-xl font-black text-secondary">{branchStats.totalSales.toFixed(2)} ر.س</p>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[800px]">
                            <thead>
                                <tr className="text-gray-400 text-[10px] md:text-xs font-black border-b">
                                    <th className="pb-4">رقم الفاتورة</th>
                                    <th className="pb-4">العميل</th>
                                    <th className="pb-4">التاريخ</th>
                                    <th className="pb-4">المبلغ</th>
                                    <th className="pb-4">الحالة</th>
                                    <th className="pb-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-all">
                                        <td className="py-4 md:py-6 font-black text-primary">#{inv.id}</td>
                                        <td className="py-4 md:py-6 font-bold">{inv.customerName}</td>
                                        <td className="py-4 md:py-6 text-xs md:text-sm text-gray-400">{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                        <td className="py-4 md:py-6 font-black text-secondary">{inv.total.toFixed(2)} ر.س</td>
                                        <td className="py-4 md:py-6">
                                            <span className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {inv.status_ar}
                                            </span>
                                        </td>
                                        <td className="py-4 md:py-6">
                                            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all">
                                                <PrintIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-400 font-bold italic">لا توجد فواتير مسجلة لهذا الفرع حالياً</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {isOrderModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-10 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-6 md:p-12 border-b-2 border-gray-50 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
                            <div className="text-center md:text-right">
                                <h3 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tighter">تفاصيل الطلب #{selectedOrder.id.slice(-6)}</h3>
                                <p className="text-sm md:text-gray-400 font-bold mt-1">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</p>
                            </div>
                            <div className="flex gap-3 md:gap-4">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-black transition-all no-print"
                                >
                                    <PrintIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    طباعة
                                </button>
                                <button 
                                    onClick={() => setIsOrderModalOpen(false)}
                                    className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all group no-print"
                                >
                                    <XIcon className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-12 space-y-8 md:space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                <div className="space-y-3 md:space-y-4">
                                    <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">معلومات العميل</h4>
                                    <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100">
                                        <p className="text-lg md:text-xl font-black text-slate-800">{selectedOrder.customerName}</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-400 mt-1">ID: {selectedOrder.customerId}</p>
                                        <p className="text-xs md:text-sm font-bold text-primary mt-2">طريقة الدفع: {selectedOrder.paymentMethod}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">حالة الطلب</h4>
                                    <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <span className={`px-4 md:px-6 py-1 md:py-2 rounded-full font-black text-[10px] md:text-xs uppercase ${
                                            selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                            selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">محتويات الطلب</h4>
                                <div className="bg-white border-2 border-gray-100 rounded-xl md:rounded-[2rem] overflow-hidden overflow-x-auto">
                                    <table className="w-full text-right min-w-[500px]">
                                        <thead className="bg-slate-50 border-b border-gray-100">
                                            <tr>
                                                <th className="p-3 md:p-5 font-black text-primary text-[10px] md:text-xs uppercase">المنتج</th>
                                                <th className="p-3 md:p-5 font-black text-primary text-[10px] md:text-xs uppercase text-center">الكمية</th>
                                                <th className="p-3 md:p-5 font-black text-primary text-[10px] md:text-xs uppercase">السعر</th>
                                                <th className="p-3 md:p-5 font-black text-primary text-[10px] md:text-xs uppercase">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(selectedOrder.items || []).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-all">
                                                    <td className="p-3 md:p-5">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <img src={item.image} alt={item.name_ar} className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover shadow-sm" />
                                                            <div>
                                                                <p className="font-black text-sm md:text-base text-slate-800">{item.name_ar}</p>
                                                                <p className="text-[8px] md:text-[10px] font-bold text-gray-400">{item.unit_ar}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 md:p-5 text-center font-black text-sm md:text-base text-slate-600">x{item.quantity}</td>
                                                    <td className="p-3 md:p-5 font-bold text-sm md:text-base text-slate-600">{item.price} ر.س</td>
                                                    <td className="p-3 md:p-5 font-black text-sm md:text-base text-secondary">{(item.price * item.quantity).toFixed(2)} ر.س</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t-2 border-gray-100">
                                            <tr>
                                                <td colSpan={3} className="p-4 md:p-6 text-left font-black text-slate-400 uppercase tracking-widest text-xs md:text-sm">الإجمالي الكلي</td>
                                                <td className="p-4 md:p-6 font-black text-xl md:text-3xl text-secondary">{selectedOrder.total} ر.س</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-12 bg-slate-50 border-t-2 border-gray-100 flex flex-col md:flex-row justify-end gap-3 md:gap-4">
                            <button 
                                onClick={() => setIsOrderModalOpen(false)}
                                className="w-full md:w-auto px-8 md:px-10 py-3 md:py-4 bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl font-black text-sm md:text-slate-400 hover:bg-gray-100 transition-all"
                            >
                                إغلاق
                            </button>
                            <button 
                                onClick={() => {
                                    window.print();
                                }}
                                className="w-full md:w-auto px-8 md:px-10 py-3 md:py-4 bg-primary text-white rounded-xl md:rounded-2xl font-black shadow-xl hover:bg-secondary transition-all"
                            >
                                طباعة الفاتورة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
