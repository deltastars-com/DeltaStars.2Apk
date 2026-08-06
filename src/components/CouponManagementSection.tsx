import React, { useState } from 'react';
import { Coupon } from '../types';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { PlusIcon, TrashIcon, PencilIcon, TicketIcon, XIcon } from './lib/contexts/Icons';

export const CouponManagementSection: React.FC = () => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { coupons, addCoupon, updateCoupon, deleteCoupon } = useFirebase();
    
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
        code: '', discountType: 'percentage', value: 0, minOrderAmount: 0, expiryDate: '', isActive: true
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const couponData = editingCoupon || newCoupon;
        const discountValue = couponData.value || 0;
        const type = couponData.discountType;

        if (type === 'percentage') {
            if (discountValue < 1 || discountValue > 100) {
                addToast(language === 'ar' ? 'يجب أن تكون قيمة الخصم المئوي بين 1 و 100' : 'Percentage discount must be between 1 and 100', 'error');
                return;
            }
        } else if (type === 'fixed') {
            if (discountValue <= 0) {
                addToast(language === 'ar' ? 'يجب أن تكون قيمة الخصم أكبر من صفر' : 'Fixed discount must be greater than zero', 'error');
                return;
            }
        }

        try {
            if (editingCoupon) {
                await updateCoupon(editingCoupon.id, editingCoupon);
                setEditingCoupon(null);
                addToast(language === 'ar' ? 'تم تحديث الكوبون' : 'Coupon updated', 'success');
            } else {
                await addCoupon(newCoupon as Omit<Coupon, 'id'>);
                setIsAdding(false);
                setNewCoupon({ code: '', discountType: 'percentage', value: 0, minOrderAmount: 0, expiryDate: '', isActive: true });
                addToast(language === 'ar' ? 'تم إضافة الكوبون' : 'Coupon added', 'success');
            }
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في الحفظ' : 'Failed to save', 'error');
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800 uppercase flex items-center gap-4">
                    <TicketIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    {language === 'ar' ? 'إدارة الكوبونات والعروض' : 'Coupons & Offers Management'}
                </h2>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full sm:w-auto bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                    <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
                    {language === 'ar' ? 'إضافة كوبون جديد' : 'Add New Coupon'}
                </button>
            </div>

            {(isAdding || editingCoupon) && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl">
                    <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[4rem] shadow-sovereign overflow-hidden animate-scale-in">
                        <div className="p-6 md:p-12 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl md:text-3xl font-black text-primary uppercase">
                                {editingCoupon ? (language === 'ar' ? 'تعديل كوبون' : 'Edit Coupon') : (language === 'ar' ? 'إضافة كوبون جديد' : 'Add New Coupon')}
                            </h3>
                            <button onClick={() => { setIsAdding(false); setEditingCoupon(null); }} className="p-2 md:p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                                <XIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 md:p-12 space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">رمز الكوبون (Code)</label>
                                    <input 
                                        type="text" required
                                        value={editingCoupon ? editingCoupon.code : newCoupon.code}
                                        onChange={e => editingCoupon ? setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()}) : setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">نوع الخصم (Discount Type)</label>
                                    <select 
                                        value={editingCoupon ? editingCoupon.discountType : newCoupon.discountType}
                                        onChange={e => editingCoupon ? setEditingCoupon({...editingCoupon, discountType: e.target.value as any}) : setNewCoupon({...newCoupon, discountType: e.target.value as any})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    >
                                        <option value="percentage">{language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                                        <option value="fixed">{language === 'ar' ? 'مبلغ ثابت (Fixed)' : 'Fixed Amount'}</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">قيمة الخصم (Value)</label>
                                    <input 
                                        type="number" required
                                        value={editingCoupon ? editingCoupon.value : newCoupon.value}
                                        onChange={e => editingCoupon ? setEditingCoupon({...editingCoupon, value: Number(e.target.value)}) : setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">الحد الأدنى للطلب (Min Order SAR)</label>
                                    <input 
                                        type="number" required
                                        value={editingCoupon ? editingCoupon.minOrderAmount : newCoupon.minOrderAmount}
                                        onChange={e => editingCoupon ? setEditingCoupon({...editingCoupon, minOrderAmount: Number(e.target.value)}) : setNewCoupon({...newCoupon, minOrderAmount: Number(e.target.value)})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">تاريخ الانتهاء (Expiry Date)</label>
                                    <input 
                                        type="date" required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={editingCoupon ? editingCoupon.expiryDate : newCoupon.expiryDate}
                                        onChange={e => editingCoupon ? setEditingCoupon({...editingCoupon, expiryDate: e.target.value}) : setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-4 md:pt-8">
                                    <input 
                                        type="checkbox"
                                        checked={editingCoupon ? editingCoupon.isActive : newCoupon.isActive}
                                        onChange={e => editingCoupon ? setEditingCoupon({...editingCoupon, isActive: e.target.checked}) : setNewCoupon({...newCoupon, isActive: e.target.checked})}
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl border-2 border-gray-200 text-primary focus:ring-primary"
                                    />
                                    <label className="text-base md:text-lg font-black text-slate-800">تفعيل الكوبون</label>
                                </div>
                            </div>
                            <div className="pt-6 md:pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                <button type="submit" className="flex-1 bg-primary text-white py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    {language === 'ar' ? 'حفظ الكوبون' : 'Save Coupon'}
                                </button>
                                <button type="button" onClick={() => { setIsAdding(false); setEditingCoupon(null); }} className="px-8 md:px-12 py-4 md:py-6 bg-slate-100 text-slate-400 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl hover:bg-gray-200 transition-all">
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl md:rounded-[3rem] border-2 border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-right min-w-[800px]">
                    <thead className="bg-slate-50 border-b-2 border-gray-100">
                        <tr>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">الكوبون</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">الخصم</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">الحد الأدنى</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">تاريخ الانتهاء</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">الحالة</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {coupons.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 md:p-6">
                                    <div className="font-black text-primary text-lg md:text-2xl tracking-widest">{c.code}</div>
                                </td>
                                <td className="p-4 md:p-6">
                                    <div className="font-black text-slate-800 text-base md:text-xl">
                                        {c.value}{c.discountType === 'percentage' ? '%' : ' ر.س'}
                                    </div>
                                </td>
                                <td className="p-4 md:p-6 font-bold text-slate-600 text-sm md:text-base">{c.minOrderAmount} ر.س</td>
                                <td className="p-4 md:p-6 font-bold text-slate-600 text-sm md:text-base">{c.expiryDate}</td>
                                <td className="p-4 md:p-6">
                                    <span className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                                        c.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {c.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معطل' : 'Inactive')}
                                    </span>
                                </td>
                                <td className="p-4 md:p-6">
                                    <div className="flex gap-2 md:gap-3">
                                        <button onClick={() => setEditingCoupon(c)} className="p-3 md:p-4 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                                            <PencilIcon className="w-5 h-5 md:w-6 md:h-6" />
                                        </button>
                                        <button onClick={() => { if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) deleteCoupon(c.id); }} className="p-3 md:p-4 bg-red-50 text-red-600 rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                                            <TrashIcon className="w-5 h-5 md:w-6 md:h-6" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
