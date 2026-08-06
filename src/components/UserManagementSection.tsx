import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { ShieldCheckIcon, UserIcon, CheckCircleIcon, XIcon } from './lib/contexts/Icons';
import { db, collection, getDocs, updateDoc, doc, handleFirestoreError, OperationType } from '@/firebase';
import { sanitizeEmailForDisplay } from '../constants';

export const UserManagementSection: React.FC = () => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { updateUserPermissions } = useFirebase();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            setAllUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)));
        } catch (err) {
            handleFirestoreError(err, OperationType.LIST, 'users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateUserRole = async (userId: string, type: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { type });
            addToast(language === 'ar' ? 'تم تحديث دور المستخدم' : 'User role updated', 'success');
            fetchUsers();
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في التحديث' : 'Update failed', 'error');
        }
    };

    const togglePermission = async (userId: string, permission: string) => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        const currentPermissions = user.permissions || [];
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter(p => p !== permission)
            : [...currentPermissions, permission];
        
        try {
            await updateUserPermissions(userId, newPermissions);
            addToast(language === 'ar' ? 'تم تحديث الصلاحيات' : 'Permissions updated', 'success');
            fetchUsers();
        } catch (err) {
            addToast(language === 'ar' ? 'فشل في التحديث' : 'Update failed', 'error');
        }
    };

    const PERMISSIONS_LIST = [
        { id: 'receive_orders', label: 'استقبال الطلبات' },
        { id: 'manage_prices', label: 'تعديل الأسعار' },
        { id: 'manage_ads', label: 'إدارة الإعلانات' },
        { id: 'view_reports', label: 'عرض التقارير' },
        { id: 'manage_inventory', label: 'إدارة المخزون' },
        { id: 'manage_products', label: 'إدارة المنتجات' },
        { id: 'manage_categories', label: 'إدارة الأصناف' },
        { id: 'manage_units', label: 'إدارة الوحدات' },
        { id: 'manage_branches', label: 'إدارة الفروع' },
        { id: 'manage_coupons', label: 'إدارة الكوبونات' },
        { id: 'manage_showroom', label: 'إدارة صالة العرض' },
        { id: 'manage_legal', label: 'إدارة الصفحات القانونية' },
        { id: 'manage_notifications', label: 'إدارة الإشعارات' },
        { id: 'view_ai_insights', label: 'عرض توقعات AI' },
        { id: 'manage_accounting', label: 'إدارة النظام المحاسبي' }
    ];

    if (loading) return <div className="p-20 text-center font-black text-2xl animate-pulse">جاري تحميل قاعدة بيانات المستخدمين...</div>;

    return (
        <div className="space-y-8 md:space-y-12 animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 uppercase flex items-center gap-4">
                <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                {language === 'ar' ? 'إدارة الصلاحيات والوصول' : 'User Access Control'}
            </h2>
            <div className="bg-white rounded-2xl md:rounded-[3rem] border-2 border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-right min-w-[800px]">
                    <thead className="bg-slate-50 border-b-2 border-gray-100">
                        <tr>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest min-w-[200px]">المستخدم</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">الدور</th>
                            <th className="p-4 md:p-6 font-black text-slate-400 uppercase text-[10px] md:text-xs tracking-widest min-w-[400px]">الصلاحيات الممنوحة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 md:p-6">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-lg md:text-xl">
                                            {(u.name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm md:text-lg">{u.name || 'مستخدم جديد'}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 font-bold break-all">{sanitizeEmailForDisplay(u.email)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 md:p-6">
                                    <select 
                                        value={u.type || 'client'}
                                        onChange={e => handleUpdateUserRole(u.id!, e.target.value)}
                                        className="p-3 md:p-4 bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black outline-none focus:border-primary transition-all"
                                    >
                                        <option value="client">عميل (Client)</option>
                                        <option value="vip">عميل VIP</option>
                                        <option value="marketing">تسويق (Marketing)</option>
                                        <option value="admin">مدير (Admin)</option>
                                        <option value="ops">عمليات (Operations)</option>
                                        <option value="delegate">مندوب (Delegate)</option>
                                        <option value="developer">مطور (Developer)</option>
                                    </select>
                                </td>
                                <td className="p-4 md:p-6">
                                    <div className="flex flex-wrap gap-2">
                                        {PERMISSIONS_LIST.map(perm => (
                                            <button
                                                key={perm.id}
                                                onClick={() => togglePermission(u.id!, perm.id)}
                                                className={`px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black transition-all border-2 ${
                                                    (u.permissions || []).includes(perm.id)
                                                        ? 'bg-primary text-white border-primary shadow-lg scale-105'
                                                        : 'bg-white text-gray-400 border-gray-100 hover:border-primary'
                                                }`}
                                            >
                                                {perm.label}
                                            </button>
                                        ))}
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
