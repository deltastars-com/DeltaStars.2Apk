import React, { useState } from 'react';
import { ProductUnit } from '../types';
import { useI18n, useToast, PlusIcon, TrashIcon, PencilIcon, XIcon } from './lib/contexts';
import { db, setDoc, doc, deleteDoc, handleFirestoreError, OperationType } from '@/firebase';

interface UnitManagementSectionProps {
    units: ProductUnit[];
}

export const UnitManagementSection: React.FC<UnitManagementSectionProps> = ({ units }) => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
    const [newUnit, setNewUnit] = useState<Partial<ProductUnit>>({
        code: '', name_ar: '', name_en: '', base_factor: 1
    });

    const handleSaveUnit = async () => {
        try {
            if (editingUnit) {
                await setDoc(doc(db, 'units', editingUnit.code), editingUnit);
                setEditingUnit(null);
                addToast('تم تحديث الوحدة بنجاح', 'success');
            } else {
                if (!newUnit.code) {
                    addToast('يرجى تحديد كود الوحدة', 'error');
                    return;
                }
                await setDoc(doc(db, 'units', newUnit.code), newUnit as ProductUnit);
                setNewUnit({ code: '', name_ar: '', name_en: '', base_factor: 1 });
                addToast('تم إضافة الوحدة بنجاح', 'success');
            }
        } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'units');
            addToast('فشل في حفظ الوحدة', 'error');
        }
    };

    const handleDeleteUnit = async (code: string) => {
        if (window.confirm('حذف هذه الوحدة؟')) {
            try {
                await deleteDoc(doc(db, 'units', code));
                addToast('تم حذف الوحدة', 'info');
            } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, 'units');
                addToast('فشل في حذف الوحدة', 'error');
            }
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl border border-gray-100">
                <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 flex items-center gap-3 text-primary">
                    <PlusIcon className="w-6 h-6 md:w-8 md:h-8" />
                    {editingUnit ? (language === 'ar' ? 'تعديل وحدة' : 'Edit Unit') : (language === 'ar' ? 'إضافة وحدة جديدة' : 'Add New Unit')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">كود الوحدة</label>
                        <input
                            type="text"
                            placeholder="الكود (e.g. kg)"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                            value={editingUnit ? editingUnit.code : newUnit.code}
                            onChange={e => editingUnit ? setEditingUnit({ ...editingUnit, code: e.target.value }) : setNewUnit({ ...newUnit, code: e.target.value })}
                            disabled={!!editingUnit}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">الاسم بالعربية</label>
                        <input
                            type="text"
                            placeholder="الاسم بالعربية"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                            value={editingUnit ? editingUnit.name_ar : newUnit.name_ar}
                            onChange={e => editingUnit ? setEditingUnit({ ...editingUnit, name_ar: e.target.value }) : setNewUnit({ ...newUnit, name_ar: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">الاسم بالإنجليزية</label>
                        <input
                            type="text"
                            placeholder="الاسم بالإنجليزية"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                            value={editingUnit ? editingUnit.name_en : newUnit.name_en}
                            onChange={e => editingUnit ? setEditingUnit({ ...editingUnit, name_en: e.target.value }) : setNewUnit({ ...newUnit, name_en: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">عامل الأساس</label>
                        <input
                            type="number"
                            placeholder="عامل الأساس"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl md:rounded-2xl font-bold outline-none transition-all text-sm md:text-base"
                            value={editingUnit ? editingUnit.base_factor : newUnit.base_factor}
                            onChange={e => editingUnit ? setEditingUnit({ ...editingUnit, base_factor: parseFloat(e.target.value) }) : setNewUnit({ ...newUnit, base_factor: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button onClick={handleSaveUnit} className="flex-1 bg-primary text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                        {editingUnit ? (language === 'ar' ? 'تحديث الوحدة' : 'Update Unit') : (language === 'ar' ? 'إضافة الوحدة' : 'Add Unit')}
                    </button>
                    {editingUnit && (
                        <button onClick={() => setEditingUnit(null)} className="px-8 md:px-12 py-4 md:py-5 bg-slate-100 text-slate-400 rounded-xl md:rounded-2xl font-black text-lg md:text-xl hover:bg-gray-200 transition-all">
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 md:p-6 font-black text-xs md:text-sm text-gray-400 uppercase tracking-widest">الكود</th>
                                <th className="p-4 md:p-6 font-black text-xs md:text-sm text-gray-400 uppercase tracking-widest">الاسم (AR)</th>
                                <th className="p-4 md:p-6 font-black text-xs md:text-sm text-gray-400 uppercase tracking-widest">الاسم (EN)</th>
                                <th className="p-4 md:p-6 font-black text-xs md:text-sm text-gray-400 uppercase tracking-widest">عامل الأساس</th>
                                <th className="p-4 md:p-6 font-black text-xs md:text-sm text-gray-400 uppercase tracking-widest">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map(unit => (
                                <tr key={unit.code} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 md:p-6 font-mono text-xs md:text-sm text-primary font-black">{unit.code}</td>
                                    <td className="p-4 md:p-6 font-black text-sm md:text-base text-slate-800">{unit.name_ar}</td>
                                    <td className="p-4 md:p-6 font-bold text-sm md:text-base text-slate-600">{unit.name_en}</td>
                                    <td className="p-4 md:p-6 font-black text-sm md:text-base text-slate-800">{unit.base_factor}</td>
                                    <td className="p-4 md:p-6">
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingUnit(unit)} className="p-2 md:p-3 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg md:rounded-xl transition-all">
                                                <PencilIcon className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                            <button onClick={() => handleDeleteUnit(unit.code)} className="p-2 md:p-3 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg md:rounded-xl transition-all">
                                                <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
