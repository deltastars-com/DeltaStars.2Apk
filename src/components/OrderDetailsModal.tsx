import React from 'react';
import { Order, Branch } from '../types';
import { XIcon, MapPinIcon, ClockIcon, ShoppingBagIcon, UserIcon, PhoneIcon } from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';

interface OrderDetailsModalProps {
    order: Order;
    branches: Branch[];
    onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, branches, onClose }) => {
    const { language, formatCurrency } = useI18n();
    const branch = branches.find(b => b.id === order.branchId);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-[3rem] shadow-4xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-primary text-white p-4 sm:p-8 flex justify-between items-center border-b-4 sm:border-b-8 border-secondary">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-black tracking-tighter uppercase">Order Details</h2>
                        <p className="text-secondary font-bold text-[10px] sm:text-xs tracking-widest mt-1">#{order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl hover:bg-red-600 transition-all">
                        <XIcon className="w-5 h-5 sm:w-8 sm:h-8" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10">
                        {/* Customer Info */}
                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="text-lg sm:text-xl font-black text-primary border-b-2 border-slate-100 pb-2 flex items-center gap-2 sm:gap-3">
                                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                                {language === 'ar' ? 'معلومات العميل' : 'Customer Info'}
                            </h3>
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase">Name</p>
                                        <p className="font-bold text-sm sm:text-base text-slate-800">{order.customerName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                        <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase">Phone</p>
                                        <p className="font-bold text-sm sm:text-base text-slate-800">{order.customerPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                        <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase">Address</p>
                                        <p className="font-bold text-sm sm:text-base text-slate-800">{order.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Status & Branch */}
                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="text-lg sm:text-xl font-black text-primary border-b-2 border-slate-100 pb-2 flex items-center gap-2 sm:gap-3">
                                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                                {language === 'ar' ? 'حالة الطلب والفرع' : 'Status & Branch'}
                            </h3>
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-black text-gray-400 uppercase">Status</span>
                                    <span className={`px-3 py-0.5 sm:px-4 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase ${
                                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-black text-gray-400 uppercase">Branch</span>
                                    <span className="font-bold text-sm sm:text-base text-primary">
                                        {branch ? (language === 'ar' ? branch.name_ar : branch.name_en) : 'Not Assigned'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-black text-gray-400 uppercase">Date</span>
                                    <span className="font-bold text-sm sm:text-base text-slate-600">
                                        {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-black text-primary border-b-2 border-slate-100 pb-2 flex items-center gap-2 sm:gap-3">
                            <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                            {language === 'ar' ? 'الأصناف المطلوبة' : 'Order Items'}
                        </h3>
                        <div className="bg-slate-50 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right min-w-[500px] sm:min-w-0">
                                    <thead className="bg-slate-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="p-3 sm:p-4">Item</th>
                                            <th className="p-3 sm:p-4">Price</th>
                                            <th className="p-3 sm:p-4">Qty</th>
                                            <th className="p-3 sm:p-4">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {order.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white transition-colors">
                                                <td className="p-3 sm:p-4 font-bold text-slate-800">{language === 'ar' ? item.name_ar : item.name_en}</td>
                                                <td className="p-3 sm:p-4 font-mono text-sm">{formatCurrency(item.price)}</td>
                                                <td className="p-3 sm:p-4 font-black">x{item.quantity}</td>
                                                <td className="p-3 sm:p-4 font-mono font-black text-primary">{formatCurrency(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-black">
                                        <tr>
                                            <td colSpan={3} className="p-3 sm:p-4 text-right uppercase tracking-widest text-[10px] sm:text-xs">Total Amount (Inc. VAT)</td>
                                            <td className="p-3 sm:p-4 text-xl sm:text-2xl text-secondary font-mono">{formatCurrency(order.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-8 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 sm:px-10 sm:py-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg hover:bg-gray-50 transition-all"
                    >
                        {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="px-6 py-3 sm:px-10 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg hover:bg-green-800 transition-all shadow-lg"
                    >
                        {language === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
                    </button>
                </div>
            </div>
        </div>
    );
};
