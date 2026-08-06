import React from 'react';
import { PriceUpdateRequest } from '../types';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { CheckCircleIcon, XIcon, TrendingUpIcon, ClockIcon } from './lib/contexts/Icons';

export const PriceUpdateRequestSection: React.FC = () => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { priceUpdateRequests, updatePriceUpdateRequest, updateProduct, user } = useFirebase();

    const handleApprove = async (req: PriceUpdateRequest) => {
        try {
            // 1. Update the product price
            await updateProduct(req.productId, { price: req.newPrice });
            // 2. Update the request status
            await updatePriceUpdateRequest(req.id, { 
                status: 'approved', 
                approvedBy: user?.email || 'Admin', 
                approvedAt: new Date().toISOString() 
            });
            addToast(language === 'ar' ? 'تمت الموافقة وتحديث السعر' : 'Approved and price updated', 'success');
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في الموافقة' : 'Approval failed', 'error');
        }
    };

    const handleReject = async (req: PriceUpdateRequest) => {
        try {
            await updatePriceUpdateRequest(req.id, { 
                status: 'rejected', 
                approvedBy: user?.email || 'Admin', 
                approvedAt: new Date().toISOString() 
            });
            addToast(language === 'ar' ? 'تم رفض الطلب' : 'Request rejected', 'info');
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في الرفض' : 'Rejection failed', 'error');
        }
    };

    const pendingRequests = priceUpdateRequests.filter(r => r.status === 'pending');

    return (
        <div className="space-y-12 animate-fade-in">
            <h2 className="text-4xl font-black text-slate-800 uppercase flex items-center gap-4">
                <TrendingUpIcon className="w-10 h-10 text-primary" />
                {language === 'ar' ? 'طلبات تحديث الأسعار' : 'Price Update Requests'}
            </h2>

            <div className="bg-white rounded-[3rem] border-2 border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b-2 border-gray-100">
                        <tr>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">المنتج</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">السعر الحالي</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">السعر المطلوب</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">بواسطة</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">الحالة</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-widest">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {priceUpdateRequests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6">
                                    <div className="font-black text-slate-800 text-lg">{req.productName_ar}</div>
                                    <div className="text-xs text-gray-400 font-bold uppercase">{req.productName_en}</div>
                                </td>
                                <td className="p-6 font-bold text-slate-400">{req.oldPrice} ر.س</td>
                                <td className="p-6 font-black text-secondary text-xl">{req.newPrice} ر.س</td>
                                <td className="p-6">
                                    <div className="text-sm font-bold text-slate-600">{req.requestedBy}</div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {new Date(req.requestedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                                        req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {req.status === 'approved' ? (language === 'ar' ? 'تمت الموافقة' : 'Approved') : 
                                         req.status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') : 
                                         (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                                    </span>
                                </td>
                                <td className="p-6">
                                    {req.status === 'pending' ? (
                                        <div className="flex gap-3">
                                            <button onClick={() => handleApprove(req)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </button>
                                            <button onClick={() => handleReject(req)} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                <XIcon className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 font-bold italic">
                                            {language === 'ar' ? 'بواسطة: ' : 'By: '}{req.approvedBy}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
