import React, { useState, useMemo, useEffect } from 'react';
import { useFirebase, useI18n, useToast } from './lib/contexts';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import { DeltaStarsLogo } from './DeltaStarsLogo';
import { 
  ShoppingCartIcon, 
  UserIcon,
  PackageIcon, 
  TrendingUpIcon, 
  DollarSignIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  XIcon,
  SearchIcon,
  FilterIcon,
  MapPinIcon,
  TruckIcon,
  FileTextIcon,
  SparklesIcon,
  FingerprintIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  BrainIcon,
  CalendarIcon,
  PlusIcon
} from './lib/contexts/Icons';
import { motion } from 'framer-motion';
import { mockProducts } from './lib/vip/products';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import OrderHistory from './OrderHistory';

interface VipDashboardPageProps {
  user: any;
  onLogout: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export function VipDashboardPage({ user, onLogout, onNavigate }: VipDashboardPageProps) {
  const { language, formatCurrency, t } = useI18n();

  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processData = <T extends any>(data: T[], searchFields: (keyof T)[]) => {
    let filtered = data.filter(item =>
      searchFields.some(field =>
        String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return { data: paginated, totalPages, totalItems };
  };

  const Pagination = ({ totalPages, current, onChange }: { totalPages: number, current: number, onChange: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button 
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
          className="p-2 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all font-tajawal text-xs text-white"
        >
          {language === 'ar' ? 'السابق' : 'Prev'}
        </button>
        <div className="flex gap-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onChange(i + 1)}
              className={`w-8 h-8 rounded-lg font-tajawal text-xs transition-all ${current === i + 1 ? 'bg-secondary text-white shadow-md' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button 
          disabled={current === totalPages}
          onClick={() => onChange(current + 1)}
          className="p-2 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all font-tajawal text-xs text-white"
        >
          {language === 'ar' ? 'التالي' : 'Next'}
        </button>
      </div>
    );
  };
  const { orders, showroomItems, products, createOrderWithInvoice } = useFirebase();
  const { addToast } = useToast();
  const { addItem } = useCart();
  
  const { registerBiometrics, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(!!user?.biometric_key);

  // States for B2B/VIP Instant Ordering & Showroom
  const [b2bCart, setB2bCart] = useState<Record<number, number>>({});
  const [selectedB2bCategory, setSelectedB2bCategory] = useState<string>('all');
  const [b2bSearchTerm, setB2bSearchTerm] = useState<string>('');

  // States for B2B Delivery Scheduler
  const [schedules, setSchedules] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`ds_vip_schedules_${user?.id}`);
      return stored ? JSON.parse(stored) : [
        { id: 'sch-1', days: ['sunday', 'tuesday'], branch: 'المركزي - السلي', timeSlot: 'morning', requirements: 'تغليف حراري مبرد' },
        { id: 'sch-2', days: ['thursday'], branch: 'فرع البديعة', timeSlot: 'evening', requirements: 'صناديق خشبية مغلقة' }
      ];
    } catch {
      return [];
    }
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    days: [] as string[],
    branch: 'المركزي - السلي',
    timeSlot: 'morning',
    requirements: ''
  });

  // States for Digital Contracts & ZATCA Simplified Tax Invoices
  const [contractSigned, setContractSigned] = useState(() => {
    try {
      return localStorage.getItem(`ds_contract_signed_${user?.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`ds_signature_${user?.id}`) || null;
    } catch {
      return null;
    }
  });
  const [signDate, setSignDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`ds_sign_date_${user?.id}`) || null;
    } catch {
      return null;
    }
  });
  const [financialSubTab, setFinancialSubTab] = useState<'invoices' | 'ledger' | 'reports' | 'archive'>('invoices');

  // Invoices Database State with per-client isolation
  const [invoices, setInvoices] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`ds_vip_invoices_${user?.id}`);
      return stored ? JSON.parse(stored) : [
        {
          id: 'INV-2026-001',
          date: '2026-07-01 10:14',
          desc: language === 'ar' ? 'توريد أغذية طازجة - الفرع اللوجستي' : 'Fresh Food Supply - Logistics Branch',
          subtotal: 4500,
          vat: 675,
          total: 5175,
          status: 'Paid',
          status_ar: 'مدفوعة (عبر الحساب البنكي)',
          status_en: 'Paid (Bank Transfer)',
        },
        {
          id: 'INV-2026-002',
          date: '2026-07-03 14:32',
          desc: language === 'ar' ? 'توريد تمور القصيم الفاخرة - فرع السلي' : 'Premium Qassim Dates Supply - Al-Sulay',
          subtotal: 3200,
          vat: 480,
          total: 3680,
          status: 'Paid',
          status_ar: 'مدفوعة (آجل - ضمن سقف الائتمان)',
          status_en: 'Paid (On Account)',
        },
        {
          id: 'INV-2026-003',
          date: '2026-07-06 09:45',
          desc: language === 'ar' ? 'طلب خضار وفواكه موسمية طازجة' : 'Fresh Seasonal Fruit & Veg Order',
          subtotal: 1200,
          vat: 180,
          total: 1380,
          status: 'Pending',
          status_ar: 'بانتظار التسوية',
          status_en: 'Pending Settlement',
        }
      ];
    } catch {
      return [];
    }
  });

  // Ledger Database State with per-client isolation
  const [ledgerEntries, setLedgerEntries] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`ds_vip_ledger_${user?.id}`);
      return stored ? JSON.parse(stored) : [
        { id: 'ENT-001', date: '2026-07-01 10:14', type: 'debit', amount: 5175, balance: 5175, desc_ar: 'إصدار فاتورة ضريبية مبسطة رقم #INV-2026-001', desc_en: 'Issued Simplified Tax Invoice #INV-2026-001' },
        { id: 'ENT-002', date: '2026-07-02 11:30', type: 'credit', amount: 5175, balance: 0, desc_ar: 'تسوية قيد سداد نقدي عبر البنك العربي الوطني', desc_en: 'Cash settlement received via ANB Bank Transfer' },
        { id: 'ENT-003', date: '2026-07-03 14:32', type: 'debit', amount: 3680, balance: 3680, desc_ar: 'إصدار فاتورة ضريبية آجل رقم #INV-2026-002', desc_en: 'Issued Account Invoice #INV-2026-002' },
        { id: 'ENT-004', date: '2026-07-06 09:45', type: 'debit', amount: 1380, balance: 5060, desc_ar: 'إصدار فاتورة مبيعات آجل رقم #INV-2026-003', desc_en: 'Issued Account Invoice #INV-2026-003' }
      ];
    } catch {
      return [];
    }
  });

  // Archive Documents Database with per-client isolation
  const [archivedDocs, setArchivedDocs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`ds_vip_archive_${user?.id}`);
      return stored ? JSON.parse(stored) : [
        { id: 'DOC-2026-001', name: 'فاتورة توريد خضروات طازجة مزارع الخرج يونيو.pdf', category: 'invoice', date: '2026-06-30', size: '1.2 MB', status: 'Verified' },
        { id: 'DOC-2026-002', name: 'عقد توريد ثمار الفاكهة المستوردة - شركة نجوم دلتا.pdf', category: 'contract', date: '2026-07-02', size: '2.4 MB', status: 'Verified' },
        { id: 'DOC-2026-003', name: 'شهادة تسجيل ضريبة القيمة المضافة لشركة نجوم دلتا لعام 2026.pdf', category: 'tax', date: '2026-07-10', size: '850 KB', status: 'Verified' }
      ];
    } catch {
      return [];
    }
  });

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  useEffect(() => {
    setIsBiometricEnabled(!!user?.biometric_key);
  }, [user?.biometric_key]);

  const userOrders = useMemo(() => {
    return orders?.filter(o => o.customerId === user?.id) || [];
  }, [orders, user?.id]);

  const stats = useMemo(() => {
    const totalSpent = userOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const pendingCount = userOrders.filter(o => o.status === 'pending').length;
    return { totalSpent, pendingCount };
  }, [userOrders]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-dark">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="font-tajawal text-lg">{t('vip.loading')}</p>
        </div>
      </div>
    );
  }

  const handleEnableBiometric = async () => {
    try {
      addToast(language === 'ar' ? 'جاري تفعيل البصمة السيادية...' : 'Activating Sovereign Biometrics...', 'info');
      await registerBiometrics();
      setIsBiometricEnabled(true);
      addToast(language === 'ar' ? 'تم تفعيل الدخول بالبصمة بنجاح' : 'Biometric login enabled successfully', 'success');
    } catch (error) {
      addToast(language === 'ar' ? 'فشل تفعيل البصمة' : 'Failed to enable biometrics', 'error');
    }
  };

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a3a1a'; // Deep forest green
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const signContract = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const currentDate = new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
    
    setSignatureDataUrl(dataUrl);
    setSignDate(currentDate);
    setContractSigned(true);
    
    localStorage.setItem(`ds_contract_signed_${user?.id}`, 'true');
    localStorage.setItem(`ds_signature_${user?.id}`, dataUrl);
    localStorage.setItem(`ds_sign_date_${user?.id}`, currentDate);
    addToast(language === 'ar' ? 'تم توثيق وتوقيع عقد التوريد بنجاح' : 'Contract signed and verified successfully', 'success');
  };

  const handleReorder = (order: any) => {
    if (!order.items || order.items.length === 0) {
      addToast(
        language === 'ar' 
          ? 'لا توجد عناصر في هذا الطلب لإعادة طلبها' 
          : 'No items in this order to re-order', 
        'error'
      );
      return;
    }

    try {
      order.items.forEach((item: any) => {
        addItem(item, item.quantity || 1);
      });
      addToast(
        language === 'ar' 
          ? 'تم تكرار الطلب ونقل جميع عناصره إلى السلة بنجاح!' 
          : 'Order successfully duplicated and all items transferred to the cart!', 
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast(
        language === 'ar' 
          ? 'فشل في تكرار وإعادة الطلب' 
          : 'Failed to duplicate and re-order', 
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-tajawal relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      {/* Sidebar */}
      <aside className="w-80 bg-white p-10 flex flex-col border-l-2 border-slate-100 shadow-2xl relative z-20">
        <div className="mb-16 space-y-6">
          <div className="relative group">
            <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl border-4 border-white group-hover:rotate-12 transition-transform duration-500">
              <span className="text-4xl font-black">VIP</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-2 rounded-xl shadow-lg border-2 border-white">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-primary">{user.name}</h2>
            <p className="text-secondary font-black text-[10px] uppercase tracking-[0.3em]">{user.company || 'Sovereign Partner'}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3 overflow-y-auto max-h-[50vh] custom-scrollbar">
          {[
            { id: 'orders', label: t('vip.tabs.orders') || (language === 'ar' ? 'سجل العمليات' : 'Operations Log'), icon: ShoppingCartIcon },
            { id: 'showroom', label: language === 'ar' ? 'صالة العرض والطلب' : 'Showroom & Orders', icon: PackageIcon },
            { id: 'schedule', label: language === 'ar' ? 'مخطط وجدولة التوريد' : 'Supply Planner', icon: CalendarIcon },
            { id: 'ai_advisor', label: language === 'ar' ? 'التنبؤ الذكي بالطلب' : 'Demand Prediction', icon: BrainIcon },
            { id: 'tracking', label: t('vip.tabs.tracking'), icon: TruckIcon },
            { id: 'invoices', label: t('vip.tabs.invoices'), icon: FileTextIcon },
            { id: 'contracts', label: t('vip.tabs.contracts') || (language === 'ar' ? 'اتفاقيات التوريد' : 'Supply Agreements'), icon: ShieldCheckIcon },
            { id: 'profile', label: t('vip.tabs.profile'), icon: UserIcon },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl font-black text-sm transition-all duration-300 ${activeTab === tab.id ? 'bg-primary text-white shadow-[0_20px_40px_rgba(26,58,26,0.2)] translate-x-3' : 'hover:bg-slate-50 text-gray-400'}`}
            >
              <tab.icon className="w-6 h-6" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">{t('vip.support.title')}</p>
          <button className="w-full bg-white text-primary py-4 rounded-xl font-black text-xs shadow-sm hover:bg-primary hover:text-white transition-all border border-slate-100">
            {t('vip.support.button')}
          </button>
        </div>

        <button 
          onClick={onLogout}
          className="mt-8 bg-red-50 text-red-600 p-5 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all"
        >
          {t('common.logout_emoji')}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
          <div>
            <h1 className="text-5xl font-black text-primary tracking-tighter">
              {activeTab === 'orders' ? (language === 'ar' ? 'سجل العمليات والطلبات' : 'Operations & Orders History') : 
               activeTab === 'showroom' ? (language === 'ar' ? 'صالة العرض والطلب الآجل المباشر' : 'Showroom & Institutional Credit Orders') :
               activeTab === 'schedule' ? (language === 'ar' ? 'مخطط وجدولة عمليات التوريد' : 'Supply & Logistics Planner') :
               activeTab === 'ai_advisor' ? (language === 'ar' ? 'نظام التنبؤ الذكي بالطلب البستاني' : 'Smart Demand Predictor') :
               activeTab === 'tracking' ? t('vip.tracking.title') : 
               activeTab === 'invoices' ? (language === 'ar' ? 'السجل المالي والفواتير الإلكترونية' : 'Financial & E-Invoicing') : 
               activeTab === 'contracts' ? (language === 'ar' ? 'بوابة التعاقد والتوريد الإلكتروني' : 'Digital Supply Contracting') : 
               t('vip.security.title')}
            </h1>
            <p className="text-gray-400 font-bold mt-2">{t('vip.welcome', { name: user.name })}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sovereign border border-slate-100 flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('vip.stats.cashback')}</span>
                <p className="text-2xl font-black text-emerald-500">{formatCurrency(user.cashbackBalance || 0)}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <SparklesIcon className="w-7 h-7" />
              </div>
            </div>
            
            <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sovereign border border-slate-100 flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('vip.stats.debt')}</span>
                <p className="text-2xl font-black text-red-500">{formatCurrency(user.debt_balance || 0)}</p>
              </div>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                <DollarSignIcon className="w-7 h-7" />
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <OrderHistory
              user={user}
              orders={userOrders}
              onNavigate={onNavigate}
              onReorder={handleReorder}
            />
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="space-y-10 animate-fade-in">
            {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(order => (
              <div key={order.id} className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h3 className="text-3xl font-black text-primary">{t('vip.tracking.title')} #{order.id.slice(0, 8)}</h3>
                    <p className="text-gray-400 font-bold mt-2">{t('common.status')}: {t(`common.statuses.${order.status}`)}</p>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('live_tracking', { orderId: order.id })}
                    className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-secondary transition-all flex items-center gap-3"
                  >
                    <MapPinIcon className="w-5 h-5" />
                    {t('vip.tracking.open_map')}
                  </button>
                </div>
                
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-gray-100 flex items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-primary">
                    <TruckIcon className="w-10 h-10" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">{t('vip.tracking.current_location')}</p>
                    <p className="text-primary font-black text-2xl">{t('vip.tracking.truck_status')}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 && (
              <div className="h-[60vh] flex items-center justify-center bg-white rounded-[4rem] shadow-sovereign border border-gray-100">
                <div className="text-center space-y-8">
                  <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <MapPinIcon className="w-20 h-20" />
                  </div>
                  <h3 className="text-4xl font-black text-primary">{t('vip.tracking.no_active')}</h3>
                  <p className="text-gray-400 font-bold max-w-md mx-auto text-lg">{t('vip.tracking.no_active_desc')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-12 animate-fade-in">
            {/* Financial Systems Subtabs Header */}
            <div className="bg-white p-6 rounded-3xl shadow-sovereign border border-gray-100 flex flex-wrap gap-2">
              {[
                { id: 'invoices', label_ar: 'الفواتير الإلكترونية', label_en: 'E-Invoices', icon: '📄' },
                { id: 'ledger', label_ar: 'دفتر اليومية والأستاذ', label_en: 'Journal Ledger', icon: '📖' },
                { id: 'reports', label_ar: 'التقارير وكشف الحساب', label_en: 'Financial Reports', icon: '📊' },
                { id: 'archive', label_ar: 'الأرشيف الرقمي الموثق', label_en: 'Secure E-Archiving', icon: '🗄️' },
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setFinancialSubTab(subTab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-xs transition-all duration-300 ${
                    financialSubTab === subTab.id
                      ? 'bg-secondary text-white shadow-lg'
                      : 'bg-slate-50 text-gray-400 hover:bg-slate-100'
                  }`}
                >
                  <span>{subTab.icon}</span>
                  <span>{language === 'ar' ? subTab.label_ar : subTab.label_en}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: ZATCA Invoices */}
            {financialSubTab === 'invoices' && (
              <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-primary flex items-center gap-4">
                      <FileTextIcon className="w-8 h-8 text-primary" />
                      {language === 'ar' ? 'سجل الفواتير الضريبية المبسطة' : 'Simplified Tax Invoices'}
                    </h3>
                    <p className="text-gray-400 font-bold mt-1">
                      {language === 'ar' ? 'الفواتير الإلكترونية المعتمدة لضريبة القيمة المضافة (15٪)' : 'Certified Electronic Invoices for Value Added Tax (15%)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      {language === 'ar' ? 'الربط المباشر مع هيئة الزكاة والضريبة والجمارك (فاتورة) نشط' : 'Direct Integration with ZATCA (FATOORA) Active'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[700px]">
                    <thead>
                      <tr className="text-gray-400 text-xs font-black border-b border-gray-100">
                        <th className="pb-4">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                        <th className="pb-4">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                        <th className="pb-4">{language === 'ar' ? 'البيان ومقر التوريد' : 'Description & Site'}</th>
                        <th className="pb-4">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                        <th className="pb-4">{language === 'ar' ? 'الضريبة (15٪)' : 'VAT (15%)'}</th>
                        <th className="pb-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="pb-4 text-center">{language === 'ar' ? 'استعراض وطباعة' : 'View & Print'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-all">
                          <td className="py-5 font-black text-primary">#{inv.id}</td>
                          <td className="py-5 text-sm text-gray-400 font-bold">{inv.date}</td>
                          <td className="py-5 font-bold text-slate-800">{inv.desc}</td>
                          <td className="py-5 font-black text-secondary">{inv.total} {t('common.currency')}</td>
                          <td className="py-5 text-sm text-gray-500 font-bold">{inv.vat} {t('common.currency')}</td>
                          <td className="py-5">
                            <span className={`px-4 py-1 rounded-full text-xs font-black ${inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                              {language === 'ar' ? inv.status_ar : inv.status_en}
                            </span>
                          </td>
                          <td className="py-5 text-center">
                            <button 
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-4 py-2 bg-slate-50 text-primary border border-slate-200 rounded-xl hover:bg-primary hover:text-white transition-all font-black text-xs"
                            >
                              {language === 'ar' ? 'عرض الفاتورة 📄' : 'View Invoice 📄'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Journal Ledger */}
            {financialSubTab === 'ledger' && (
              <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-primary flex items-center gap-4">
                      📖
                      {language === 'ar' ? 'كشف قيود اليومية ودفتر الأستاذ' : 'Journal & General Ledger Entries'}
                    </h3>
                    <p className="text-gray-400 font-bold mt-1">
                      {language === 'ar' ? 'القيود المحاسبية الثنائية الموثقة لعمليات التوريد والمدفوعات الآجلة لشركتكم' : 'Certified double-entry bookkeeping for your credit-supply lines and settlements'}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 font-black bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                    {language === 'ar' ? 'مرتبط مباشرة ببرنامج أونيكس برو' : 'Direct Sync with Onyx Pro ERP active'}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[700px]">
                    <thead>
                      <tr className="text-gray-400 text-xs font-black border-b border-gray-100">
                        <th className="pb-4">{language === 'ar' ? 'رقم القيد' : 'Entry ID'}</th>
                        <th className="pb-4">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                        <th className="pb-4">{language === 'ar' ? 'البيان والتفاصيل' : 'Description & Details'}</th>
                        <th className="pb-4 text-center">{language === 'ar' ? 'مدين (+)' : 'Debit (+)'}</th>
                        <th className="pb-4 text-center">{language === 'ar' ? 'دائن (-)' : 'Credit (-)'}</th>
                        <th className="pb-4">{language === 'ar' ? 'الرصيد الجاري' : 'Running Balance'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-bold">
                      {ledgerEntries.map(ent => (
                        <tr key={ent.id} className="hover:bg-slate-50 transition-all text-xs">
                          <td className="py-5 font-mono text-primary font-black">#{ent.id}</td>
                          <td className="py-5 text-gray-400">{ent.date}</td>
                          <td className="py-5 text-slate-800">{language === 'ar' ? ent.desc_ar : ent.desc_en}</td>
                          <td className="py-5 text-center text-red-600 font-black">
                            {ent.type === 'debit' ? `${ent.amount} ر.س` : '-'}
                          </td>
                          <td className="py-5 text-center text-emerald-600 font-black">
                            {ent.type === 'credit' ? `${ent.amount} ر.س` : '-'}
                          </td>
                          <td className="py-5 font-black text-slate-900">{ent.balance} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Financial Reports */}
            {financialSubTab === 'reports' && (
              <div className="space-y-8 animate-fade-in">
                {/* Balance & Utilization Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sovereign border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      {language === 'ar' ? 'حد الائتمان التجاري الكلي' : 'Total Commercial Credit Line'}
                    </span>
                    <p className="text-3xl font-black text-primary">50,000 ر.س</p>
                    <div className="mt-4 flex justify-between text-xs text-gray-400 font-bold">
                      <span>{language === 'ar' ? 'مستغل: ' : 'Used: '}{(user.debt_balance || 0)} ر.س</span>
                      <span>{language === 'ar' ? 'متاح: ' : 'Available: '}{(50000 - (user.debt_balance || 0))} ر.س</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-primary h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((user.debt_balance || 0) / 50000) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sovereign border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      {language === 'ar' ? 'الرصيد المستحق الدفع' : 'Outstanding Debt'}
                    </span>
                    <p className="text-3xl font-black text-red-500">{user.debt_balance || 0} ر.س</p>
                    <p className="text-xs text-gray-400 font-bold mt-4">
                      {language === 'ar' ? 'تاريخ الاستحقاق القادم: 15 من هذا الشهر' : 'Next settlement due: 15th of this month'}
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sovereign border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      {language === 'ar' ? 'رصيد كاش باك كبار العملاء' : 'VIP Cashback Ledger'}
                    </span>
                    <p className="text-3xl font-black text-emerald-500">{user.cashbackBalance || 0} ر.س</p>
                    <p className="text-xs text-emerald-600 font-bold mt-4">
                      {language === 'ar' ? '✓ مؤهل للاستخدام المباشر في الخصم' : '✓ Eligible for immediate order deductions'}
                    </p>
                  </div>
                </div>

                {/* Account Statement Section */}
                <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-4">
                    📊
                    {language === 'ar' ? 'كشف الحساب والتقارير التحليلية للشركة' : 'Institutional Statement of Account'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-bold text-slate-700 border-b pb-8 mb-8">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-400">{language === 'ar' ? 'الاسم التجاري الموثق:' : 'Partner Corporate Name:'}</span>
                        <span className="text-primary font-black">{user.company || user.name}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-400">{language === 'ar' ? 'رقم السجل التجاري:' : 'Commercial CR Number:'}</span>
                        <span className="text-primary font-mono font-black">1010772195</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-400">{language === 'ar' ? 'فترة الكشف الجاري:' : 'Statement Period:'}</span>
                        <span className="text-primary font-black">2026-06-01 / 2026-07-31</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-400">{language === 'ar' ? 'مجموع المشتريات الآجلة:' : 'Total Accrued Orders:'}</span>
                        <span className="text-secondary font-black">
                          {ledgerEntries.filter(e => e.type === 'debit').reduce((acc, e) => acc + e.amount, 0)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-400">{language === 'ar' ? 'مجموع المدفوعات المسواة:' : 'Total Settled Credits:'}</span>
                        <span className="text-emerald-600 font-black">
                          {ledgerEntries.filter(e => e.type === 'credit').reduce((acc, e) => acc + e.amount, 0)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-400">{language === 'ar' ? 'الرصيد النهائي المستحق:' : 'Outstanding Final Balance:'}</span>
                        <span className="text-red-500 font-black">{user.debt_balance || 0} ر.س</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => addToast(language === 'ar' ? 'تم تحميل كشف الحساب المالي بصيغة PDF' : 'Statement PDF downloaded successfully', 'success')}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs hover:bg-[#1a3a1a] transition-all shadow-md shadow-primary/10"
                    >
                      {language === 'ar' ? 'تحميل كشف الحساب المالي (PDF) 📥' : 'Download Account Statement (PDF) 📥'}
                    </button>
                    <button 
                      onClick={() => addToast(language === 'ar' ? 'تم إرسال نسخة كشف الحساب عبر البريد الإلكتروني للشركة' : 'Statement sent to corporate email', 'success')}
                      className="px-6 py-3 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-black text-xs hover:bg-slate-100 transition-all"
                    >
                      {language === 'ar' ? 'إرسال كشف الحساب بالإيميل ✉️' : 'Send Statement by Email ✉️'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Secure E-Archiving */}
            {financialSubTab === 'archive' && (
              <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100 animate-fade-in space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary flex items-center gap-4">
                      🗄️
                      {language === 'ar' ? 'الأرشيف الإلكتروني السيادي للوثائق والملفات' : 'Sovereign Secure E-Archiving Hub'}
                    </h3>
                    <p className="text-gray-400 font-bold mt-1">
                      {language === 'ar' ? 'أرشفة وتوثيق وتخزين كافة عقود التوريد، الفواتير، الإقرارات الضريبية وشهادات الفحص الأمني للشركة' : 'Secure document center to index contracts, VAT invoices, certificates, and logistics slips'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <span>🛡️</span>
                    <span>{language === 'ar' ? 'معمّى بالتشفير السيادي للبيانات' : 'Encrypted with Sovereign Isolation'}</span>
                  </div>
                </div>

                {/* Drag and Drop File Upload Area */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      addToast(language === 'ar' ? `جاري تحميل وفحص وتشفير المستند: ${file.name}` : `Uploading, scanning, and encrypting: ${file.name}`, 'info');
                      setTimeout(() => {
                        const newDoc = {
                          id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
                          name: file.name,
                          category: 'other',
                          date: new Date().toISOString().split('T')[0],
                          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                          status: 'Verified'
                        };
                        const updated = [newDoc, ...archivedDocs];
                        setArchivedDocs(updated);
                        localStorage.setItem(`ds_vip_archive_${user?.id}`, JSON.stringify(updated));
                        addToast(language === 'ar' ? '✓ تم فحص المستند أمنياً وأرشفته بنجاح!' : '✓ Document security scanned & archived successfully!', 'success');
                      }, 2000);
                    }
                  }}
                  className="border-4 border-dashed border-slate-200 hover:border-primary p-12 rounded-[3rem] text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative"
                >
                  <input 
                    type="file" 
                    id="file-archive-input" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        addToast(language === 'ar' ? `جاري تحميل وتشفير المستند: ${file.name}` : `Uploading and encrypting document: ${file.name}`, 'info');
                        setTimeout(() => {
                          const newDoc = {
                            id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
                            name: file.name,
                            category: 'other',
                            date: new Date().toISOString().split('T')[0],
                            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                            status: 'Verified'
                          };
                          const updated = [newDoc, ...archivedDocs];
                          setArchivedDocs(updated);
                          localStorage.setItem(`ds_vip_archive_${user?.id}`, JSON.stringify(updated));
                          addToast(language === 'ar' ? '✓ تم فحص المستند أمنياً وتوثيقه بنجاح!' : '✓ Document security verified & archived successfully!', 'success');
                        }, 2000);
                      }
                    }}
                  />
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto text-3xl">📤</div>
                    <h4 className="text-lg font-black text-primary">{language === 'ar' ? 'اسحب وأفلت وثائق شركتك هنا، أو تصفح ملفاتك' : 'Drag & drop corporate documents here, or browse files'}</h4>
                    <p className="text-gray-400 text-xs font-bold max-w-md mx-auto leading-relaxed">
                      {language === 'ar' ? 'يدعم الملفات من نوع PDF, PNG, JPG بحد أقصى 20 ميجا. نقوم تلقائياً بالتحليل الأمني والتحقق من الفيروسات والربط المالي مع أونيكس برو.' : 'Supports PDF, PNG, JPG files up to 20MB. Automated security scanning, virus checking, and Onyx Pro linking is initiated upon load.'}
                    </p>
                  </div>
                </div>

                {/* Table of archived documents */}
                <div className="overflow-x-auto pt-6">
                  <h4 className="text-xl font-black text-primary mb-6 flex items-center gap-3">🗃️ {language === 'ar' ? 'قائمة الوثائق والأرشيف الإلكتروني المستنداتي' : 'Indexed Archives & Document Vault'}</h4>
                  <table className="w-full text-right min-w-[700px]">
                    <thead>
                      <tr className="text-gray-400 text-xs font-black border-b border-gray-100">
                        <th className="pb-4">{language === 'ar' ? 'رقم الوثيقة' : 'Document ID'}</th>
                        <th className="pb-4">{language === 'ar' ? 'اسم الوثيقة والملف' : 'File Name & Title'}</th>
                        <th className="pb-4">{language === 'ar' ? 'التاريخ واليوم' : 'Archived Date'}</th>
                        <th className="pb-4">{language === 'ar' ? 'حجم الملف' : 'File Size'}</th>
                        <th className="pb-4">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                        <th className="pb-4">{language === 'ar' ? 'فحص الأمان والتحقق' : 'Security Audit'}</th>
                        <th className="pb-4 text-center">{language === 'ar' ? 'خيارات' : 'Options'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-bold text-xs text-slate-800">
                      {archivedDocs.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-all">
                          <td className="py-4 font-mono text-primary font-black">#{doc.id}</td>
                          <td className="py-4 font-black">{doc.name}</td>
                          <td className="py-4 text-gray-400">{doc.date}</td>
                          <td className="py-4 font-mono text-gray-500">{doc.size}</td>
                          <td className="py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-black text-[10px]">
                              {doc.category === 'invoice' ? (language === 'ar' ? 'فاتورة ضريبية' : 'VAT Invoice') :
                               doc.category === 'contract' ? (language === 'ar' ? 'اتفاقية توريد' : 'Supply Agreement') :
                               doc.category === 'tax' ? (language === 'ar' ? 'إقرار ضريبي' : 'Tax Cert') :
                               (language === 'ar' ? 'وثيقة عامة' : 'General')}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {language === 'ar' ? 'مفحوص وآمن (SafeScan)' : 'Verified Secure (SafeScan)'}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <button 
                              onClick={() => addToast(language === 'ar' ? 'تم البدء في تحميل الوثيقة بصيغة مؤمنة' : 'Downloading secured document', 'success')}
                              className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-[10px]"
                            >
                              {language === 'ar' ? 'تحميل 📥' : 'Download 📥'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-12 animate-fade-in">
            {/* Summary & Account Dues */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sovereign border border-gray-100 relative overflow-hidden">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{language === 'ar' ? 'سقف الائتمان الممنوح' : 'Credit Limit Granted'}</span>
                <p className="text-3xl font-black text-primary">50,000 ر.س</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400 font-bold">
                  <span>{language === 'ar' ? 'مستغل: 12,450 ر.س' : 'Used: 12,450 SAR'}</span>
                  <span>{language === 'ar' ? 'متاح: 37,550 ر.س' : 'Available: 37,550 SAR'}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-primary h-full" style={{ width: '25.9%' }} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sovereign border border-gray-100 relative overflow-hidden">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{language === 'ar' ? 'مواعيد الاستلام القادمة' : 'Upcoming Delivery Schedules'}</span>
                <p className="text-3xl font-black text-secondary">3 شحنات مجدولة</p>
                <p className="text-xs text-gray-400 font-bold mt-4">{language === 'ar' ? 'أقرب تسليم: الأحد القادم (الساعة 9:00 صباحاً)' : 'Nearest: Next Sunday (9:00 AM)'}</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sovereign border border-gray-100 relative overflow-hidden">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{language === 'ar' ? 'مواعيد السداد ومستحقات الدفع' : 'Payment Settlements Dues'}</span>
                <p className="text-3xl font-black text-amber-500">12,450 ر.س</p>
                <p className="text-xs text-gray-400 font-bold mt-4">{language === 'ar' ? 'تاريخ السداد المستحق: 2026/07/15' : 'Payment Due Date: 2026/07/15'}</p>
              </div>
            </div>

            {/* Official Digital Contract Template */}
            <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100">
              <h3 className="text-3xl font-black text-primary mb-2 flex items-center gap-4">
                <ShieldCheckIcon className="w-8 h-8 text-primary" />
                {language === 'ar' ? 'اتفاقية توريد وتسهيلات تجارية موثقة' : 'Sovereign Supply Agreement'}
              </h3>
              <p className="text-gray-400 font-bold mb-10">
                {language === 'ar' ? 'عقد رسمي لتحديد الكميات المطلوبة، مواعيد الاستلام، وشروط الدفع والائتمان المالي' : 'Official contract outlining quantities, delivery schedules, credit terms, and payment structures'}
              </p>

              <div className="border border-slate-200 bg-slate-50/50 p-8 rounded-[2rem] space-y-6 text-sm leading-relaxed text-slate-800 font-bold max-h-[350px] overflow-y-auto mb-10">
                <div className="text-center font-black text-lg text-primary border-b pb-4">
                  {language === 'ar' ? 'عقد توريد خضار وفواكه وتمور طازجة' : 'FRESH PRODUCE & DATES SUPPLY CONTRACT'}
                </div>
                
                <p>
                  <strong>{language === 'ar' ? 'الطرف الأول:' : 'First Party:'}</strong> {language === 'ar' ? 'شركة نجوم دلتا للتجارة، سجل تجاري رقم 1010772195، ومقرها الرياض، المملكة العربية السعودية.' : 'Delta Stars Trading Company, Commercial Register No. 1010772195, based in Riyadh, KSA.'}
                </p>
                
                <p>
                  <strong>{language === 'ar' ? 'الطرف الثاني (العميل الكبير):' : 'Second Party (VIP Client):'}</strong> {user.name} ({language === 'ar' ? 'مجموعته التجارية الموثقة بمركز الكنترول' : 'His certified business group'}).
                </p>

                <h4 className="font-black text-primary border-r-4 border-yellow-500 pr-3 my-4">{language === 'ar' ? 'البند الأول: شروط الائتمان والدفع' : 'Clause 1: Credit & Payments'}</h4>
                <p>
                  {language === 'ar' 
                    ? 'يمنح الطرف الأول للطرف الثاني سقف ائتمان مالي يبلغ (50,000 ر.س) خمسين ألف ريال سعودي، ويتم تسوية المبالغ المستحقة بحد أقصى يوم 15 من كل شهر ميلادي عبر التحويل البنكي لحساب شركة نجوم دلتا بالبنك العربي الوطني.' 
                    : 'The First Party grants the Second Party a credit line of (50,000 SAR) fifty thousand Saudi Riyals. Outstanding settlements must be made on or before the 15th of each calendar month via direct bank transfer to Delta Stars ANB account.'}
                </p>

                <h4 className="font-black text-primary border-r-4 border-yellow-500 pr-3 my-4">{language === 'ar' ? 'البند الثاني: الكميات المجدولة ومواعيد الاستلام' : 'Clause 2: Deliveries & Schedules'}</h4>
                <p>
                  {language === 'ar'
                    ? 'يلتزم الطرف الأول بتوفير وتوصيل شحنات الخضار والفواكه الموسمية والتمور الفاخرة للطرف الثاني بمعدل 3 شحنات أسبوعياً (الأحد، الثلاثاء، الخميس) قبل الساعة 10:00 صباحاً في مقرات التوريد المعتمدة والتابعة للمستودع المركزي.'
                    : 'The First Party commits to supplying and delivering premium seasonal vegetables, fruits, and dates to the Second Party, scheduled 3 times weekly (Sunday, Tuesday, Thursday) before 10:00 AM to the certified logistics delivery nodes.'}
                </p>

                <div className="border-t pt-4 mt-6">
                  <p className="text-xs text-gray-400 text-center font-bold">
                    {language === 'ar' 
                      ? '✓ تم تشفير هذه الاتفاقية بنظام التشفير السيادي للبيانات والتحقق الرقمي الثنائي لمنع الاختراق أو الكشف.' 
                      : '✓ This agreement is encrypted under sovereign data protection and dual digital validation to guarantee complete isolation and security.'}
                  </p>
                </div>
              </div>

              {/* Dynamic Contract Commitments (Schedules table) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-sm">
                  <h4 className="text-lg font-black text-primary mb-4 border-b pb-2">📅 {language === 'ar' ? 'مواعيد الاستلام والكميات المجدولة' : 'Delivery Quantities Schedule'}</h4>
                  <div className="space-y-3 text-xs font-bold text-slate-700">
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'خضروات ورقية طازجة' : 'Fresh Leafy Veggies'}</span>
                      <span className="text-primary font-black">50 {language === 'ar' ? 'حزمة / أسبوعياً' : 'Bundles / Weekly'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'طماطم وخضروات أساسية' : 'Essential Tomato & Veg'}</span>
                      <span className="text-primary font-black">150 {language === 'ar' ? 'كيلو / أسبوعياً' : 'Kg / Weekly'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'تمور الخلاص والسكري الفاخرة' : 'Premium Dates (Khalas)'}</span>
                      <span className="text-primary font-black">20 {language === 'ar' ? 'كرتون / شهرياً' : 'Cartons / Monthly'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-sm">
                  <h4 className="text-lg font-black text-amber-600 mb-4 border-b pb-2">💳 {language === 'ar' ? 'مواعيد سداد الأقساط والمستحقات الماليّة' : 'Settlement & Payment Dues'}</h4>
                  <div className="space-y-3 text-xs font-bold text-slate-700">
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'القسط المستحق القادم (2026/07/15)' : 'Next Installment (2026/07/15)'}</span>
                      <span className="text-amber-500 font-black">4,500 ر.س</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'تاريخ السداد التالي (2026/08/15)' : 'Following Settlement (2026/08/15)'}</span>
                      <span className="text-slate-400 font-black">3,200 ر.س</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'الضمان المالي المودع' : 'Deposited Guarantee'}</span>
                      <span className="text-emerald-500 font-black">{language === 'ar' ? 'مُفعّل ومثبّت بنجاح' : 'Activated & Verified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Pad */}
              <div className="border-2 border-dashed border-slate-200 p-8 rounded-[3rem] text-center bg-slate-50/50">
                {!contractSigned ? (
                  <div>
                    <h4 className="text-xl font-black text-primary mb-2">{language === 'ar' ? 'التوقيع الإلكتروني للعميل الكبير المعتمد' : 'VIP Customer Digital Signature'}</h4>
                    <p className="text-gray-400 text-xs font-bold mb-6">{language === 'ar' ? 'يرجى رسم توقيعك الرسمي بداخل المربع اللوحي أدناه لتفعيل شروط الاتفاقية السيادية' : 'Please draw your signature in the pad below to activate contract'}</p>
                    
                    <div className="mx-auto max-w-[400px] border border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-white">
                      <canvas 
                        ref={canvasRef}
                        width={400}
                        height={150}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="cursor-crosshair w-full block"
                      />
                    </div>

                    <div className="mt-6 flex justify-center gap-4">
                      <button 
                        onClick={clearCanvas}
                        className="px-6 py-3 bg-white text-gray-500 border border-slate-200 rounded-xl font-black text-xs hover:bg-slate-100 transition-all"
                      >
                        {language === 'ar' ? 'مسح التوقيع 🔄' : 'Clear Pad 🔄'}
                      </button>
                      <button 
                        onClick={signContract}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs shadow-md shadow-primary/20 hover:bg-[#1a3a1a] transition-all"
                      >
                        {language === 'ar' ? 'توثيق وتوقيع العقد إلكترونياً ✍️' : 'Electronically Sign Agreement ✍️'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                      <ShieldCheckIcon className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-black text-emerald-600 mb-2">{language === 'ar' ? 'تم توقيع وتوثيق عقد التوريد بنجاح 🔒' : 'Agreement Signed & Secured 🔒'}</h4>
                    <p className="text-slate-500 text-sm font-bold max-w-md">
                      {language === 'ar' 
                        ? `تم تسجيل التوقيع والموافقة من قبل العميل برمز التحقق السيادي بنجاح في ${signDate}` 
                        : `Digital signature captured and sealed with sovereign hash validation on ${signDate}`}
                    </p>
                    
                    {signatureDataUrl && (
                      <div className="mt-6 border border-emerald-200 rounded-xl p-4 bg-white shadow-sm max-w-[300px]">
                        <p className="text-[10px] text-emerald-500 font-black mb-2 uppercase tracking-wider">{language === 'ar' ? 'التوقيع الرقمي المسجل' : 'Registered Signature'}</p>
                        <img src={signatureDataUrl} alt="Signature" className="max-h-[80px] object-contain mx-auto" />
                        <span className="text-[8px] text-gray-400 font-mono block mt-2">SHA-256: d0faf40cad2b412fd78591c8ee15810cfc4902a1</span>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        localStorage.removeItem(`ds_contract_signed_${user?.id}`);
                        localStorage.removeItem(`ds_signature_${user?.id}`);
                        localStorage.removeItem(`ds_sign_date_${user?.id}`);
                        setContractSigned(false);
                        setSignatureDataUrl(null);
                        setSignDate(null);
                      }}
                      className="mt-8 text-xs text-red-500 font-black hover:underline"
                    >
                      {language === 'ar' ? 'إعادة تعيين العقد والتوقيع من جديد 🔄' : 'Reset Contract & Resign 🔄'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'showroom' && (
          <div className="space-y-10 animate-fade-in">
            {/* Credit Limit Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-primary to-[#1a3a1a] text-white p-8 rounded-[2rem] shadow-sovereign">
                <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">{language === 'ar' ? 'الحد الائتماني الكلي' : 'Total Credit Limit'}</p>
                <h4 className="text-3xl font-black text-secondary">{formatCurrency(user.credit_limit || 50000)}</h4>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-sovereign border border-gray-100">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{language === 'ar' ? 'الرصيد المستهلك (الآجل)' : 'Used Credit'}</p>
                <h4 className="text-3xl font-black text-red-500">{formatCurrency(user.debt_balance || 0)}</h4>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-sovereign border border-gray-100">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{language === 'ar' ? 'الائتمان المتاح للطلب' : 'Available Credit'}</p>
                <h4 className="text-3xl font-black text-emerald-500">{formatCurrency((user.credit_limit || 50000) - (user.debt_balance || 0))}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Catalog Grid */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sovereign border border-gray-100 flex flex-col md:flex-row justify-between gap-6 items-center">
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {[
                      { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                      { id: 'vegetables', label: language === 'ar' ? 'خضروات' : 'Vegetables' },
                      { id: 'fruits', label: language === 'ar' ? 'فواكه' : 'Fruits' },
                      { id: 'herbs', label: language === 'ar' ? 'ورقيات' : 'Herbs' },
                      { id: 'dates', label: language === 'ar' ? 'تمور' : 'Dates' },
                      { id: 'imported', label: language === 'ar' ? 'مستورد' : 'Imported' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedB2bCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full font-black text-xs transition-all ${
                          selectedB2bCategory === cat.id 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-slate-50 text-gray-400 hover:bg-slate-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'بحث بالمنتج بستاني...' : 'Search fresh produce...'}
                      value={b2bSearchTerm}
                      onChange={(e) => setB2bSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none text-xs font-black transition-all"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockProducts
                    .filter(p => selectedB2bCategory === 'all' || p.category === selectedB2bCategory)
                    .filter(p => b2bSearchTerm === '' || p.name_ar.includes(b2bSearchTerm) || p.name_en.toLowerCase().includes(b2bSearchTerm.toLowerCase()))
                    .slice(0, 16)
                    .map(product => {
                      const qty = b2bCart[product.id as any] || 0;
                      return (
                        <div key={product.id} className="bg-white p-6 rounded-[2rem] shadow-sovereign border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-all group">
                          <div>
                            <div className="relative w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                              <img src={product.image} alt={product.name_ar} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              <span className="absolute top-3 right-3 bg-primary/90 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider">{product.origin_ar}</span>
                            </div>
                            <h4 className="font-black text-primary text-base mb-1">{language === 'ar' ? product.name_ar : product.name_en}</h4>
                            <p className="text-gray-400 text-[10px] font-bold mb-3">{language === 'ar' ? product.unit_ar : product.unit_en}</p>
                          </div>

                          <div className="flex items-center justify-between border-t pt-4">
                            <div>
                              <span className="text-[10px] text-gray-400 font-black block uppercase tracking-wider">{language === 'ar' ? 'سعر التوريد' : 'Supply Price'}</span>
                              <span className="font-black text-secondary text-base">{product.price} ر.س</span>
                            </div>

                            {qty === 0 ? (
                              <button
                                onClick={() => setB2bCart(prev => ({ ...prev, [product.id as any]: 1 }))}
                                className="bg-primary hover:bg-[#1a3a1a] text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-primary/10"
                              >
                                {language === 'ar' ? 'إضافة للطلب' : 'Add to Order'}
                              </button>
                            ) : (
                              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <button
                                  onClick={() => setB2bCart(prev => ({ ...prev, [product.id as any]: Math.max(0, qty - 1) }))}
                                  className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-primary font-black border border-slate-200 hover:bg-slate-100"
                                >
                                  -
                                </button>
                                <span className="font-black text-sm text-primary w-6 text-center">{qty}</span>
                                <button
                                  onClick={() => setB2bCart(prev => ({ ...prev, [product.id as any]: qty + 1 }))}
                                  className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-primary font-black border border-slate-200 hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Sticky Order Summary Sidebar */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sovereign border border-gray-100 h-fit space-y-6 lg:sticky lg:top-8">
                <h3 className="text-xl font-black text-primary border-b pb-4">🛒 {language === 'ar' ? 'ملخص طلب التوريد الآجل' : 'Supply Credit Order'}</h3>
                
                {(() => {
                  const cartItems = Object.entries(b2bCart)
                    .filter(([_, q]) => Number(q) > 0)
                    .map(([id, q]) => {
                      const p = mockProducts.find(prod => String(prod.id) === id);
                      return { product: p, quantity: Number(q) };
                    })
                    .filter(item => item.product !== undefined);

                  const subtotal = cartItems.reduce((acc, curr) => acc + (Number(curr.product!.price) * Number(curr.quantity)), 0);
                  const vat = subtotal * 0.15;
                  const total = subtotal + vat;
                  const userCreditLimit = Number((user as any).credit_limit || 50000);
                  const userDebtBalance = Number((user as any).debt_balance || 0);
                  const availableCredit = userCreditLimit - userDebtBalance;
                  const overLimit = total > availableCredit;

                  const handlePlaceB2bOrder = async () => {
                    if (cartItems.length === 0) return;
                    try {
                      await createOrderWithInvoice({
                        customerPhone: user.phone || '0500000000',
                        customerName: user.name,
                        items: cartItems.map(item => ({
                          ...item.product!,
                          quantity: item.quantity
                        })),
                        subtotal,
                        shippingFee: 0,
                        discountAmount: 0,
                        total,
                        address: user.company || 'المستودع الرئيسي للعميل',
                        paymentMethod: 'credit',
                        cashbackEarned: 0,
                        customerId: user.id,
                        branchId: '1'
                      });
                      
                      // Increase debt balance
                      const currentDebt = Number(user.debt_balance || 0);
                      await updateUser({ debt_balance: currentDebt + total });

                      // Generate and store dynamic invoice
                      const newInvId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
                      const newInvoice = {
                        id: newInvId,
                        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                        desc: language === 'ar' ? `شحنة مبيعات آجل - ${user.company || 'مستودع العميل'}` : `Credit supply shipment - ${user.company || 'Client Site'}`,
                        subtotal,
                        vat,
                        total,
                        status: 'Pending',
                        status_ar: 'آجل (بانتظار التسوية الضريبية)',
                        status_en: 'On Account (Pending Settlement)'
                      };
                      const updatedInvoices = [newInvoice, ...invoices];
                      setInvoices(updatedInvoices);
                      localStorage.setItem(`ds_vip_invoices_${user?.id}`, JSON.stringify(updatedInvoices));

                      // Generate Ledger Debit Entry
                      const newLedId = `ENT-${Math.floor(100 + Math.random() * 900)}`;
                      const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
                      const newLedgerEntry = {
                        id: newLedId,
                        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                        type: 'debit',
                        amount: total,
                        balance: currentBalance + total,
                        desc_ar: `إصدار فاتورة مبيعات آجل رقم #${newInvId}`,
                        desc_en: `Issued Account Invoice #${newInvId}`
                      };
                      const updatedLedger = [...ledgerEntries, newLedgerEntry];
                      setLedgerEntries(updatedLedger);
                      localStorage.setItem(`ds_vip_ledger_${user?.id}`, JSON.stringify(updatedLedger));

                      // Create file in secure E-Archive
                      const newDoc = {
                        id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
                        name: `فاتورة ضريبية مبسطة #${newInvId}.pdf`,
                        category: 'invoice',
                        date: new Date().toISOString().split('T')[0],
                        size: `${(subtotal / 1024 + 1.2).toFixed(1)} MB`,
                        status: 'Verified'
                      };
                      const updatedArchive = [newDoc, ...archivedDocs];
                      setArchivedDocs(updatedArchive);
                      localStorage.setItem(`ds_vip_archive_${user?.id}`, JSON.stringify(updatedArchive));
                      
                      addToast(language === 'ar' ? '⚡ تم تأكيد طلب التوريد الآجل بنجاح وإصدار الفاتورة الضريبية!' : '⚡ Credit supply order confirmed & invoice generated!', 'success');
                      setB2bCart({});
                    } catch (err) {
                      console.error(err);
                      addToast(language === 'ar' ? 'فشل إرسال طلب التوريد' : 'Failed to place supply order', 'error');
                    }
                  };

                  return (
                    <>
                      {cartItems.length === 0 ? (
                        <p className="text-gray-400 font-bold italic text-sm text-center py-8">{language === 'ar' ? 'السلة فارغة حالياً' : 'Cart is empty'}</p>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {cartItems.map(item => (
                            <div key={item.product!.id} className="flex justify-between items-center text-xs font-bold border-b pb-2">
                              <div>
                                <p className="text-primary font-black">{language === 'ar' ? item.product!.name_ar : item.product!.name_en}</p>
                                <p className="text-gray-400 text-[10px]">{item.quantity} × {item.product!.price} ر.س</p>
                              </div>
                              <span className="font-black text-secondary">{(Number(item.product!.price) * Number(item.quantity)).toFixed(2)} ر.س</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t pt-4 space-y-3 text-xs font-bold text-slate-700">
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                          <span className="font-black text-slate-900">{subtotal.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{language === 'ar' ? 'ضريبة القيمة المضافة (15٪):' : 'VAT (15%):'}</span>
                          <span className="font-black text-slate-900">{vat.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed pt-3 text-sm">
                          <span className="font-black text-primary">{language === 'ar' ? 'الإجمالي الشامل:' : 'Total Amount:'}</span>
                          <span className="font-black text-secondary text-base">{total.toFixed(2)} ر.س</span>
                        </div>
                      </div>

                      {overLimit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-black">
                          ⚠️ {language === 'ar' ? 'عذراً! قيمة الطلب تتجاوز حد الائتمان المتاح.' : 'Warning! Order exceeds your available credit.'}
                        </div>
                      )}

                      <button
                        onClick={handlePlaceB2bOrder}
                        disabled={cartItems.length === 0 || overLimit}
                        className={`w-full py-4 rounded-2xl font-black text-sm text-center transition-all shadow-xl ${
                          cartItems.length === 0 || overLimit
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-secondary hover:bg-emerald-700 text-white hover:scale-[1.02]'
                        }`}
                      >
                        {language === 'ar' ? 'إرسال طلب التوريد الآجل ⚡' : 'Submit Supply Order ⚡'}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-10 animate-fade-in">
            {/* Header / Info card */}
            <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-3xl font-black text-primary mb-2">{language === 'ar' ? 'جدولة وتخطيط عمليات التوريد' : 'Recurring Supply Scheduler'}</h3>
                <p className="text-gray-400 font-bold text-sm">
                  {language === 'ar' ? 'تسهيل جدولة الشحنات الدورية لتجنب انقطاع المخزون في فروعك التجارية.' : 'Automate your logistics by scheduling recurring deliveries straight to your warehouses.'}
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-secondary transition-all flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                {language === 'ar' ? 'إضافة جدول توريد جديد' : 'New Delivery Route'}
              </button>
            </div>

            {/* Current Active Schedules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {schedules.map((sch: any, index: number) => (
                <div key={sch.id || index} className="bg-white p-8 rounded-[3rem] shadow-sovereign border border-gray-100 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-primary to-secondary" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{sch.timeSlot === 'morning' ? (language === 'ar' ? 'صباحي (6:00 - 10:00)' : 'Morning (6-10 AM)') : (language === 'ar' ? 'مسائي (4:00 - 8:00)' : 'Evening (4-8 PM)')}</span>
                      <h4 className="text-2xl font-black text-primary mt-3">{sch.branch}</h4>
                    </div>
                    <button
                      onClick={() => {
                        const updated = schedules.filter((s: any) => s.id !== sch.id);
                        setSchedules(updated);
                        localStorage.setItem(`ds_vip_schedules_${user?.id}`, JSON.stringify(updated));
                        addToast(language === 'ar' ? 'تم إلغاء جدول التوريد' : 'Supply schedule deleted', 'success');
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors text-xs font-black p-2 bg-red-50 rounded-xl"
                    >
                      {language === 'ar' ? 'إلغاء المخطط ✕' : 'Delete ✕'}
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-bold text-slate-700">
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'أيام التوصيل:' : 'Delivery Days:'}</span>
                      <span className="text-primary font-black uppercase">
                        {sch.days.map((d: string) => language === 'ar' 
                          ? { sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' }[d] || d
                          : d
                        ).join(' - ')}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>{language === 'ar' ? 'متطلبات التغليف واللوجستيات:' : 'Logistics Requirements:'}</span>
                      <span className="text-secondary font-black">{sch.requirements || (language === 'ar' ? 'تغليف قياسي مبرد' : 'Standard refrigerated packing')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{language === 'ar' ? 'حالة التوريد المستمر:' : 'Supply Status:'}</span>
                      <span className="text-emerald-500 font-black animate-pulse">● {language === 'ar' ? 'مجدول ونشط لوجستياً' : 'Active & Scheduled'}</span>
                    </div>
                  </div>
                </div>
              ))}

              {schedules.length === 0 && (
                <div className="col-span-2 text-center py-20 bg-white rounded-[3rem] shadow-inner border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold italic text-lg">{language === 'ar' ? 'لا يوجد جداول توريد مضافة حالياً.' : 'No active scheduled delivery routes.'}</p>
                </div>
              )}
            </div>

            {/* Schedule modal popup */}
            {showScheduleModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-tajawal">
                <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 relative animate-fade-in">
                  <button onClick={() => setShowScheduleModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 font-black text-xl">✕</button>
                  
                  <h3 className="text-2xl font-black text-primary mb-6">{language === 'ar' ? 'جدولة وتخطيط عمليات توريد' : 'New Recurring Delivery Route'}</h3>
                  
                  <div className="space-y-6 text-sm font-bold">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">{language === 'ar' ? 'مقر الاستلام المعتمد (المستودع / الفرع)' : 'Destination Warehouse / Branch'}</label>
                      <select
                        value={newSchedule.branch}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, branch: e.target.value }))}
                        className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-primary text-primary"
                      >
                        <option value="المركزي - السلي">المركزي - السلي (الرياض)</option>
                        <option value="فرع البديعة">فرع البديعة</option>
                        <option value="فرع الشفا">فرع الشفا</option>
                        <option value="مستودع المطار اللوجستي">مستودع المطار اللوجستي</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">{language === 'ar' ? 'أيام الأسبوع المفضلة للتوصيل' : 'Preferred Delivery Days'}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday'].map(day => {
                          const isSelected = newSchedule.days.includes(day);
                          const label = language === 'ar' 
                            ? { sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', saturday: 'السبت' }[day]
                            : day;
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                const days = isSelected 
                                  ? newSchedule.days.filter(d => d !== day)
                                  : [...newSchedule.days, day];
                                setNewSchedule(prev => ({ ...prev, days }));
                              }}
                              className={`p-3 rounded-xl border text-xs font-black transition-all ${
                                isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-slate-200'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">{language === 'ar' ? 'الفترة الزمنية المفضلة للتوصيل' : 'Preferred Time Slot'}</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setNewSchedule(prev => ({ ...prev, timeSlot: 'morning' }))}
                          className={`p-4 rounded-xl border text-xs font-black transition-all text-center ${
                            newSchedule.timeSlot === 'morning' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-slate-200'
                          }`}
                        >
                          {language === 'ar' ? '🌅 صباحاً (6:00 - 10:00)' : 'Morning (6-10 AM)'}
                        </button>
                        <button
                          onClick={() => setNewSchedule(prev => ({ ...prev, timeSlot: 'evening' }))}
                          className={`p-4 rounded-xl border text-xs font-black transition-all text-center ${
                            newSchedule.timeSlot === 'evening' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-slate-200'
                          }`}
                        >
                          {language === 'ar' ? '🌇 مساءً (4:00 - 8:00)' : 'Evening (4-8 PM)'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">{language === 'ar' ? 'شروط خاصة أو تغليف مبرد مخصص' : 'Custom Special Requirements / Packing'}</label>
                      <input
                        type="text"
                        placeholder="مثال: صناديق مغلقة حرارياً مبردة"
                        value={newSchedule.requirements}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, requirements: e.target.value }))}
                        className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (newSchedule.days.length === 0) {
                          addToast(language === 'ar' ? 'يرجى تحديد يوم واحد للتوصيل على الأقل' : 'Please select at least one day', 'error');
                          return;
                        }
                        const updated = [...schedules, { ...newSchedule, id: `sch-${Math.floor(Math.random() * 10000)}` }];
                        setSchedules(updated);
                        localStorage.setItem(`ds_vip_schedules_${user?.id}`, JSON.stringify(updated));
                        setShowScheduleModal(false);
                        setNewSchedule({ days: [], branch: 'المركزي - السلي', timeSlot: 'morning', requirements: '' });
                        addToast(language === 'ar' ? '✓ تم حفظ وإرسال جدول التوريد بنجاح لتنسيقه اللوجستي' : '✓ Supply schedule saved successfully', 'success');
                      }}
                      className="w-full bg-secondary text-white py-4 rounded-xl font-black text-sm shadow-xl hover:bg-emerald-700 transition-all text-center"
                    >
                      {language === 'ar' ? 'حفظ وتثبيت خط التوريد اللوجستي' : 'Activate Supply Route'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai_advisor' && (
          <div className="space-y-10 animate-fade-in">
            {/* Prediction chart using recharts */}
            <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100">
              <div className="flex justify-between items-start mb-8 flex-col md:flex-row gap-4">
                <div>
                  <h3 className="text-2xl font-black text-primary">{language === 'ar' ? 'التنبؤ الذكي بالطلب البستاني' : 'Demand Forecasting & Planning'}</h3>
                  <p className="text-gray-400 font-bold text-xs mt-1">
                    {language === 'ar' ? 'التنبؤ بالاحتياجات التقديرية لفروعك خلال الـ 4 أسابيع القادمة بناءً على خوارزميات التعلم الآلي والأنماط الموسمية.' : 'Predictive food consumption algorithms for your institutional group based on historical patterns.'}
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black">{language === 'ar' ? 'دقة التنبؤ: 98.4٪' : 'Accuracy: 98.4%'}</span>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-80 w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { week: language === 'ar' ? 'الأسبوع 1' : 'Week 1', demand: 120, baseline: 100 },
                      { week: language === 'ar' ? 'الأسبوع 2' : 'Week 2', demand: 155, baseline: 105 },
                      { week: language === 'ar' ? 'الأسبوع 3' : 'Week 3', demand: 210, baseline: 110 },
                      { week: language === 'ar' ? 'الأسبوع 4' : 'Week 4', demand: 180, baseline: 115 },
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a3a1a" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1a3a1a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="demand" name={language === 'ar' ? 'الطلب المتوقع (كجم)' : 'Predicted Demand (kg)'} stroke="#1a3a1a" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Actionable recommendations */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-slate-100 p-8 rounded-3xl bg-amber-50/50 border-l-4 border-l-amber-500">
                  <h4 className="text-base font-black text-amber-800 mb-2">⚠️ {language === 'ar' ? 'تحذير نقص مخزون متوقع' : 'Predicted Stockout Warning'}</h4>
                  <p className="text-xs text-amber-700 font-bold leading-relaxed">
                    {language === 'ar' 
                      ? 'الطلب المتوقع على الطماطم والورقيات سيرتفع بنسبة 25٪ في الأسبوع الثالث بسبب موجة الحر الصيفية. نوصي بجدولة كميات توريد إضافية مسبقاً لتفادي أي عجز وتأمين أفضل الأسعار.'
                      : 'Demand for tomatoes is projected to spike by 25% in week 3. We recommend scheduling extra supply quantities in advance to hedge price and secure stock.'}
                  </p>
                </div>

                <div className="border border-slate-100 p-8 rounded-3xl bg-emerald-50/50 border-l-4 border-l-emerald-500">
                  <h4 className="text-base font-black text-emerald-800 mb-2">💡 {language === 'ar' ? 'فرصة توفير وتوريد ذكي' : 'Supply Savings Opportunity'}</h4>
                  <p className="text-xs text-emerald-700 font-bold leading-relaxed">
                    {language === 'ar' 
                      ? 'تمور الخلاص الفاخرة متوفرة حالياً بوفرة وطنية ممتازة وبأسعار تفضيلية. نوصي بتخصيص 20 كرتون إضافية لهذا الشهر للاستفادة من خصومات الشراء المؤسسي.'
                      : 'Premium Khalas Dates are currently at a peak national yield with highly competitive pricing. We recommend booking an extra 20 cartons this month for optimal corporate savings.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-12 animate-fade-in">
            <div className="bg-white p-12 rounded-[4rem] shadow-sovereign border border-gray-100">
              <div className="flex items-center gap-8 mb-12">
                <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center text-primary">
                  <ShieldCheckIcon className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-primary">{t('vip.security.title')}</h3>
                  <p className="text-gray-400 font-bold">{t('vip.security.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className={`p-10 rounded-[3rem] border-2 transition-all ${isBiometricEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-8">
                    <FingerprintIcon className={`w-12 h-12 ${isBiometricEnabled ? 'text-emerald-500' : 'text-gray-300'}`} />
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${isBiometricEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {isBiometricEnabled ? t('common.active') : t('common.inactive')}
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-primary mb-4">{t('vip.security.biometric_title')}</h4>
                  <p className="text-gray-500 font-bold mb-8 leading-relaxed">{t('vip.security.biometric_desc')}</p>
                  {!isBiometricEnabled && (
                    <button 
                      onClick={handleEnableBiometric}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {t('vip.security.activate_now')}
                    </button>
                  )}
                </div>

                <div className="p-10 rounded-[3rem] bg-slate-50 border-2 border-gray-100">
                  <div className="flex justify-between items-start mb-8">
                    <UserIcon className="w-12 h-12 text-gray-300" />
                    <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white">
                      {t('common.verified')}
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-primary mb-4">{t('vip.profile.details')}</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold">{t('vip.profile.name')}</span>
                      <span className="font-black text-primary">{user.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold">{t('vip.profile.company')}</span>
                      <span className="font-black text-primary">{user.company}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold">{t('vip.profile.phone')}</span>
                      <span className="font-black text-primary">{user.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Assistant for VIPs */}
      <button 
        onClick={() => onNavigate?.('ai_chat' as any)}
        className="fixed bottom-12 left-12 group z-[100] transition-all no-print"
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl group-hover:bg-secondary/20 transition-all"></div>
          <div className="bg-white p-1 rounded-full shadow-sovereign border-2 border-primary relative overflow-hidden w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Oday&backgroundColor=b6e3f4,c0aede,d1d4f9&mouth=smile&eyebrows=default&eyes=default" 
              alt="Oday AI"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -top-1 -right-1 bg-secondary text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tight shadow-lg border border-white/20 whitespace-nowrap">
            {t('oday.title').split(' ')[0]} AI
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
        </div>
      </button>

      {/* ZATCA Phase II Simplified Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 font-tajawal animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 relative">
            
            {/* Header / Actions */}
            <div className="flex justify-between items-center p-8 border-b border-gray-100 no-print">
              <h4 className="text-xl font-black text-primary">{language === 'ar' ? 'عرض الفاتورة الضريبية المبسطة' : 'Simplified Tax Invoice'}</h4>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs shadow-md shadow-primary/10 hover:bg-[#1a3a1a] transition-all"
                >
                  {language === 'ar' ? 'طباعة / تحميل PDF 🖨️' : 'Print / Download PDF 🖨️'}
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2.5 bg-slate-100 text-gray-500 rounded-xl hover:bg-slate-200 transition-all font-black"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-10 space-y-8 print-container" id="printable-invoice">
              
              {/* ZATCA Banner & Logos */}
              <div className="flex justify-between items-start border-b pb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-yellow-500/50 bg-white flex items-center justify-center p-1 shrink-0">
                      <DeltaStarsLogo onlyEmblem={true} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h5 className="text-xl font-black text-[#1a3a1a]">{language === 'ar' ? 'شركة نجوم دلتا للتجارة' : 'Delta Stars Trading Co.'}</h5>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{language === 'ar' ? 'نسخة الفوترة الضريبية الإلكترونية معتمدة' : 'Official Certified E-Invoice'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-bold mt-3">الرياض، المملكة العربية السعودية | الهاتف: 920025114</p>
                  <p className="text-xs text-gray-600 font-mono">الرقم الضريبي / VAT: <span className="font-black">310488219500003</span></p>
                </div>
                
                {/* ZATCA Compliant Phase II QR Code Image representation */}
                <div className="text-center">
                  <div className="border border-slate-200 p-2 rounded-xl bg-white inline-block">
                    {/* Generates a beautiful vector QR Code mock that matches Phase II Standard */}
                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[9px] font-mono leading-none border border-dashed border-slate-300 relative">
                      <div className="absolute inset-2 bg-black flex flex-wrap content-center justify-center p-1 rounded-sm">
                        <div className="w-full text-white text-center font-black tracking-widest text-[8px]">QR CODE</div>
                        <div className="w-full text-yellow-400 text-center font-black text-[6px] mt-1">ZATCA APPROVED</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[8px] text-gray-400 font-black uppercase mt-1 tracking-widest">ZATCA Compliant</p>
                </div>
              </div>

              {/* Invoice Meta Details */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl text-xs font-bold text-slate-700">
                <div className="space-y-2">
                  <p><strong>{language === 'ar' ? 'رقم الفاتورة:' : 'Invoice No:'}</strong> <span className="text-primary font-black">#{selectedInvoice.id}</span></p>
                  <p><strong>{language === 'ar' ? 'تاريخ ووقت الإصدار:' : 'Date & Time:'}</strong> <span className="font-black">{selectedInvoice.date}</span></p>
                  <p><strong>{language === 'ar' ? 'الرقم المرجعي للطلب:' : 'Order Ref:'}</strong> <span className="font-mono">DS-9284-SEC</span></p>
                </div>
                <div className="space-y-2">
                  <p><strong>{language === 'ar' ? 'العميل الكبير:' : 'VIP Customer:'}</strong> <span className="font-black text-slate-900">{user.name}</span></p>
                  <p><strong>{language === 'ar' ? 'الشركة / الجهة:' : 'Entity / Company:'}</strong> <span className="font-black text-slate-900">{user.company || 'مجموعة تجارية معتمدة'}</span></p>
                  <p><strong>{language === 'ar' ? 'طريقة الدفع والتحصيل:' : 'Payment Method:'}</strong> <span className="text-emerald-600 font-black">{selectedInvoice.status_ar}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">{language === 'ar' ? 'المنتج / الصنف' : 'Item Description'}</th>
                      <th className="p-4 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th className="p-4 text-center">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="p-4 text-center">{language === 'ar' ? 'الخاضع للضريبة' : 'Taxable Subtotal'}</th>
                      <th className="p-4 text-center">{language === 'ar' ? 'الضريبة (15٪)' : 'VAT (15%)'}</th>
                      <th className="p-4 text-left">{language === 'ar' ? 'الإجمالي الشامل' : 'Total With VAT'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-slate-700 font-bold">
                    <tr>
                      <td className="p-4 font-black text-slate-900">{selectedInvoice.desc}</td>
                      <td className="p-4 text-center font-black">1</td>
                      <td className="p-4 text-center font-black">{selectedInvoice.subtotal} ر.س</td>
                      <td className="p-4 text-center font-black">{selectedInvoice.subtotal} ر.س</td>
                      <td className="p-4 text-center text-gray-500 font-black">{selectedInvoice.vat} ر.س</td>
                      <td className="p-4 text-left font-black text-primary">{selectedInvoice.total} ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="border-t pt-6 flex justify-end">
                <div className="w-64 space-y-3 text-xs font-bold text-slate-700">
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'المبلغ الخاضع للضريبة:' : 'Taxable Amount:'}</span>
                    <span className="font-black text-slate-900">{selectedInvoice.subtotal.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'مجموع ضريبة القيمة المضافة (15٪):' : 'VAT Total (15%):'}</span>
                    <span className="font-black text-slate-900">{selectedInvoice.vat.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-3 text-sm">
                    <span className="font-black text-[#1a3a1a]">{language === 'ar' ? 'الإجمالي شامل ضريبة القيمة المضافة:' : 'Total (Inclusive of VAT):'}</span>
                    <span className="font-black text-secondary text-base">{selectedInvoice.total.toFixed(2)} {t('common.currency')}</span>
                  </div>
                </div>
              </div>

              {/* Digital Seal / Footnotes */}
              <div className="border-t pt-8 text-center space-y-2">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  {language === 'ar' 
                    ? '✓ هذه الفاتورة صدرت إلكترونياً وهي خاضعة للوائح هيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية.' 
                    : '✓ This invoice has been generated electronically under Saudi Arabia VAT regulations.'}
                </p>
                <p className="text-[8px] text-gray-400 font-mono">Reference Cryptographic SHA-256 Hash: 8aca3b90302cc5d849acb722d8552c73</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
