import React, { useState } from 'react';
import { useFirebase, useI18n, useToast, PlusIcon, TrashIcon, PencilIcon, SparklesIcon } from './lib/contexts';
import { Promotion } from '../types';
import { db, setDoc, doc, deleteDoc, collection, handleFirestoreError, OperationType } from '@/firebase';

export const PromotionManagementSection: React.FC = () => {
    const { language } = useI18n();
    const { promotions, addProduct } = useFirebase();
    const { addToast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [formData, setFormData] = useState<Partial<Promotion>>({
        title_ar: '',
        title_en: '',
        image: '',
        type: 'seasonal',
        isActive: true,
        description_ar: '',
        description_en: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = editingPromo ? editingPromo.id : Date.now();
            const promoData = { ...formData, id } as Promotion;
            await setDoc(doc(db, 'promotions', id.toString()), promoData);
            addToast(editingPromo ? 'تم تحديث العرض' : 'تم إضافة العرض بنجاح', 'success');
            setIsAdding(false);
            setEditingPromo(null);
            setFormData({ title_ar: '', title_en: '', image: '', type: 'seasonal', isActive: true, description_ar: '', description_en: '' });
        } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'promotions');
            addToast('فشل في حفظ العرض', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
            try {
                await deleteDoc(doc(db, 'promotions', id.toString()));
                addToast('تم حذف العرض', 'info');
            } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, 'promotions');
                addToast('فشل في حذف العرض', 'error');
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black text-primary flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-secondary" />
                    إدارة العروض الترويجية والموسمية
                </h3>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                >
                    <PlusIcon className="w-6 h-6" />
                    إضافة عرض جديد
                </button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-primary/20 shadow-2xl animate-scale-in">
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">العنوان (عربي)</label>
                            <input 
                                type="text" 
                                value={formData.title_ar} 
                                onChange={e => setFormData({...formData, title_ar: e.target.value})}
                                className="w-full p-5 bg-white border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">العنوان (English)</label>
                            <input 
                                type="text" 
                                value={formData.title_en} 
                                onChange={e => setFormData({...formData, title_en: e.target.value})}
                                className="w-full p-5 bg-white border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">رابط الصورة</label>
                            <input 
                                type="text" 
                                value={formData.image} 
                                onChange={e => setFormData({...formData, image: e.target.value})}
                                className="w-full p-5 bg-white border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none"
                                placeholder="https://..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">نوع العرض</label>
                            <select 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full p-5 bg-white border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none"
                            >
                                <option value="seasonal">موسمي (Seasonal)</option>
                                <option value="flash">عرض خاطف (Flash Sale)</option>
                                <option value="cashback">كاش باك (Cashback)</option>
                                <option value="bundle">باقة توفير (Bundle)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الوصف (عربي)</label>
                            <textarea 
                                value={formData.description_ar} 
                                onChange={e => setFormData({...formData, description_ar: e.target.value})}
                                className="w-full p-5 bg-white border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none h-32"
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-4">
                            <button type="submit" className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-xl shadow-lg">حفظ العرض</button>
                            <button type="button" onClick={() => setIsAdding(false)} className="px-10 py-5 bg-white text-gray-400 rounded-2xl font-black border border-gray-200">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {promotions.map(promo => (
                    <div key={promo.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-all group relative">
                        <img src={promo.image} alt={promo.title_ar} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-6 right-6 bg-secondary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            {promo.type}
                        </div>
                        <div className="p-8">
                            <h4 className="text-2xl font-black text-primary mb-2">{language === 'ar' ? promo.title_ar : promo.title_en}</h4>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-6">{language === 'ar' ? promo.description_ar : promo.description_en}</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setEditingPromo(promo); setFormData(promo); setIsAdding(true); }}
                                    className="flex-1 bg-slate-100 text-primary py-4 rounded-xl font-black hover:bg-primary hover:text-white transition-all"
                                >
                                    تعديل
                                </button>
                                <button 
                                    onClick={() => handleDelete(promo.id)}
                                    className="p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                >
                                    <TrashIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
