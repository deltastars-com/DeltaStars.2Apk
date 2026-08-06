import React, { useState } from 'react';
import { CategoryConfig, CategoryKey } from '../types';
import { useI18n, useToast, PlusIcon, TrashIcon, PencilIcon, XIcon } from './lib/contexts';
import { db, setDoc, doc, deleteDoc, handleFirestoreError, OperationType } from '@/firebase';

interface CategoryManagementSectionProps {
    categories: CategoryConfig[];
}

export const CategoryManagementSection: React.FC<CategoryManagementSectionProps> = ({ categories }) => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
    const [newCategory, setNewCategory] = useState<Partial<CategoryConfig>>({
        key: 'custom' as CategoryKey, label_ar: '', label_en: '', icon: '📦', order: 10, isVisible: true
    });

    const handleSaveCategory = async () => {
        try {
            if (editingCategory) {
                await setDoc(doc(db, 'categories', editingCategory.key), editingCategory);
                setEditingCategory(null);
                addToast('تم تحديث التصنيف بنجاح', 'success');
            } else {
                if (!newCategory.key || newCategory.key === 'custom') {
                    addToast('يرجى تحديد مفتاح فريد للتصنيف', 'error');
                    return;
                }
                await setDoc(doc(db, 'categories', newCategory.key), newCategory as CategoryConfig);
                setNewCategory({ key: 'custom' as CategoryKey, label_ar: '', label_en: '', icon: '📦', order: 10, isVisible: true });
                addToast('تم إضافة التصنيف بنجاح', 'success');
            }
        } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'categories');
            addToast('فشل في حفظ التصنيف', 'error');
        }
    };

    const handleDeleteCategory = async (key: string) => {
        if (window.confirm('حذف هذا التصنيف؟')) {
            try {
                await deleteDoc(doc(db, 'categories', key));
                addToast('تم حذف التصنيف', 'info');
            } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, 'categories');
                addToast('فشل في حذف التصنيف', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 text-primary" />
                    {editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="المفتاح (e.g. fruits)"
                        className="p-2 border rounded-lg"
                        value={editingCategory ? editingCategory.key : newCategory.key}
                        onChange={e => editingCategory ? setEditingCategory({ ...editingCategory, key: e.target.value as CategoryKey }) : setNewCategory({ ...newCategory, key: e.target.value as CategoryKey })}
                        disabled={!!editingCategory}
                    />
                    <input
                        type="text"
                        placeholder="الاسم بالعربية"
                        className="p-2 border rounded-lg"
                        value={editingCategory ? editingCategory.label_ar : newCategory.label_ar}
                        onChange={e => editingCategory ? setEditingCategory({ ...editingCategory, label_ar: e.target.value }) : setNewCategory({ ...newCategory, label_ar: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="الاسم بالإنجليزية"
                        className="p-2 border rounded-lg"
                        value={editingCategory ? editingCategory.label_en : newCategory.label_en}
                        onChange={e => editingCategory ? setEditingCategory({ ...editingCategory, label_en: e.target.value }) : setNewCategory({ ...newCategory, label_en: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="الأيقونة (Emoji)"
                        className="p-2 border rounded-lg"
                        value={editingCategory ? editingCategory.icon : newCategory.icon}
                        onChange={e => editingCategory ? setEditingCategory({ ...editingCategory, icon: e.target.value }) : setNewCategory({ ...newCategory, icon: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="الترتيب"
                        className="p-2 border rounded-lg"
                        value={editingCategory ? editingCategory.order : newCategory.order}
                        onChange={e => editingCategory ? setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) }) : setNewCategory({ ...newCategory, order: parseInt(e.target.value) })}
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={editingCategory ? editingCategory.isVisible : newCategory.isVisible}
                            onChange={e => editingCategory ? setEditingCategory({ ...editingCategory, isVisible: e.target.checked }) : setNewCategory({ ...newCategory, isVisible: e.target.checked })}
                        />
                        <label>مرئي في المتجر</label>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button onClick={handleSaveCategory} className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                        {editingCategory ? 'تحديث' : 'إضافة'}
                    </button>
                    {editingCategory && (
                        <button onClick={() => setEditingCategory(null)} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                            إلغاء
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-bold">الأيقونة</th>
                            <th className="p-4 font-bold">المفتاح</th>
                            <th className="p-4 font-bold">الاسم (AR)</th>
                            <th className="p-4 font-bold">الاسم (EN)</th>
                            <th className="p-4 font-bold">الترتيب</th>
                            <th className="p-4 font-bold">الحالة</th>
                            <th className="p-4 font-bold">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.sort((a, b) => a.order - b.order).map(cat => (
                            <tr key={cat.key} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-2xl">{cat.icon}</td>
                                <td className="p-4 font-mono text-sm text-gray-500">{cat.key}</td>
                                <td className="p-4 font-bold">{cat.label_ar}</td>
                                <td className="p-4">{cat.label_en}</td>
                                <td className="p-4">{cat.order}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${cat.isVisible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {cat.isVisible ? 'مرئي' : 'مخفي'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingCategory(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteCategory(cat.key)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-4 h-4" />
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
