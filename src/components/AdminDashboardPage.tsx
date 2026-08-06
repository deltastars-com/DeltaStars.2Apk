import React, { useState } from 'react';
import { useFirebase } from './lib/contexts';
import { motion } from 'framer-motion';
import { DeltaStarsLogo } from './DeltaStarsLogo';

// استيراد كافة المكونات (مع ضمان عدم وجود استيراد متداخل)
import { ProductManagementSection } from './ProductManagementSection';
import { OrderManagementSection } from './OrderManagementSection';
import { MarketingView } from './MarketingView';
import { WarehouseView } from './WarehouseView';
import AccountingSection from './AccountingSection';
import QualityManagement from './QualityManagement';
import ComplaintsManagement from './ComplaintsManagement';
import { AdManagementSection } from './AdManagementSection';
import { HomeSectionManagementSection } from './HomeSectionManagementSection';
import { CouponManagementSection } from './CouponManagementSection';
import { BranchManagementSection } from './BranchManagementSection';
import SecuritySection from './SecuritySection';
import { DeveloperDashboard } from './DeveloperDashboard';
import { AdminNotificationSystem } from './AdminNotificationSystem';

// استيراد منفصل للمكون الرئيسي لتجنب التداخل
import { MasterControlPanel } from './MasterControlPanel';

// استيراد الأيقونات المناسبة
import { 
  ShieldCheckIcon, DatabaseIcon, TruckIcon, WalletIcon, BellIcon, ZapIcon,
  UserIcon, LockIcon, ArrowLeftIcon, RefreshCcwIcon
} from './lib/contexts/Icons';

export default function AdminDashboard({ user }: { user: any }) {
  const { products, orders, invoices, updateProduct, addProduct, updateOrder, loading } = useFirebase();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-tajawal">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-t-4 border-yellow-400 border-r-4 border-emerald-500 rounded-full mb-6"
        />
        <div className="text-center">
          <p className="text-xl font-black text-white">جاري تهيئة النظام السيادي...</p>
          <p className="text-xs text-yellow-400/70 mt-2 tracking-widest uppercase">Initializing Delta Stars Security Protocol</p>
        </div>
      </div>
    );
  }

  // تصنيفات القائمة الجانبية
  const navigationGroups = [
    {
      title: 'الرئيسية والعمليات',
      items: [
        { id: 'overview', label: 'لوحة الكنترول الرئيسية', desc: 'نظرة عامة على أداء الأنظمة', icon: <DatabaseIcon className="w-5 h-5" /> },
        { id: 'orders', label: 'الطلبات والعمليات النشطة', desc: 'التحكم بالطلبات الواردة', badge: orders?.length || 0, icon: <BellIcon className="w-5 h-5 text-amber-400" /> },
        { id: 'products', label: 'المنتجات والأسعار السيادية', desc: 'تحديث الأسعار والمخزون', badge: products?.length || 0, icon: <ZapIcon className="w-5 h-5" /> },
        { id: 'warehouse', label: 'حالة المستودع والمخازن', desc: 'الجرد السريع وحركة المخزن', icon: <RefreshCcwIcon className="w-5 h-5" /> },
        { id: 'branches', label: 'الفروع الستة والخرائط GPS', desc: 'مواقع الفروع ومندوبي الشحن', icon: <TruckIcon className="w-5 h-5" /> },
      ]
    },
    {
      title: 'التسويق وتجربة العميل',
      items: [
        { id: 'marketing', label: 'البرامج التسويقية والنمو', desc: 'حملات الرسائل والتوصيات', icon: <UserIcon className="w-5 h-5" /> },
        { id: 'ads', label: 'البنرات والمساحات الإعلانية', desc: 'عروض الشاشة الرئيسية وصالات العرض', icon: <ZapIcon className="w-5 h-5 text-yellow-400" /> },
        { id: 'coupons', label: 'الكوبونات وأنظمة الكاش باك', desc: 'أكواد الخصم والجوائز المالية', icon: <WalletIcon className="w-5 h-5" /> },
        { id: 'sections', label: 'هيكلة أقسام المتجر', desc: 'ترتيب وتصنيف المجموعات', icon: <DatabaseIcon className="w-5 h-5" /> },
      ]
    },
    {
      title: 'الرقابة والجودة والمحاسبة',
      items: [
        { id: 'accounting', label: 'النظام المحاسبي والمالي المتقدم', desc: 'المبيعات، المشتريات والتقارير', icon: <WalletIcon className="w-5 h-5 text-emerald-400" /> },
        { id: 'quality', label: 'رقابة جودة المنتجات والأغذية', desc: 'تقييم وصلاحية المعروضات', icon: <ShieldCheckIcon className="w-5 h-5 text-emerald-400" /> },
        { id: 'complaints', label: 'الشكاوى والمناديب والسائقين', desc: 'مركز المساعدة وخدمة العملاء', icon: <UserIcon className="w-5 h-5" /> },
      ]
    },
    {
      title: 'الأمان والتحكم التقني',
      items: [
        { id: 'security', label: 'الأمن والسياسات والصلاحيات', desc: 'إدارة كلمات المرور والمستخدمين', icon: <LockIcon className="w-5 h-5 text-red-400" /> },
        { id: 'developer', label: 'بوابة المطور والتحكم الرمزي', desc: 'سجلات النظام والربط التقني', icon: <ShieldCheckIcon className="w-5 h-5 text-blue-400" /> },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-900/5 text-slate-800 font-tajawal" dir="rtl">
      {/* القائمة الجانبية السلسة والفاخرة */}
      <aside className="w-80 bg-primary-dark text-white flex flex-col border-l-4 border-yellow-500/30 shrink-0 shadow-2xl relative">
        <div className="p-8 border-b border-white/10 flex items-center gap-4 bg-black/20">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-yellow-400 shadow-xl shadow-yellow-500/20 bg-white flex items-center justify-center p-0.5 shrink-0">
            <DeltaStarsLogo onlyEmblem={true} fitMode="cover" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">نجوم دلتا</h2>
            <p className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-wider">نظام الإدارة السيادي</p>
          </div>
        </div>

        {/* قائمة تصفح التبويبات المجمعة */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="text-[10px] text-yellow-400/50 font-black uppercase tracking-widest px-4">
                {group.title}
               </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-right px-4 py-3 rounded-2xl transition-all flex items-center justify-between group ${
                        isActive 
                          ? 'bg-yellow-500 text-primary-dark font-black shadow-lg shadow-yellow-500/20' 
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary-dark/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
                          {item.icon}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black leading-none">{item.label}</p>
                          <p className={`text-[9px] mt-1 leading-none ${isActive ? 'text-primary-dark/70' : 'text-white/40 group-hover:text-white/60'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-primary-dark text-yellow-400' : 'bg-red-500 text-white animate-pulse'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ذيل القائمة - معلومات الاتصال بالدعم والتحكم */}
        <div className="p-6 border-t border-white/10 bg-black/20 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>مدير معتمد: {user?.name || 'مدير عام'}</span>
          </div>
          <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Delta Stars Command Center v4.0</p>
        </div>
      </aside>

      {/* منطقة المحتوى التفاعلية الفخمة */}
      <main className="flex-1 bg-slate-900/5 p-8 md:p-12 overflow-y-auto relative">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
        
        {/* ترويسة الصفحة النشطة */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 uppercase tracking-wider">
                Sovereign Control
              </span>
              <span className="text-xs font-mono text-slate-400">
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mt-2">
              {activeTab === 'overview' && 'لوحة التحكم والمراقبة العامة'}
              {activeTab === 'orders' && 'كنترول استقبال وإدارة الطلبات'}
              {activeTab === 'products' && 'منصة إدارة المنتجات والأسعار'}
              {activeTab === 'warehouse' && 'بوابة إدارة المستودع والمخازن'}
              {activeTab === 'branches' && 'إدارة الفروع وتتبع السائقين GPS'}
              {activeTab === 'marketing' && 'مركز إدارة البرامج التسويقية'}
              {activeTab === 'ads' && 'إدارة العروض الترويجية والبنرات'}
              {activeTab === 'coupons' && 'إدارة الكوبونات وجوائز الكاش باك'}
              {activeTab === 'sections' && 'هيكلة وتصنيف المجموعات والأقسام'}
              {activeTab === 'accounting' && 'النظام المحاسبي والمالي المتكامل'}
              {activeTab === 'quality' && 'رقابة الجودة وتاريخ صلاحية المعروضات'}
              {activeTab === 'complaints' && 'إدارة خدمات الشكاوى والمناديب والعملاء'}
              {activeTab === 'security' && 'أمن وحماية النظام وإدارة الصلاحيات'}
              {activeTab === 'developer' && 'بوابة المطور ومحرك الأتمتة المتقدم'}
            </h1>
          </div>

          {/* نظام الإشعارات الفورية والتنبيهات الصوتية الحية */}
          <AdminNotificationSystem 
            orders={orders || []} 
            onNavigateTab={(tab) => setActiveTab(tab)} 
          />
        </header>

        {/* عرض القسم النشط */}
        <div className="relative z-10 animate-fade-in">
          {activeTab === 'overview' && <MasterControlPanel />}
          {activeTab === 'products' && <ProductManagementSection />}
          {activeTab === 'orders' && <OrderManagementSection orders={orders} />}
          {activeTab === 'marketing' && (
            <MarketingView 
              products={products || []} 
              onUpdateProduct={updateProduct}
              onAddProduct={addProduct}
              onBack={() => setActiveTab('overview')}
            />
          )}
          {activeTab === 'warehouse' && (
            <WarehouseView 
              products={products || []} 
              orders={orders || []} 
              invoices={invoices || []}
              onUpdateStock={(productId, newQty) => updateProduct(productId, { stock_quantity: newQty })}
              onUpdateOrderStatus={(orderId, status) => updateOrder(orderId, { status })}
              onBack={() => setActiveTab('overview')}
            />
          )}
          {activeTab === 'accounting' && (
            <AccountingSection 
              language="ar"
              orders={orders || []}
              products={products || []}
              invoices={invoices || []}
              handleUpdateOrder={updateOrder}
              addToast={(msg, type) => {
                console.log(`[Accounting Toast] ${type}: ${msg}`);
              }}
            />
          )}
          {activeTab === 'quality' && <QualityManagement />}
          {activeTab === 'complaints' && <ComplaintsManagement />}
          {activeTab === 'ads' && <AdManagementSection />}
          {activeTab === 'sections' && <HomeSectionManagementSection />}
          {activeTab === 'coupons' && <CouponManagementSection />}
          {activeTab === 'branches' && <BranchManagementSection />}
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'developer' && <DeveloperDashboard />}
        </div>
      </main>
    </div>
  );
}
