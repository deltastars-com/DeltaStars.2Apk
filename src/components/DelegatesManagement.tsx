import React, { useState, useEffect, useMemo } from 'react';
import { useFirebase, useI18n, useToast } from './lib/contexts';
import { 
  TruckIcon, UserIcon, MapPinIcon, PlusIcon, SearchIcon, 
  BarChartIcon, CalendarIcon, StarIcon, DollarSignIcon,
  TrendingUpIcon, CheckCircleIcon, ClockIcon, FilterIcon,
  ShieldCheckIcon, RefreshCcwIcon
} from './lib/contexts/Icons';
import { db, collection, query, onSnapshot, updateDoc, doc, where, addDoc, deleteDoc } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function DelegatesManagement() {
  const { language } = useI18n();
  const { addToast } = useToast();
  const { user } = useFirebase();
  const [delegates, setDelegates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'performance' | 'simulation'>('list');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Simulator Logs State
  const [simLogs, setSimLogs] = useState<any[]>([
    { id: 1, time: new Date().toLocaleTimeString(), text_ar: 'تم تهيئة مركز التحكم والمراقبة اللوجستية بالوقت الفعلي', text_en: 'Real-time logistics control center initialized', type: 'info' }
  ]);
  const [selectedSimDriver, setSelectedSimDriver] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    assignedBranchId: '1',
    authorized_branches: [] as string[],
    branch_permissions: [] as string[],
    delegateStatus: 'active',
    vehiclePlate: '',
    vehicleType: 'Car',
    security_pin: '654321',
    type: 'driver',
    portal_auth_code: ''
  });

  const isAuthorized = user && ['admin', 'developer', 'ops', 'gm', 'branch_manager'].includes(user.role);

  useEffect(() => {
    if (!db || !isAuthorized) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Real-time Delegates & Drivers
    const qDelegates = query(collection(db, 'users'), where('type', 'in', ['delegate', 'driver']));
    const unsubDelegates = onSnapshot(qDelegates, (snapshot) => {
      const delegateUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDelegates(delegateUsers);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to delegates:', err);
      setLoading(false);
    });

    // 2. Real-time Orders
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(allOrders);
    }, (err) => {
      console.error('Error listening to orders:', err);
    });

    // 3. Real-time Branches
    const qBranches = query(collection(db, 'branches'));
    const unsubBranches = onSnapshot(qBranches, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBranches(list);
    }, (err) => {
      console.error('Error listening to branches:', err);
    });

    return () => {
      unsubDelegates();
      unsubOrders();
      unsubBranches();
    };
  }, [db, isAuthorized]);

  // Fallback branches list if database hasn't loaded any branches yet
  const displayBranches = useMemo(() => {
    if (branches && branches.length > 0) return branches;
    return [
      { id: '1', name_ar: 'الفرع الرئيسي - جدة', name_en: 'Jeddah Main HQ', city: 'جدة' },
      { id: '2', name_ar: 'فرع الرياض', name_en: 'Riyadh Branch', city: 'الرياض' },
      { id: '3', name_ar: 'فرع مكة المكرمة', name_en: 'Makkah Branch', city: 'مكة المكرمة' },
      { id: '4', name_ar: 'فرع المدينة المنورة', name_en: 'Madinah Branch', city: 'المدينة المنورة' },
      { id: '5', name_ar: 'فرع أبها', name_en: 'Abha Branch', city: 'أبها' },
      { id: '6', name_ar: 'فرع الدمام', name_en: 'Dammam Branch', city: 'الدمام' }
    ];
  }, [branches]);

  const handleSendWhatsAppCode = (delegate: any) => {
    if (!delegate.portal_auth_code) return;
    
    // Clean phone number
    let rawPhone = delegate.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, ''); // keep only digits
    if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
      cleanPhone = '966' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      cleanPhone = '966' + cleanPhone;
    }
    
    const portalLink = `${window.location.origin}/?page=driver_dashboard`;
    
    const arabicMessage = `🌟 *متجر نجوم دلتا للتجارة • Delta Stars Co.* 🌟\n\nأهلاً بك يا *${delegate.name || ''}* في فريق العمل واللوجستيات الموحد لمتجر نجوم دلتا للتجارة!\nلقد قام مشرف النظام بتوليد وتفعيل الرمز التوثيقي الآمن لبوابة المناديب والسائقين الخاصة بك.\n\n🔑 *الرمز التوثيقي المشفر الخاص بك:* \`${delegate.portal_auth_code}\`\n📌 *كلمة المرور الافتراضية (PIN):* \`654321\` (سيُطلب منك تغييرها فور تسجيل دخولك الأول لضمان أمان حسابك).\n\n🔗 *رابط بوابة السائقين والمناديب:* ${portalLink}\n\n_تنبيه أمان: يرجى عدم مشاركة هذا الكود والرمز التوثيقي مع أي شخص خارج نطاق الإدارة العليا ومطوري دلتا ستارز._`;
    
    const englishMessage = `🌟 *Delta Stars Trading Co. • Portal Authorization* 🌟\n\nHello *${delegate.name || ''}*, welcome to the unified logistics and delivery team at Delta Stars!\nThe system administrator has generated and activated your secure cryptographic entrance token.\n\n🔑 *Your Unique Authorization Token:* \`${delegate.portal_auth_code}\`\n📌 *Default Password (PIN):* \`654321\` (You will be prompted to change it upon first login to secure your account).\n\n🔗 *Logistics Portal Link:* ${portalLink}\n\n_Security Alert: Please do not share this token or credentials with anyone outside the general management and developer team of Delta Stars._`;
    
    const message = language === 'ar' ? arabicMessage : englishMessage;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    addToast(language === 'ar' ? 'جاري توجيهك إلى واتساب لإرسال الكود...' : 'Redirecting to WhatsApp to send code...', 'success');
  };

  const handleStatusChange = async (delegateId: string, status: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', delegateId), { delegateStatus: status });
      addToast(language === 'ar' ? 'تم تحديث حالة المندوب بالوقت الفعلي' : 'Delegate status updated in real-time', 'success');
      
      const driver = delegates.find(d => d.id === delegateId);
      if (driver) {
        addSimLog(`تغيير حالة السائق ${driver.name} إلى: ${status === 'active' ? 'متاح' : status === 'busy' ? 'مشغول' : 'غير نشط'}`, 
                  `Driver ${driver.name} status changed to: ${status}`, 'info');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  const addSimLog = (text_ar: string, text_en: string, type: 'info' | 'success' | 'warn' | 'action' = 'info') => {
    setSimLogs(prev => [
      { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text_ar, text_en, type },
      ...prev.slice(0, 49)
    ]);
  };

  // Cryptographic Secure Token Generator Utility
  const generateSecureToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segment1 = '';
    let segment2 = '';
    for (let i = 0; i < 4; i++) {
      segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
      segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const pin = Math.floor(1000 + Math.random() * 9000);
    return `DS-DRV-${segment1}-${segment2}-${pin}`;
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      assignedBranchId: displayBranches[0]?.id || '1',
      authorized_branches: [displayBranches[0]?.id || '1'],
      branch_permissions: ['order_dispatch', 'delivery_signature'],
      delegateStatus: 'active',
      vehiclePlate: '',
      vehicleType: 'Car',
      security_pin: Math.floor(100000 + Math.random() * 900000).toString(),
      type: 'driver',
      portal_auth_code: generateSecureToken()
    });
    setIsModalOpen(true);
  };

  const openEditModal = (delegate: any) => {
    setModalMode('edit');
    setSelectedId(delegate.id);
    setFormData({
      name: delegate.name || '',
      phone: delegate.phone || '',
      email: delegate.email || '',
      assignedBranchId: delegate.assignedBranchId || '1',
      authorized_branches: delegate.authorized_branches || [delegate.assignedBranchId || '1'],
      branch_permissions: delegate.branch_permissions || ['order_dispatch', 'delivery_signature'],
      delegateStatus: delegate.delegateStatus || 'active',
      vehiclePlate: delegate.vehiclePlate || '',
      vehicleType: delegate.vehicleType || 'Car',
      security_pin: delegate.security_pin || '654321',
      type: delegate.type || delegate.role || 'driver',
      portal_auth_code: delegate.portal_auth_code || generateSecureToken()
    });
    setIsModalOpen(true);
  };

  const handleDeleteDelegate = async (delegateId: string) => {
    if (!db) return;
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من سحب صلاحيات وحذف هذا الكادر نهائياً؟' : 'Are you sure you want to permanently revoke credentials and delete this agent?')) return;
    try {
      const driver = delegates.find(d => d.id === delegateId);
      await deleteDoc(doc(db, 'users', delegateId));
      addToast(language === 'ar' ? 'تم حذف الكادر وسحب الصلاحيات والرمز التوثيقي' : 'Agent deleted and authentication credentials revoked successfully', 'success');
      if (driver) {
        addSimLog(`تم سحب صلاحيات وإلغاء حساب السائق: ${driver.name}`, `Revoked access credentials for driver: ${driver.name}`, 'warn');
      }
    } catch (err) {
      addToast('Error deleting agent', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.name || !formData.phone) {
      addToast(language === 'ar' ? 'يرجى إدخال الاسم ورقم الهاتف بالكامل' : 'Please input full name and phone number', 'error');
      return;
    }

    try {
      if (modalMode === 'add') {
        const docRef = await addDoc(collection(db, 'users'), {
          ...formData,
          createdAt: new Date().toISOString(),
          avatar: ''
        });
        addToast(language === 'ar' ? 'تم تسجيل الكادر وتفعيل الرمز التوثيقي الآمن وصلاحيات الفروع بنجاح' : 'Field agent registered and branch authorizations activated', 'success');
        addSimLog(`تسجيل الكادر الجديد ${formData.name} بفرع: ${displayBranches.find(b => b.id === formData.assignedBranchId)?.name_ar}`, 
                  `Registered new field agent ${formData.name} at branch: ${formData.assignedBranchId}`, 'success');
      } else if (modalMode === 'edit' && selectedId) {
        await updateDoc(doc(db, 'users', selectedId), {
          ...formData
        });
        addToast(language === 'ar' ? 'تم تحديث الصلاحيات وتفاصيل الفروع الممنوحة بنجاح' : 'Agent details and branch authorizations updated successfully', 'success');
        addSimLog(`تحديث بيانات الكادر الميداني: ${formData.name}`, `Updated credentials for agent: ${formData.name}`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Error saving field agent', 'error');
    }
  };

  // Multi-branch selection helper
  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => {
      const exists = prev.authorized_branches.includes(branchId);
      const updated = exists 
        ? prev.authorized_branches.filter(id => id !== branchId)
        : [...prev.authorized_branches, branchId];
      return { ...prev, authorized_branches: updated };
    });
  };

  // Permission selection helper
  const handlePermissionToggle = (permId: string) => {
    setFormData(prev => {
      const exists = prev.branch_permissions.includes(permId);
      const updated = exists 
        ? prev.branch_permissions.filter(p => p !== permId)
        : [...prev.branch_permissions, permId];
      return { ...prev, branch_permissions: updated };
    });
  };

  // Live simulation trigger
  const runSimulationStep = async (step: 'gps' | 'signature' | 'delay' | 'online') => {
    if (!selectedSimDriver) {
      addToast(language === 'ar' ? 'الرجاء اختيار سائق لبدء المحاكاة' : 'Please select a driver to simulate', 'info');
      return;
    }
    const driver = delegates.find(d => d.id === selectedSimDriver);
    if (!driver) return;

    if (step === 'gps') {
      const lat = (24.7 + Math.random() * 0.15).toFixed(4);
      const lng = (46.6 + Math.random() * 0.15).toFixed(4);
      try {
        await updateDoc(doc(db, 'users', selectedSimDriver), {
          location: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          updatedAt: new Date().toISOString()
        });
        addSimLog(`[موقع GPS بالوقت الفعلي] السائق ${driver.name} يرسل إحداثيات جديدة: ${lat}, ${lng}`, 
                  `[Real-time GPS] Driver ${driver.name} broadcasted position: ${lat}, ${lng}`, 'action');
        addToast(language === 'ar' ? 'تم تحديث إحداثيات GPS بالوقت الفعلي' : 'Real-time GPS coordinates updated', 'success');
      } catch (e) {
        console.error(e);
      }
    } else if (step === 'signature') {
      addSimLog(`[إثبات تسليم إلكتروني] العميل يوقع إلكترونياً على جهاز السائق ${driver.name} لتأكيد استلام الطلب`, 
                `[E-Signature Delivery] Client signed on driver ${driver.name}'s handheld device to confirm delivery`, 'success');
      addToast(language === 'ar' ? 'تمت محاكاة التوقيع الإلكتروني بنجاح' : 'E-Signature simulated successfully', 'success');
    } else if (step === 'delay') {
      addSimLog(`[تنبيه لوجستي] السائق ${driver.name} يبلغ عن ازدحام مروري وتأخر تسليم لمدة 15 دقيقة`, 
                `[Logistics Alert] Driver ${driver.name} reported traffic congestion, estimated 15m delay`, 'warn');
      addToast(language === 'ar' ? 'تم تدوين التنبيه اللوجستي بالوقت الفعلي' : 'Logistics alert logged in real-time', 'info');
    } else if (step === 'online') {
      const nextStatus = driver.delegateStatus === 'active' ? 'busy' : 'active';
      await handleStatusChange(selectedSimDriver, nextStatus);
    }
  };

  const performanceData = useMemo(() => {
    return delegates.map(delegate => {
      const delegateOrders = orders.filter(o => 
        (o.driverId === delegate.id || o.assignedDriverId === delegate.id) &&
        o.createdAt >= dateRange.start && o.createdAt <= dateRange.end + 'T23:59:59'
      );

      const completed = delegateOrders.filter(o => o.status === 'delivered');
      const earnings = completed.length * 15; // 15 SAR per delivery standard
      const ratingTotal = delegateOrders.reduce((acc, curr) => acc + (curr.rating || 5), 0);
      const avgRating = delegateOrders.length > 0 ? (ratingTotal / delegateOrders.length).toFixed(1) : '5.0';

      return {
        ...delegate,
        totalOrders: delegateOrders.length,
        completedCount: completed.length,
        earnings,
        avgRating,
        successRate: delegateOrders.length > 0 ? Math.round((completed.length / delegateOrders.length) * 100) : 100
      };
    });
  }, [delegates, orders, dateRange]);

  const filteredDelegates = (activeTab === 'list' ? delegates : performanceData).filter(d => 
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.phone || '').includes(searchTerm)
  );

  const ALL_PERMISSIONS = [
    { id: 'order_dispatch', label_ar: 'استقبال وتوجيه الطلبات اللوجستية', label_en: 'Receive & Dispatch Logistics Orders' },
    { id: 'stock_audit', label_ar: 'صلاحية جرد المخزون والأغذية بالفرع', label_en: 'Branch Stock & Food Audit Rights' },
    { id: 'delivery_signature', label_ar: 'تأكيد التسليم وحفظ التوقيع الإلكتروني', label_en: 'Confirm Deliveries & E-Signatures' },
    { id: 'finance_ledger', label_ar: 'الولوج إلى السجل المالي لعمولات التوصيل', label_en: 'View Commissions & Branch Financials' },
    { id: 'incident_report', label_ar: 'تسجيل الحوادث والتأخيرات الميدانية', label_en: 'Log On-Field Delays & Incidents' }
  ];

  const t = {
    title: language === 'ar' ? 'إدارة المناديب وسائقي الشحن السياديين' : 'Sovereign Driver & Representative Management',
    sub: language === 'ar' ? 'تحكم بالوصول، صلاحيات الفروع والرموز التوثيقية المشفرة بالوقت الفعلي' : 'Control access, branch authorizations, and secure cryptographic tokens in real-time',
    tabList: language === 'ar' ? 'الكوادر النشطة والتراخيص' : 'Active Personnel & Authorization',
    tabPerf: language === 'ar' ? 'مراقبة الأداء والعمولات المالية' : 'Performance & Commission Monitor',
    tabSim: language === 'ar' ? 'محاكي العمليات الميدانية والنشاط' : 'On-Field Live Operations Simulator',
    search: language === 'ar' ? 'البحث بالاسم أو رقم الجوال...' : 'Search by name or mobile...',
    add: language === 'ar' ? 'تسجيل كادر توصيل جديد' : 'Register New Driver/Agent',
    earnings: language === 'ar' ? 'إجمالي العمولات المستحقة' : 'Total Earned Commissions',
    orders: language === 'ar' ? 'شحنات ناجحة' : 'Successful Deliveries',
    rating: language === 'ar' ? 'التقييم الفعلي' : 'Actual Rating',
    success: language === 'ar' ? 'كفاءة التسليم' : 'Delivery Efficiency',
  };

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in font-tajawal">
      {/* Banner / Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-slate-100 gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
            <TruckIcon className="w-8 h-8 text-primary" />
            {t.title}
          </h2>
          <p className="text-gray-400 font-bold text-xs md:text-sm">{t.sub}</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-2xl w-full xl:w-auto">
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white/50'}`}
          >
            📋 {t.tabList}
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'performance' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white/50'}`}
          >
            📈 {t.tabPerf}
          </button>
          <button 
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'simulation' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white/50'}`}
          >
            ⚡ {t.tabSim}
          </button>
        </div>

        <button 
          onClick={openAddModal}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-xs w-full xl:w-auto justify-center"
        >
          <PlusIcon className="w-5 h-5" /> {t.add}
        </button>
      </div>

      {/* Main Contents Panel */}
      <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        {activeTab !== 'simulation' && (
          <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder={t.search} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:border-primary focus:bg-white transition-all text-sm" 
              />
              <SearchIcon className={`w-5 h-5 absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-300`} />
            </div>

            {activeTab === 'performance' && (
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full md:w-auto justify-center">
                 <div className="flex items-center gap-2 px-3">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                      className="bg-transparent font-bold text-xs outline-none"
                    />
                    <span className="text-gray-300">/</span>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                      className="bg-transparent font-bold text-xs outline-none"
                    />
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Display Rendering */}
        {activeTab === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[1000px]">
              <thead className="bg-slate-50/70 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'السائق / المندوب الميداني' : 'Personnel'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'رقم الجوال' : 'Phone'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الرمز التوثيقي المشفر لدخول البوابة 🔐' : 'Secure Auth Token 🔐'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الفرع الرئيسي' : 'Primary Branch'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الفروع المصرح بدخولها' : 'Branch Clearances'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'رخصة المركبة' : 'Vehicle License'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الحالة الميدانية' : 'Field Status'}</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{language === 'ar' ? 'الإجراءات والتحكم' : 'Controls'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-20 text-center font-black text-slate-300 animate-pulse">
                      <RefreshCcwIcon className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                      {language === 'ar' ? 'جاري الاتصال بقاعدة بيانات الكوادر...' : 'Connecting to personnel registry...'}
                    </td>
                  </tr>
                ) : filteredDelegates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-20 text-center font-bold text-slate-400">
                      ⚠️ {language === 'ar' ? 'لا يوجد كوادر مسجلة مطابقة لمعايير البحث' : 'No field agents matched your search criteria'}
                    </td>
                  </tr>
                ) : filteredDelegates.map(delegate => {
                  const assignedBranch = displayBranches.find(b => b.id === delegate.assignedBranchId) || displayBranches[0];
                  const authBranchesCount = (delegate.authorized_branches || [delegate.assignedBranchId]).length;
                  
                  return (
                    <tr key={delegate.id} className="hover:bg-slate-50/50 transition-all group">
                      {/* Name & Role */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-all">
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="font-black text-slate-800 block text-sm">{delegate.name || 'مجهول الاسم'}</span>
                            <span className="text-[10px] font-black uppercase text-yellow-600 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-lg mt-0.5 inline-block">
                              {delegate.type === 'driver' ? (language === 'ar' ? '🚚 سائق شاحنة مبرد' : '🚚 Logistics Driver') : (language === 'ar' ? '💼 مندوب شركات' : '💼 B2B Representative')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-8 py-5 font-bold text-slate-500 text-sm">{delegate.phone || '---'}</td>

                      {/* Cryptographic Secure Code */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono font-black text-xs tracking-wider shadow-sm">
                            🔑 {delegate.portal_auth_code || '---'}
                          </span>
                          {delegate.portal_auth_code && (
                            <>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(delegate.portal_auth_code);
                                  addToast(language === 'ar' ? 'تم نسخ الرمز التوثيقي بنجاح' : 'Copied secure authorization token', 'success');
                                }}
                                className="hover:scale-110 active:scale-95 transition-all text-xs bg-slate-100 hover:bg-slate-200 p-1.5 rounded-xl border border-slate-200"
                                title={language === 'ar' ? 'نسخ الرمز' : 'Copy Token'}
                              >
                                📋
                              </button>
                              <button 
                                onClick={() => handleSendWhatsAppCode(delegate)}
                                className="hover:scale-110 active:scale-95 transition-all text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 p-1.5 rounded-xl flex items-center justify-center"
                                title={language === 'ar' ? 'إرسال الرمز عبر واتساب' : 'Send via WhatsApp'}
                              >
                                🟢
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Primary Branch */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
                          <MapPinIcon className="w-4 h-4 text-red-500" />
                          <span>{language === 'ar' ? assignedBranch?.name_ar : assignedBranch?.name_en}</span>
                        </div>
                      </td>

                      {/* Clearances (Multi-Branch permissions) */}
                      <td className="px-8 py-5">
                        <span className="bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-black inline-block">
                          ✅ {authBranchesCount} {language === 'ar' ? 'فروع مصرحة' : 'Authorized Branches'}
                        </span>
                      </td>

                      {/* Vehicle License */}
                      <td className="px-8 py-5">
                        {delegate.vehiclePlate ? (
                          <div className="text-xs font-bold text-slate-700 space-y-0.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black border border-slate-200">{delegate.vehicleType || 'Car'}</span>
                            <div className="font-mono tracking-widest text-slate-500">{delegate.vehiclePlate}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">---</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          delegate.delegateStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          delegate.delegateStatus === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          ● {delegate.delegateStatus === 'active' ? (language === 'ar' ? 'متاح ونشط' : 'Active & Available') : 
                             delegate.delegateStatus === 'busy' ? (language === 'ar' ? 'مشغول بالتوصيل' : 'Busy Delivering') : 
                             (language === 'ar' ? 'محظور / معلق' : 'Suspended')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(delegate)}
                            className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 p-2.5 rounded-xl transition-all font-black text-xs"
                            title={language === 'ar' ? 'تعديل الصلاحيات والبيانات' : 'Edit authorizations & details'}
                          >
                            ⚙️ {language === 'ar' ? 'صلاحيات' : 'Auth'}
                          </button>
                          <button 
                            onClick={() => handleDeleteDelegate(delegate.id)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-2.5 rounded-xl transition-all font-black text-xs"
                            title={language === 'ar' ? 'حذف الحساب' : 'Delete credentials'}
                          >
                            🗑️
                          </button>
                          <select 
                            value={delegate.delegateStatus || 'inactive'}
                            onChange={(e) => handleStatusChange(delegate.id, e.target.value)}
                            className="bg-slate-100 p-2 rounded-xl text-xs font-black outline-none border-none focus:ring-2 focus:ring-primary cursor-pointer text-slate-700"
                          >
                            <option value="active">{language === 'ar' ? 'متاح' : 'Active'}</option>
                            <option value="busy">{language === 'ar' ? 'مشغول' : 'Busy'}</option>
                            <option value="inactive">{language === 'ar' ? 'محجوب' : 'Block'}</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Performance & Earnings Tracker */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 md:p-10">
            {loading ? (
              <div className="col-span-full p-20 text-center font-black text-slate-400 animate-pulse">
                {language === 'ar' ? 'جاري تجميع التقارير والعمولات الميدانية...' : 'Compiling performance matrix...'}
              </div>
            ) : filteredDelegates.length === 0 ? (
              <div className="col-span-full p-20 text-center font-black text-slate-400">
                {language === 'ar' ? 'لا توجد عمولات أو سجلات أداء متاحة للفترة المحددة' : 'No performance logs found for selected period'}
              </div>
            ) : filteredDelegates.map((perf: any) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={perf.id} 
                className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all group"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl shadow-md p-1 border-2 border-primary/10 flex items-center justify-center text-primary font-black">
                          {perf.name ? perf.name[0].toUpperCase() : 'DR'}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 text-sm">{perf.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400">{perf.phone}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-black">
                       <StarIcon className="w-3 h-3 fill-yellow-500" />
                       {perf.avgRating}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-1.5 mb-1">
                          <DollarSignIcon className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-gray-400">{t.earnings}</span>
                       </div>
                       <p className="text-lg font-black text-emerald-600">{perf.earnings} <small className="text-[10px]">ر.س</small></p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-[10px] font-black text-gray-400">{t.orders}</span>
                       </div>
                       <p className="text-lg font-black text-blue-600">{perf.completedCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUpIcon className="w-4 h-4 text-purple-500" />
                          <span className="text-[10px] font-black text-gray-400">{t.success}</span>
                       </div>
                       <p className="text-lg font-black text-purple-600">%{perf.successRate}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-1.5 mb-1">
                          <ClockIcon className="w-4 h-4 text-orange-500" />
                          <span className="text-[10px] font-black text-gray-400">{language === 'ar' ? 'سرعة التوصيل' : 'Speed'}</span>
                       </div>
                       <p className="text-lg font-black text-orange-600">~38 <small className="text-[10px]">{language === 'ar' ? 'دقيقة' : 'min'}</small></p>
                    </div>
                 </div>

                 <button 
                  onClick={() => addToast(language === 'ar' ? 'تم تصدير كشف الحساب والعمولات كفاتورة بصيغة PDF' : 'Commissions report exported as PDF invoice', 'success')}
                  className="w-full mt-6 bg-slate-900 group-hover:bg-primary text-white py-3 rounded-2xl font-black text-xs transition-all shadow-md"
                 >
                    {language === 'ar' ? '🧾 تحميل كشف العمولات والنشاط (PDF)' : '🧾 Download Statement (PDF)'}
                 </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Real-time Field Operations & Driver GPS Simulator Console */}
        {activeTab === 'simulation' && (
          <div className="p-8 md:p-10 space-y-8">
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-inner border-2 border-slate-800 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-yellow-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    {language === 'ar' ? 'محاكي العمليات الميدانية وتحديثات GPS الفورية' : 'On-Field Live Operations & GPS Simulator'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {language === 'ar' ? 'اختر سائقاً من السجل الميداني لمحاكاة إرسال الحوادث وتوقيع التسليم وتحديثات الموقع الفورية' : 'Select an active field agent to simulate telemetry feeds, traffic alerts, and client handshakes'}
                  </p>
                </div>

                <div className="w-full md:w-auto">
                  <select 
                    value={selectedSimDriver} 
                    onChange={(e) => setSelectedSimDriver(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-slate-700 px-4 py-3 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">{language === 'ar' ? '-- اختر كادر للمحاكاة --' : '-- Select Driver --'}</option>
                    {delegates.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.type === 'driver' ? 'سائق' : 'مندوب'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Simulation Action Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button 
                  onClick={() => runSimulationStep('gps')}
                  disabled={!selectedSimDriver}
                  className="bg-slate-800 hover:bg-yellow-400 hover:text-slate-950 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-black text-xs shadow disabled:opacity-40 disabled:pointer-events-none border border-slate-700/50"
                >
                  <MapPinIcon className="w-6 h-6" />
                  <span>{language === 'ar' ? 'بث إحداثيات GPS' : 'Broadcast GPS Position'}</span>
                </button>

                <button 
                  onClick={() => runSimulationStep('signature')}
                  disabled={!selectedSimDriver}
                  className="bg-slate-800 hover:bg-yellow-400 hover:text-slate-950 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-black text-xs shadow disabled:opacity-40 disabled:pointer-events-none border border-slate-700/50"
                >
                  <ShieldCheckIcon className="w-6 h-6" />
                  <span>{language === 'ar' ? 'محاكاة توقيع العميل' : 'Simulate E-Signature'}</span>
                </button>

                <button 
                  onClick={() => runSimulationStep('delay')}
                  disabled={!selectedSimDriver}
                  className="bg-slate-800 hover:bg-yellow-400 hover:text-slate-950 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-black text-xs shadow disabled:opacity-40 disabled:pointer-events-none border border-slate-700/50"
                >
                  <ClockIcon className="w-6 h-6" />
                  <span>{language === 'ar' ? 'تبليغ عن ازدحام' : 'Report Traffic Congestion'}</span>
                </button>

                <button 
                  onClick={() => runSimulationStep('online')}
                  disabled={!selectedSimDriver}
                  className="bg-slate-800 hover:bg-yellow-400 hover:text-slate-950 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-black text-xs shadow disabled:opacity-40 disabled:pointer-events-none border border-slate-700/50"
                >
                  <TruckIcon className="w-6 h-6" />
                  <span>{language === 'ar' ? 'تبديل التوافر' : 'Toggle Avail/Busy'}</span>
                </button>
              </div>

              {/* Console Logs Monitor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-black text-slate-400">
                  <span>🛰️ {language === 'ar' ? 'شاشة الإشارات والاتصالات الحية' : 'Live Feeds & Signal Monitor'}</span>
                  <button onClick={() => setSimLogs([])} className="text-yellow-400 hover:underline">{language === 'ar' ? 'مسح الشاشة' : 'Clear Terminal'}</button>
                </div>
                <div className="bg-black/80 rounded-2xl p-4 font-mono text-[11px] h-60 overflow-y-auto border border-slate-800 custom-scrollbar space-y-2.5">
                  {simLogs.map(log => (
                    <div key={log.id} className="flex gap-3 text-left justify-start items-start animate-fade-in text-slate-300">
                      <span className="text-yellow-400 font-bold shrink-0">[{log.time}]</span>
                      <span className={`font-semibold shrink-0 ${
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                        log.type === 'action' ? 'text-blue-400' : 'text-indigo-400'
                      }`}>
                        {log.type.toUpperCase()}:
                      </span>
                      <span className="flex-1 text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        {language === 'ar' ? log.text_ar : log.text_en}
                      </span>
                    </div>
                  ))}
                  {simLogs.length === 0 && (
                    <div className="text-center text-slate-600 py-12">{language === 'ar' ? 'بانتظار إشارات الأقمار الصناعية والأجهزة الميدانية...' : 'Awaiting telemetry packets from hand-held field devices...'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Elegant Add/Edit Delegate & Branch Clearance Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-slate-100 overflow-hidden my-8 z-10"
            >
              <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2 flex items-center gap-3">
                <TruckIcon className="w-7 h-7 text-primary" />
                {modalMode === 'add' ? (language === 'ar' ? 'تسجيل كادر توصيل وتراخيص فروع جديدة' : 'Register Field Agent & Branch Clearances') : (language === 'ar' ? 'تعديل الصلاحيات وتراخيص فروع الكادر' : 'Edit Agent Clearances & Details')}
              </h3>
              <p className="text-gray-400 font-bold text-xs mb-6">
                {language === 'ar' ? 'يرجى تدوين البيانات لربطه بنظام الفروع الستة ومنحه الرمز التوثيقي وصلاحيات جرد المخازن' : 'Fill in credentials and set granular branch access permissions and cryptographic secure codes'}
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Section 1: Core Type & Authentication PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'التخصص اللوجستي' : 'Logistics Specialty'}</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    >
                      <option value="driver">{language === 'ar' ? 'سائق شاحنة مبرد لوجستي' : 'Refrigerated Truck Driver'}</option>
                      <option value="delegate">{language === 'ar' ? 'مندوب مبيعات وشركات B2B' : 'B2B Enterprise Representative'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'رمز المرور للوحة السائق (PIN)' : 'Handheld Device PIN'}</label>
                    <input 
                      type="text" 
                      value={formData.security_pin}
                      onChange={(e) => setFormData(prev => ({...prev, security_pin: e.target.value}))}
                      placeholder="654321"
                      maxLength={8}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800 text-center tracking-widest font-mono"
                    />
                  </div>
                </div>

                {/* Section 2: Cryptographic Secure Portal Auth Code */}
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-yellow-800 mb-1.5 uppercase">
                      🔐 {language === 'ar' ? 'الرمز التوثيقي المشفر الفريد لدخول بوابة السائقين' : 'Unique Secure Portal Authorization Token'}
                    </label>
                    <input 
                      type="text" 
                      readOnly
                      value={formData.portal_auth_code}
                      className="w-full bg-white border border-amber-500/20 rounded-xl px-4 py-2 font-mono font-black text-amber-900 text-xs tracking-wider outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, portal_auth_code: generateSecureToken() }));
                      addToast(language === 'ar' ? 'تم توليد رمز توثيقي مشفر جديد بالكامل' : 'New high-entropy secure token generated', 'info');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] px-4 py-3 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 self-end md:self-center"
                  >
                    🔄 {language === 'ar' ? 'توليد كود مشفر جديد' : 'Generate Secure Token'}
                  </button>
                </div>

                {/* Section 3: Name & Info */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'الاسم الثنائي الكامل للكادر' : 'Full Professional Name'}</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g. عبد الرحمن بن محمد القحطاني"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'رقم الهاتف السعودي' : 'Saudi Mobile Number'}</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                      placeholder="05xxxxxxxx"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'البريد الإلكتروني المهني' : 'Professional Email'}</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="driver@deltastars-ksa.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Section 4: Vehicle Specifics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'نوع مركبة الشحن' : 'Vehicle Category'}</label>
                    <select 
                      value={formData.vehicleType}
                      onChange={(e) => setFormData(prev => ({...prev, vehicleType: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    >
                      <option value="Refrigerated Van">{language === 'ar' ? '🚚 دباب مبرد (Van)' : '🚚 Refrigerated Van'}</option>
                      <option value="Box Truck">{language === 'ar' ? '🚛 شاحنة تبريد مغلقة (Truck)' : '🚛 Box Truck (Cold)'}</option>
                      <option value="Car">{language === 'ar' ? '🚗 سيارة عادية' : '🚗 Passenger Car'}</option>
                      <option value="Motorcycle">{language === 'ar' ? '🏍️ دراجة نارية سريعة' : '🏍️ Cargo Motorcycle'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'رقم رخصة لوحة المركبة' : 'Plate Registration'}</label>
                    <input 
                      type="text" 
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData(prev => ({...prev, vehiclePlate: e.target.value}))}
                      placeholder="أ ب ج ١٢٣٤"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Section 5: Dynamic Assigned Branch Select */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'الفرع الأساسي الملحق به السائق' : 'Primary Base Branch'}</label>
                    <select 
                      value={formData.assignedBranchId}
                      onChange={(e) => setFormData(prev => ({...prev, assignedBranchId: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    >
                      {displayBranches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {language === 'ar' ? branch.name_ar : branch.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase">{language === 'ar' ? 'حالة الحساب الميدانية' : 'Account Clearance Status'}</label>
                    <select 
                      value={formData.delegateStatus}
                      onChange={(e) => setFormData(prev => ({...prev, delegateStatus: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary font-bold text-xs text-slate-800"
                    >
                      <option value="active">{language === 'ar' ? 'نشط ومصرح بالتوصيل' : 'Active & Clear for Dispatch'}</option>
                      <option value="busy">{language === 'ar' ? 'مشغول برحلة توصيل حالية' : 'Busy on Active Run'}</option>
                      <option value="inactive">{language === 'ar' ? 'موقف ومسحوب الصلاحيات' : 'Suspended & Blocked'}</option>
                    </select>
                  </div>
                </div>

                {/* Section 6: Dynamic Access Permissions / Multi-Branch Authorizations */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    🗺️ {language === 'ar' ? 'تراخيص الفروع الستة المصرح له بخدمتها وتلقي شحناتها' : 'Clearance & Branch Authorizations (Multi-Branch Access)'}
                  </label>
                  <p className="text-[10px] text-slate-400 font-bold -mt-2">
                    {language === 'ar' ? 'سيتمكن الكادر من رؤية طلبات وجرد مستودعات الفروع المحددة بالوقت الفعلي' : 'The agent will have view/write permissions for orders and inventories at chosen branch sites'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {displayBranches.map(branch => {
                      const isChecked = formData.authorized_branches.includes(branch.id);
                      return (
                        <label key={branch.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-100/50 p-2 rounded-xl transition-colors">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleBranchToggle(branch.id)}
                            className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-slate-300 accent-primary"
                          />
                          <div>
                            <span className="text-xs font-black text-slate-800 block">
                              {language === 'ar' ? branch.name_ar : branch.name_en}
                            </span>
                            <span className="text-[9px] text-gray-400 block font-bold">{branch.city}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Section 7: Granular Action Permissions */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    🛡️ {language === 'ar' ? 'صلاحيات ومستوى الوصول المسموح به ميدانياً' : 'Operational Action Privileges (Granular Permissions)'}
                  </label>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {ALL_PERMISSIONS.map(perm => {
                      const isChecked = formData.branch_permissions.includes(perm.id);
                      return (
                        <label key={perm.id} className="flex items-center justify-between cursor-pointer hover:bg-slate-100/50 p-2 rounded-xl transition-colors">
                          <div className="flex-1">
                            <span className="text-xs font-black text-slate-800 block">
                              {language === 'ar' ? perm.label_ar : perm.label_en}
                            </span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(perm.id)}
                            className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-slate-300 accent-primary shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-all"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs shadow-lg hover:bg-primary-dark transition-all"
                  >
                    ✅ {language === 'ar' ? 'تأمين وحفظ الصلاحيات' : 'Confirm & Save Authorizations'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
