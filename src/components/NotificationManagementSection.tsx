import React, { useState, useEffect } from 'react';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { BellIcon, TrashIcon, UserIcon, SparklesIcon, CheckCircleIcon, AlertTriangleIcon } from './lib/contexts/Icons';
import { db, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, handleFirestoreError, OperationType, limit } from '@/firebase';

export const NotificationManagementSection: React.FC = () => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { user } = useFirebase();
    
    // States
    const [notifications, setNotifications] = useState<any[]>([]);
    const [fcmTokensCount, setFcmTokensCount] = useState<number>(0);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [targetType, setTargetType] = useState<'all' | 'vip' | 'driver' | 'specific'>('all');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [orderId, setOrderId] = useState<string>('');
    
    const [newNotification, setNewNotification] = useState({
        title_ar: '',
        title_en: '',
        message_ar: '',
        message_en: '',
        type: 'promo' // promo, info, warning, success, error, order
    });

    const isAuthorized = user && ['admin', 'developer', 'ops', 'gm', 'branch_manager'].includes(user.role);

    // Real-time subscriptions
    useEffect(() => {
        if (!db || !isAuthorized) {
            setLoading(false);
            return;
        }
        setLoading(true);

        // 1. Subscribe to notifications
        const notifQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
        const unsubscribeNotifs = onSnapshot(notifQuery, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));

        // 2. Subscribe to fcm_tokens to show live counter
        const fcmQuery = query(collection(db, 'fcm_tokens'));
        const unsubscribeFcm = onSnapshot(fcmQuery, (snapshot) => {
            setFcmTokensCount(snapshot.size);
        }, (err) => console.warn('FCM tokens subscriber error:', err));

        // 3. Subscribe to users for individual targeting
        const usersQuery = query(collection(db, 'users'), limit(100));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.warn('Users subscriber error:', err));

        return () => {
            unsubscribeNotifs();
            unsubscribeFcm();
            unsubscribeUsers();
        };
    }, [isAuthorized]);

    // Preset Quick Fills
    const applyPreset = (presetKey: string) => {
        const presets: Record<string, typeof newNotification> = {
            offer: {
                title_ar: '🔥 عرض خاص اليوم من نجوم دلتا!',
                title_en: '🔥 Exclusive Daily Offer from Delta Stars!',
                message_ar: 'خصم ٢٥٪ على جميع منتجاتنا الطازجة اليوم فقط! أدخل الرمز واستمتع بالتوصيل الفوري المجاني.',
                message_en: '25% discount on all our fresh products today only! Enter the code and enjoy instant free delivery.',
                type: 'promo'
            },
            cashback: {
                title_ar: '💰 استرداد نقدي فوري بمناسبة نهاية الأسبوع',
                title_en: '💰 Instant Cashback for the Weekend',
                message_ar: 'اشترِ بقيمة ٢٠٠ ريال أو أكثر واحصل على كاش باك بقيمة ٥٠ ريال فوراً في محفظتك الإلكترونية.',
                message_en: 'Buy for 200 SAR or more and get 50 SAR cashback instantly in your digital wallet.',
                type: 'success'
            },
            maintenance: {
                title_ar: '🔧 تحديث مجدول للنظام',
                title_en: '🔧 Scheduled System Maintenance',
                message_ar: 'سيتم إجراء صيانة سريعة لنظام الدفع الليلة الساعة ٣ صباحاً لمدة ١٠ دقائق لضمان جودة الخدمة.',
                message_en: 'Quick payment system maintenance will occur tonight at 3:00 AM for 10 minutes to improve performance.',
                type: 'warning'
            }
        };

        const preset = presets[presetKey];
        if (preset) {
            setNewNotification(preset);
            addToast(language === 'ar' ? 'تم تطبيق القالب بنجاح' : 'Preset template applied', 'success');
        }
    };

    const handleSendNotification = async () => {
        if (!newNotification.title_ar || !newNotification.message_ar) {
            addToast(language === 'ar' ? 'الرجاء ملء الحقول الأساسية بالعربية' : 'Please fill out basic Arabic fields', 'error');
            return;
        }

        try {
            // Determine targeting userId
            let userId = 'all';
            if (targetType === 'specific') {
                if (!selectedUser) {
                    addToast(language === 'ar' ? 'الرجاء اختيار مستخدم محدد' : 'Please select a specific user', 'warning');
                    return;
                }
                userId = selectedUser;
            } else if (targetType === 'vip') {
                userId = 'vip_segment';
            } else if (targetType === 'driver') {
                userId = 'driver_segment';
            }

            await addDoc(collection(db, 'notifications'), {
                ...newNotification,
                userId,
                orderId: orderId || null,
                createdAt: new Date().toISOString(),
                isRead: false
            });

            // Reset
            setNewNotification({ title_ar: '', title_en: '', message_ar: '', message_en: '', type: 'promo' });
            setOrderId('');
            setSelectedUser('');
            
            addToast(
                language === 'ar' ? 'تم إرسال وبث الإشعار الفوري بنجاح' : 'Instant push notification broadcasted successfully', 
                'success'
            );
        } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'notifications');
            addToast(language === 'ar' ? 'فشل في إرسال الإشعار' : 'Failed to send notification', 'error');
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', id));
            addToast(language === 'ar' ? 'تم حذف الإشعار' : 'Notification deleted', 'info');
        } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, 'notifications');
        }
    };

    const ar = language === 'ar';

    return (
        <div className="space-y-8 animate-fade-in text-slate-800">
            {/* Header with Title and FCM Counters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-tr from-slate-900 via-primary to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center border border-secondary/40">
                        <BellIcon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-wide font-tajawal">
                            {ar ? 'مركز بث إشعارات FCM الفورية' : 'FCM Real-Time Push Console'}
                        </h2>
                        <p className="text-xs text-slate-300 font-medium">
                            {ar ? 'تواصل فوري مع العملاء والسائقين بشكل ذكي' : 'Communicate seamlessly with customers and drivers'}
                        </p>
                    </div>
                </div>

                {/* Device counter badge */}
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs md:text-sm font-black font-mono">
                        {fcmTokensCount} {ar ? 'أجهزة نشطة مسجلة' : 'Active Registered Devices'}
                    </span>
                </div>
            </div>

            {/* Main grid: Form vs Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form column (takes 2 cols) */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-primary border-b pb-3 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-secondary" />
                        {ar ? 'صياغة الإشعار والبث الفوري' : 'Draft & Push Notification'}
                    </h3>

                    {/* Quick presets */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                            {ar ? 'اختر قالب سريع للتسهيل:' : 'Quick Templates:'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => applyPreset('offer')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-lg transition-colors border border-rose-200/50"
                            >
                                🔥 {ar ? 'عرض اليوم' : 'Daily Offer'}
                            </button>
                            <button
                                onClick={() => applyPreset('cashback')}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg transition-colors border border-emerald-200/50"
                            >
                                💰 {ar ? 'كاش باك' : 'Cashback Promo'}
                            </button>
                            <button
                                onClick={() => applyPreset('maintenance')}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-black rounded-lg transition-colors border border-amber-200/50"
                            >
                                🔧 {ar ? 'صيانة النظام' : 'Maintenance Alert'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Target type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                {ar ? 'الشريحة المستهدفة بالبث' : 'Target Audience'}
                            </label>
                            <select
                                value={targetType}
                                onChange={e => setTargetType(e.target.value as any)}
                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-sm"
                            >
                                <option value="all">📢 {ar ? 'جميع مستخدمي المتجر' : 'All App Users (Broadcast)'}</option>
                                <option value="vip">💎 {ar ? 'عملاء النخبة VIP فقط' : 'VIP Customers Only'}</option>
                                <option value="driver">🚗 {ar ? 'سائقي نجوم دلتا فقط' : 'Delivery Drivers Only'}</option>
                                <option value="specific">👤 {ar ? 'مستقبل محدد (مخصص)' : 'Specific Individual User'}</option>
                            </select>
                        </div>

                        {/* Custom fields based on target */}
                        {targetType === 'specific' && (
                            <div className="space-y-2 animate-slide-up">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    {ar ? 'اختر العميل المستهدف' : 'Select Destination User'}
                                </label>
                                <select
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-sm"
                                >
                                    <option value="">{ar ? '-- اختر من القائمة --' : '-- Choose User --'}</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.uid || u.id}>
                                            {u.displayName || u.name || u.email} ({u.role || 'client'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Order ID linkage */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                {ar ? 'ربط برقم طلب محدد (اختياري)' : 'Link to Order ID (Optional)'}
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. ord-1052"
                                value={orderId}
                                onChange={e => setOrderId(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-sm"
                            />
                        </div>

                        {/* Notification Category */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                {ar ? 'تصنيف ولون الإشعار' : 'Alert Severity Category'}
                            </label>
                            <select
                                value={newNotification.type}
                                onChange={e => setNewNotification({...newNotification, type: e.target.value})}
                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-sm"
                            >
                                <option value="promo">🎁 {ar ? 'عروض ترويجية (Promo)' : 'Promotion (Promo)'}</option>
                                <option value="info">ℹ️ {ar ? 'معلومات عامة (Info)' : 'General Information (Info)'}</option>
                                <option value="success">✅ {ar ? 'نجاح واكتمال (Success)' : 'Success / Confirmation'}</option>
                                <option value="warning">⚠️ {ar ? 'تنبيه وتحذير (Warning)' : 'Warning / Alert'}</option>
                                <option value="error">🚨 {ar ? 'خطأ بالنظام (Error)' : 'Critical Error / Issue'}</option>
                            </select>
                        </div>
                    </div>

                    {/* Multilingual Text Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                        {/* Arabic translation */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 flex items-center gap-1">
                                🇸🇦 {ar ? 'المحتوى باللغة العربية' : 'Arabic Translation'}
                            </h4>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400">{ar ? 'عنوان الإشعار' : 'Title'}</label>
                                <input
                                    type="text"
                                    placeholder="العنوان بالعربية"
                                    value={newNotification.title_ar}
                                    onChange={e => setNewNotification({...newNotification, title_ar: e.target.value})}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400">{ar ? 'نص الرسالة' : 'Message Text'}</label>
                                <textarea
                                    placeholder="نص الرسالة بالعربية"
                                    value={newNotification.message_ar}
                                    onChange={e => setNewNotification({...newNotification, message_ar: e.target.value})}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none h-24 text-sm"
                                />
                            </div>
                        </div>

                        {/* English translation */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 flex items-center gap-1">
                                🇬🇧 {ar ? 'المحتوى باللغة الإنجليزية' : 'English Translation'}
                            </h4>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400">{ar ? 'عنوان الإشعار (EN)' : 'Title (EN)'}</label>
                                <input
                                    type="text"
                                    placeholder="Title in English"
                                    value={newNotification.title_en}
                                    onChange={e => setNewNotification({...newNotification, title_en: e.target.value})}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400">{ar ? 'نص الرسالة (EN)' : 'Message Text (EN)'}</label>
                                <textarea
                                    placeholder="Message in English"
                                    value={newNotification.message_en}
                                    onChange={e => setNewNotification({...newNotification, message_en: e.target.value})}
                                    className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none h-24 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSendNotification}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-black text-base shadow-lg hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                    >
                        <BellIcon className="w-5 h-5 text-secondary" />
                        {ar ? 'بث الإشعار الفوري الآن عبر FCM' : 'Broadcast & Send Push Alert via FCM'}
                    </button>
                </div>

                {/* Statistics & Help Guidelines (takes 1 col) */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 flex flex-col justify-between space-y-6">
                    <div>
                        <h3 className="text-base font-black text-primary mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary" />
                            {ar ? 'تفاصيل الأجهزة النشطة' : 'Live Registered Channels'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
                            {ar 
                                ? 'يتم حفظ وتسجيل رموز FCM الفورية تلقائياً بمجرد سماح العميل بالإشعارات على متصفحه. يتم تحديث القنوات المسجلة بشكل لحظي عند مغادرة المتجر أو عودته.'
                                : 'FCM delivery tokens are automatically cached and kept alive on the Firestore ledger. Segment and user routes allow precision-targeted targeting dynamically.'}
                        </p>

                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">{ar ? 'إجمالي الرموز' : 'Total Web Tokens'}</span>
                                <span className="text-base font-black font-mono text-primary">{fcmTokensCount}</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">{ar ? 'أجهزة متصفح الجوال' : 'Mobile Web Viewers'}</span>
                                <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">ACTIVE</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">{ar ? 'تطبيقات الأندرويد والآيفون' : 'Android & iOS App'}</span>
                                <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">CONNECTED</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <h4 className="text-xs font-black text-primary mb-2 flex items-center gap-1.5">
                            <CheckCircleIcon className="w-4 h-4 text-secondary" />
                            {ar ? 'تذكير أمان PCI-DSS' : 'PCI-DSS Compliance'}
                        </h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                            {ar 
                                ? 'لا يتم تخزين أو بث أي بيانات دفع حساسة في نظام الإشعارات. تقتصر التنبيهات على العروض الترويجية وتغييرات حالة الطلب العامة فقط.'
                                : 'No payment card, PII, or security keys are allowed to be transmitted over broadcast channels. Only promotional and general status keys are supported.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Notifications Sent History Log */}
            <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <BellIcon className="w-5 h-5 text-primary animate-bounce" />
                    {ar ? 'سجل بث الإشعارات الأخير' : 'Notification Broadcast Log'}
                </h3>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-400 font-bold text-sm">
                        {ar ? 'لا يوجد أي إشعارات مرسلة في السجل حالياً.' : 'No notification logs recorded.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notifications.map(n => (
                            <div key={n.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        n.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' :
                                        n.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                                        n.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        n.type === 'promo' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                        'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                        <BellIcon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-black text-sm text-slate-800">{ar ? n.title_ar : n.title_en}</h4>
                                            
                                            {/* Target segment badge */}
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                                {n.userId === 'all' ? (ar ? 'للجميع' : 'Broadcast') :
                                                 n.userId === 'vip_segment' ? (ar ? '💎 VIP' : 'VIP Only') :
                                                 n.userId === 'driver_segment' ? (ar ? '🚗 سائقين' : 'Drivers Only') :
                                                 (ar ? '👤 مستخدم' : 'User targeted')}
                                            </span>

                                            {n.orderId && (
                                                <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                                    #{n.orderId}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                            {ar ? n.message_ar : n.message_en}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-bold font-mono">
                                            {new Date(n.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US')}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteNotification(n.id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white shrink-0"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
