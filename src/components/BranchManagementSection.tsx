
import React, { useState } from 'react';
import { Branch } from '../types';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { PlusIcon, TrashIcon, PencilIcon, MapIcon, XIcon } from './lib/contexts/Icons';
import BranchMap from './BranchMap';

export const BranchManagementSection: React.FC = () => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { branches, addBranch, updateBranch, deleteBranch } = useFirebase();
    
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [showMapId, setShowMapId] = useState<string | null>(null);
    const [newBranch, setNewBranch] = useState<Partial<Branch>>({
        name_ar: '', name_en: '', city: '', address_ar: '', address_en: '', phone: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await updateBranch(editingBranch.id, editingBranch);
                setEditingBranch(null);
                addToast(language === 'ar' ? 'تم تحديث الفرع' : 'Branch updated', 'success');
            } else {
                await addBranch(newBranch as Omit<Branch, 'id'>);
                setIsAdding(false);
                setNewBranch({ name_ar: '', name_en: '', city: '', address_ar: '', address_en: '', phone: '' });
                addToast(language === 'ar' ? 'تم إضافة الفرع' : 'Branch added', 'success');
            }
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في الحفظ' : 'Failed to save', 'error');
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800 uppercase flex items-center gap-4">
                    <MapIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    {language === 'ar' ? 'إدارة الفروع والمواقع' : 'Branch Management'}
                </h2>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full sm:w-auto bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                    <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
                    {language === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch'}
                </button>
            </div>

            {(isAdding || editingBranch) && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl">
                    <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[4rem] shadow-sovereign overflow-hidden animate-scale-in">
                        <div className="p-6 md:p-12 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl md:text-3xl font-black text-primary uppercase">
                                {editingBranch ? (language === 'ar' ? 'تعديل فرع' : 'Edit Branch') : (language === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch')}
                            </h3>
                            <button onClick={() => { setIsAdding(false); setEditingBranch(null); }} className="p-2 md:p-4 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
                                <XIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 md:p-12 space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">اسم الفرع (عربي)</label>
                                    <input 
                                        type="text" required
                                        value={editingBranch ? editingBranch.name_ar : newBranch.name_ar}
                                        onChange={e => editingBranch ? setEditingBranch({...editingBranch, name_ar: e.target.value}) : setNewBranch({...newBranch, name_ar: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Branch Name (English)</label>
                                    <input 
                                        type="text" required
                                        value={editingBranch ? editingBranch.name_en : newBranch.name_en}
                                        onChange={e => editingBranch ? setEditingBranch({...editingBranch, name_en: e.target.value}) : setNewBranch({...newBranch, name_en: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">المدينة</label>
                                    <input 
                                        type="text" required
                                        value={editingBranch ? editingBranch.city : newBranch.city}
                                        onChange={e => editingBranch ? setEditingBranch({...editingBranch, city: e.target.value}) : setNewBranch({...newBranch, city: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">رقم الهاتف</label>
                                    <input 
                                        type="text" required
                                        value={editingBranch ? editingBranch.phone : newBranch.phone}
                                        onChange={e => editingBranch ? setEditingBranch({...editingBranch, phone: e.target.value}) : setNewBranch({...newBranch, phone: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3 md:col-span-2">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">العنوان (عربي)</label>
                                    <textarea 
                                        required
                                        value={editingBranch ? editingBranch.address_ar : newBranch.address_ar}
                                        onChange={e => editingBranch ? setEditingBranch({...editingBranch, address_ar: e.target.value}) : setNewBranch({...newBranch, address_ar: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all h-24 md:h-32 text-sm md:text-base"
                                    />
                                </div>
                                <div className="space-y-2 md:space-y-3 md:col-span-2">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Address (English)</label>
                                    <textarea 
                                        required
                                        value={editingBranch ? editingBranch.address_en : newBranch.address_en}
                                        onChange={e => editingBranch ? setEditingBranch({...editingBranch, address_en: e.target.value}) : setNewBranch({...newBranch, address_en: e.target.value})}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all h-24 md:h-32 text-sm md:text-base"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">موقع الفرع على الخريطة</label>
                                    <BranchMap 
                                        address={editingBranch ? (language === 'ar' ? editingBranch.address_ar : editingBranch.address_en) : (language === 'ar' ? newBranch.address_ar : newBranch.address_en)}
                                        initialLocation={editingBranch?.location}
                                        onLocationSelect={(loc) => editingBranch ? setEditingBranch({...editingBranch, location: loc}) : setNewBranch({...newBranch, location: loc})}
                                        isEditable={true}
                                    />
                                </div>
                            </div>
                            <div className="pt-6 md:pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                <button type="submit" className="flex-1 bg-primary text-white py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    {language === 'ar' ? 'حفظ الفرع' : 'Save Branch'}
                                </button>
                                <button type="button" onClick={() => { setIsAdding(false); setEditingBranch(null); }} className="px-8 md:px-12 py-4 md:py-6 bg-slate-100 text-slate-400 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-2xl hover:bg-gray-200 transition-all">
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {branches.map(branch => (
                    <div key={branch.id} className="bg-white rounded-2xl md:rounded-[3rem] border-2 border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/5 rounded-bl-[6rem] md:rounded-bl-[8rem] -mr-12 md:-mr-16 -mt-12 md:-mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-4 md:space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 md:p-4 bg-primary/10 text-primary rounded-xl md:rounded-2xl">
                                    <MapIcon className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowMapId(showMapId === branch.id ? null : branch.id)} 
                                        className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all ${showMapId === branch.id ? 'bg-primary text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-primary hover:text-white'}`}
                                        title={language === 'ar' ? 'عرض الموقع' : 'Show Map'}
                                    >
                                        <MapIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button onClick={() => setEditingBranch(branch)} className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                        <PencilIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button onClick={() => { if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) deleteBranch(branch.id); }} className="p-2 md:p-3 bg-red-50 text-red-600 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                        <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="animate-fade-in">
                                {showMapId === branch.id ? (
                                    <div className="mt-4">
                                        <BranchMap 
                                            address={language === 'ar' ? branch.address_ar : branch.address_en}
                                            initialLocation={branch.location}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h4 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-1">{language === 'ar' ? branch.name_ar : branch.name_en}</h4>
                                            <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-widest mt-1">{branch.city}</p>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            <p className="text-xs md:text-sm text-gray-500 font-bold leading-relaxed line-clamp-2">{language === 'ar' ? branch.address_ar : branch.address_en}</p>
                                            <p className="text-xs md:text-sm text-slate-800 font-black">{branch.phone}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
