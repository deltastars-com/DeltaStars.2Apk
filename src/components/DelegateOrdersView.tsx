import React, { useState, useMemo } from 'react';
import { Order, User, Branch } from '../types';
import { useI18n, useFirebase, useToast } from './lib/contexts';
import { DeliveryIcon, LocationMarkerIcon, QualityIcon, EyeIcon, XIcon, ChartBarIcon } from './lib/contexts/Icons';

interface DelegateOrdersViewProps {
    user: User | null;
    onBack: () => void;
}

export const DelegateOrdersView: React.FC<DelegateOrdersViewProps> = ({ user, onBack }) => {
    const { language, t, formatCurrency } = useI18n();
    const { orders: allOrders, updateOrder } = useFirebase();
    const { addToast } = useToast();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');

    const isDelegate = user?.type === 'delegate';
    const isAdminOrDev = user?.type === 'admin' || user?.type === 'developer' || user?.type === 'gm';
    const branchId = isDelegate ? user?.assignedBranchId : (user?.assignedBranchId || localStorage.getItem('delegate-branch-id'));

    const orders = useMemo(() => {
        if (!branchId) return [];
        return allOrders
            .filter(o => o.branchId === branchId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allOrders, branchId]);

    const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
        try {
            await updateOrder(orderId, { 
                status,
                updatedAt: new Date().toISOString()
            } as any);
            addToast(language === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated successfully', 'success');
        } catch (e) {
            addToast('Error updating status', 'error');
        }
    };

    const filteredOrders = filterStatus === 'all' 
        ? orders 
        : orders.filter(o => o.status === filterStatus);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    if (!branchId) {
        return (
            <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-gray-100 text-center animate-fade-in">
                <div className="text-8xl mb-8">📍</div>
                <h2 className="text-4xl font-black text-primary mb-4">
                    {isDelegate ? 'تنبيه: لم يتم تعيين فرع لك' : 'تنبيه: لم يتم تحديد فرع'}
                </h2>
                <p className="text-gray-400 font-bold mb-8">
                    {isDelegate 
                        ? 'يرجى التواصل مع الإدارة لتعيين فرع خاص بك لتتمكن من إدارة الطلبات.' 
                        : 'يرجى اختيار فرع من القائمة للمتابعة (هذا الخيار متاح للمسؤولين فقط).'}
                </p>
                
                {isAdminOrDev && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                            { id: 'JED-01', name: 'فرع جدة الرئيسي' },
                            { id: 'MAK-02', name: 'فرع مكة المكرمة' },
                            { id: 'MAD-03', name: 'فرع المدينة المنورة' },
                            { id: 'RIY-04', name: 'فرع الرياض' },
                            { id: 'DAM-05', name: 'فرع الدمام' },
                            { id: 'ABH-06', name: 'فرع أبها' }
                        ].map(branch => (
                            <button 
                                key={branch.id}
                                onClick={() => {
                                    localStorage.setItem('delegate-branch-id', branch.id);
                                    window.location.reload();
                                }}
                                className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-primary hover:bg-white transition-all group"
                            >
                                <span className="text-xl font-black text-slate-800">{branch.name}</span>
                                <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">{branch.id}</p>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={onBack} className="mt-12 text-gray-400 font-black hover:text-primary transition-colors">الرجوع</button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in pb-24 text-black" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-10 rounded-[4rem] shadow-xl border border-gray-100 gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-4xl">💼</div>
                    <div>
                        <h2 className="text-4xl font-black text-primary mb-1">شاشة المندوب</h2>
                        <p className="text-gray-400 font-bold">فرع: <span className="text-secondary">{branchId}</span> • إدارة الطلبات والعمليات الميدانية</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {isAdminOrDev && (
                        <button 
                            onClick={() => {
                                localStorage.removeItem('delegate-branch-id');
                                window.location.reload();
                            }}
                            className="bg-gray-50 text-gray-400 px-8 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all text-sm"
                        >
                            تغيير الفرع
                        </button>
                    )}
                    <button onClick={onBack} className="bg-primary text-white px-10 py-4 rounded-2xl font-black hover:bg-secondary transition-all shadow-lg">الرجوع</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'الكل', value: stats.total, color: 'bg-slate-800', key: 'all' },
                    { label: 'قيد الانتظار', value: stats.pending, color: 'bg-blue-500', key: 'pending' },
                    { label: 'قيد التجهيز', value: stats.preparing, color: 'bg-indigo-500', key: 'preparing' },
                    { label: 'تم الشحن', value: stats.shipped, color: 'bg-orange-500', key: 'shipped' },
                    { label: 'تم التسليم', value: stats.delivered, color: 'bg-green-500', key: 'delivered' },
                ].map(s => (
                    <button 
                        key={s.key}
                        onClick={() => setFilterStatus(s.key as any)}
                        className={`p-6 rounded-[2.5rem] shadow-xl transition-all border-b-8 ${
                            filterStatus === s.key ? 'scale-105 ring-4 ring-primary/20' : 'opacity-80 hover:opacity-100'
                        } ${s.color} text-white border-black/20`}
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
                        <p className="text-3xl font-black">{s.value}</p>
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="bg-white p-20 rounded-[4rem] text-center border-2 border-dashed border-gray-100">
                        <div className="text-6xl mb-6 opacity-20">📦</div>
                        <p className="text-2xl font-black text-gray-300 uppercase">لا توجد طلبات {filterStatus !== 'all' ? `بانتظار ${filterStatus}` : ''} حالياً</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-8 group hover:shadow-4xl transition-all relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-2 h-full ${
                                order.status === 'delivered' ? 'bg-green-500' :
                                order.status === 'shipped' ? 'bg-orange-500' :
                                order.status === 'preparing' ? 'bg-indigo-500' :
                                'bg-blue-500'
                            }`}></div>
                            
                            <div className="flex items-center gap-8 w-full lg:w-auto">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-xl ${
                                    order.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-primary text-white'
                                }`}>
                                    {order.status === 'delivered' ? '✅' : '📦'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-black text-slate-800">#{order.id.slice(-6)}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                            order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                            order.status === 'shipped' ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="font-bold text-gray-400">{order.customerName}</p>
                                    <div className="flex gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                                            <ChartBarIcon className="w-3 h-3" />
                                            {formatCurrency(order.total)}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                                            <LocationMarkerIcon className="w-3 h-3" />
                                            {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-end gap-3 w-full lg:w-auto">
                                <button 
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setIsOrderModalOpen(true);
                                    }}
                                    className="p-5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                    title="عرض التفاصيل"
                                >
                                    <EyeIcon className="w-6 h-6" />
                                </button>
                                
                                <div className="h-12 w-px bg-gray-100 mx-2 hidden lg:block"></div>

                                {order.status === 'pending' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg"
                                    >
                                        بدء التجهيز
                                    </button>
                                )}
                                
                                {order.status === 'preparing' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                        className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-lg"
                                    >
                                        تأكيد الشحن
                                    </button>
                                )}

                                {order.status === 'shipped' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                        className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg"
                                    >
                                        تأكيد التسليم
                                    </button>
                                )}

                                {order.status === 'delivered' && (
                                    <div className="px-8 py-4 bg-green-50 text-green-600 rounded-2xl font-black text-sm border border-green-100">
                                        تم التسليم بنجاح
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Order Details Modal */}
            {isOrderModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-10 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-8 md:p-12 border-b-2 border-gray-50 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-3xl font-black text-primary uppercase tracking-tighter">تفاصيل الطلب #{selectedOrder.id.slice(-6)}</h3>
                                <p className="text-gray-400 font-bold mt-1">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</p>
                            </div>
                            <button 
                                onClick={() => setIsOrderModalOpen(false)}
                                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all group"
                            >
                                <XIcon className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        
                        <div className="p-8 md:p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">معلومات العميل</h4>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100">
                                        <p className="text-xl font-black text-slate-800">{selectedOrder.customerName}</p>
                                        <p className="text-sm font-bold text-gray-400 mt-1">ID: {selectedOrder.customerId}</p>
                                        <p className="text-sm font-bold text-primary mt-2">طريقة الدفع: {selectedOrder.paymentMethod}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">حالة الطلب</h4>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <span className={`px-6 py-2 rounded-full font-black text-xs uppercase ${
                                            selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                            selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">محتويات الطلب</h4>
                                <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-50 border-b border-gray-100">
                                            <tr>
                                                <th className="p-5 font-black text-primary text-xs uppercase">المنتج</th>
                                                <th className="p-5 font-black text-primary text-xs uppercase text-center">الكمية</th>
                                                <th className="p-5 font-black text-primary text-xs uppercase">السعر</th>
                                                <th className="p-5 font-black text-primary text-xs uppercase">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-all">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <img src={item.image} alt={item.name_ar} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                                                            <div>
                                                                <p className="font-black text-slate-800">{item.name_ar}</p>
                                                                <p className="text-[10px] font-bold text-gray-400">{item.unit_ar}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center font-black text-slate-600">x{item.quantity}</td>
                                                    <td className="p-5 font-bold text-slate-600">{item.price} ر.س</td>
                                                    <td className="p-5 font-black text-secondary">{(item.price * item.quantity).toFixed(2)} ر.س</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t-2 border-gray-100">
                                            <tr>
                                                <td colSpan={3} className="p-6 text-left font-black text-slate-400 uppercase tracking-widest">الإجمالي الكلي</td>
                                                <td className="p-6 font-black text-3xl text-secondary">{formatCurrency(selectedOrder.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 md:p-12 bg-slate-50 border-t-2 border-gray-100 flex justify-end gap-4">
                            <button 
                                onClick={() => setIsOrderModalOpen(false)}
                                className="px-10 py-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-slate-400 hover:bg-gray-100 transition-all"
                            >
                                إغلاق
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl hover:bg-secondary transition-all"
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
