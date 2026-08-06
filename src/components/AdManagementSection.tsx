import React, { useState } from 'react';
import { Ad } from '../types';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { PlusIcon, TrashIcon, PencilIcon, MegaphoneIcon, XIcon } from './lib/contexts/Icons';

export const AdManagementSection: React.FC = () => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { ads, addAd, updateAd, deleteAd } = useFirebase();
    
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newAd, setNewAd] = useState<Partial<Ad>>({
        title_ar: '', title_en: '', image: '', link: '', customerEmail: '', fee: 0, startDate: '', endDate: '', status: 'pending'
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAd) {
                await updateAd(editingAd.id, editingAd);
                setEditingAd(null);
                addToast(language === 'ar' ? 'تم تحديث الإعلان' : 'Ad updated', 'success');
            } else {
                await addAd(newAd as Omit<Ad, 'id'>);
                setIsAdding(false);
                setNewAd({ title_ar: '', title_en: '', image: '', link: '', customerEmail: '', fee: 0, startDate: '', endDate: '', status: 'pending' });
                addToast(language === 'ar' ? 'تم إضافة الإعلان' : 'Ad added', 'success');
            }
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في الحفظ' : 'Failed to save', 'error');
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800 uppercase flex items-center gap-4">
                    <MegaphoneIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    {language === 'ar' ? 'إدارة الإعلانات الترويجية' : 'Promotional Ads Management'}
                </h2>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full sm:w-auto bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                    <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
                    {language === 'ar' ? 'إضافة إعلان جديد' : 'Add New Ad'}
                </button>
            </div>

            {(isAdding || editingAd) && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl">
                    <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[4rem] shadow-sovereign overflow-hidden animate-scale-in">
                        <div className="p-6 md:p-12 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl md:text-3xl font-black text-primary uppercase">
                                {editingAd ? (language === 'ar' ? 'تعديل إعلان' : 'Edit Ad') : (language === 'ar' ? 'إضافة إعلان جديد' : 'Add New Ad')}
                            </h3>
                            <button onClick={() => { setIsAdding(false); setEditingAd(null); }} className="p-2 md:p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                                <XIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 md:p-12 space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">عنوان الإعلان (عربي)</label>
                                    <input 
                                        type="text" required
                                        value={editingAd ? editingAd.title_ar : newAd.title_ar}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, title_ar: e.target.value}) : setNewAd({...newAd, title_ar: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Ad Title (English)</label>
                                    <input 
                                        type="text" required
                                        value={editingAd ? editingAd.title_en : newAd.title_en}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, title_en: e.target.value}) : setNewAd({...newAd, title_en: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">رابط الصورة</label>
                                    <input 
                                        type="text" required
                                        value={editingAd ? editingAd.image : newAd.image}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, image: e.target.value}) : setNewAd({...newAd, image: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">رابط التوجيه (اختياري)</label>
                                    <input 
                                        type="text"
                                        value={editingAd ? editingAd.link : newAd.link}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, link: e.target.value}) : setNewAd({...newAd, link: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">بريد العميل</label>
                                    <input 
                                        type="email" required
                                        value={editingAd ? editingAd.customerEmail : newAd.customerEmail}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, customerEmail: e.target.value}) : setNewAd({...newAd, customerEmail: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">رسوم الإعلان (ريال)</label>
                                    <input 
                                        type="number" required
                                        value={editingAd ? editingAd.fee : newAd.fee}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, fee: Number(e.target.value)}) : setNewAd({...newAd, fee: Number(e.target.value)})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">تاريخ البدء</label>
                                    <input 
                                        type="date" required
                                        value={editingAd ? editingAd.startDate : newAd.startDate}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, startDate: e.target.value}) : setNewAd({...newAd, startDate: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">تاريخ الانتهاء</label>
                                    <input 
                                        type="date" required
                                        value={editingAd ? editingAd.endDate : newAd.endDate}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, endDate: e.target.value}) : setNewAd({...newAd, endDate: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">الحالة</label>
                                    <select 
                                        value={editingAd ? editingAd.status : newAd.status}
                                        onChange={e => editingAd ? setEditingAd({...editingAd, status: e.target.value as any}) : setNewAd({...newAd, status: e.target.value as any})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    >
                                        <option value="pending">قيد المراجعة (Pending)</option>
                                        <option value="active">نشط (Active)</option>
                                        <option value="expired">منتهي (Expired)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6 md:pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                <button type="submit" className="flex-1 bg-primary text-white py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    {language === 'ar' ? 'حفظ الإعلان' : 'Save Ad'}
                                </button>
                                <button type="button" onClick={() => { setIsAdding(false); setEditingAd(null); }} className="px-8 md:px-12 py-4 md:py-6 bg-slate-100 text-slate-400 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl hover:bg-gray-200 transition-all">
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-white rounded-2xl md:rounded-[3rem] border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                        <div className="relative h-40 md:h-48 overflow-hidden">
                            <img src={ad.image} alt={ad.title_ar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-3 md:top-4 right-3 md:right-4">
                                <span className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                    ad.status === 'active' ? 'bg-emerald-500 text-white' : 
                                    ad.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                    {ad.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 space-y-3 md:space-y-4">
                            <div>
                                <h4 className="text-lg md:text-2xl font-black text-slate-800 line-clamp-1">{language === 'ar' ? ad.title_ar : ad.title_en}</h4>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold break-all">{ad.customerEmail}</p>
                            </div>
                            <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-gray-50">
                                <div className="text-lg md:text-xl font-black text-secondary">{ad.fee} ر.س</div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingAd(ad)} className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                        <PencilIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button onClick={() => { if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) deleteAd(ad.id); }} className="p-2 md:p-3 bg-red-50 text-red-600 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                        <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
