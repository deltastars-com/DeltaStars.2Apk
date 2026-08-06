import React, { useState, useMemo } from 'react';
import { Order, Product, Invoice } from '../types';
import { CHART_OF_ACCOUNTS } from './lib/AccountingEngine';
import { ZatcaInvoiceView } from './accounting/ZatcaInvoiceView';
import { JournalLedgerView } from './accounting/JournalLedgerView';
import { EArchivingView } from './accounting/EArchivingView';
import { EContractsView } from './accounting/EContractsView';
import { FinancialReportsView } from './accounting/FinancialReportsView';
import { OnyxErpIntegrationView } from './accounting/OnyxErpIntegrationView';
import {
  TrendingUp,
  FileText,
  Archive,
  Award,
  RefreshCw,
  Sparkles,
  Users,
  CheckCircle2,
  DollarSign,
  Briefcase,
  AlertCircle,
  Database,
  Building,
  Activity,
  Layers,
  PieChart
} from 'lucide-react';

interface AccountingSectionProps {
  language: 'ar' | 'en';
  orders: Order[];
  products: Product[];
  invoices: Invoice[];
  handleUpdateOrder: (orderId: string, data: Partial<Order>) => Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AccountingSection: React.FC<AccountingSectionProps> = ({
  language,
  orders,
  products,
  invoices,
  handleUpdateOrder,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'onyx_erp' | 'zatca_invoices' | 'journal_ledgers' | 'e_archiving' | 'e_contracts' | 'financial_reports'>(
    'overview'
  );

  // ERP Sync Simulation State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>(['جاهز للمزامنة مع نظام Onyx Pro ERP...']);

  // Financial calculations
  const totalSales = useMemo(() => orders.reduce((sum, o) => sum + (o.total || 0), 0), [orders]);
  const estimatedCost = useMemo(() => totalSales * 0.7, [totalSales]); // 70% COGS estimate
  const netProfit = useMemo(() => totalSales - estimatedCost, [totalSales, estimatedCost]);
  const vatCollected = useMemo(() => totalSales * 0.15, [totalSales]);

  // Handle Onyx Pro ERP Sync
  const handleErpSync = () => {
    setIsSyncing(true);
    setSyncLogs((prev) => [...prev, 'بدء المزامنة اللحظية للقيود اليومية والفواتير الرقمية...']);

    setTimeout(() => {
      setSyncLogs((prev) => [
        ...prev,
        'تصدير 14 قيداً محاسبياً إلى قاعدة بيانات Onyx Pro بنجاح.',
        'التحقق من مطابقة ضريبة القيمة المضافة مع الهيئة العامة للزكاة والجمارك (ZATCA)...',
      ]);
    }, 1200);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncLogs((prev) => [...prev, 'تمت المزامنة بنجاح! السجلات مطابقة ومتكاملة 100%.']);
      addToast(
        language === 'ar' ? 'تمت مزامنة البيانات المالية مع Onyx Pro ERP بنجاح' : 'ERP Sync completed successfully!',
        'success'
      );
    }, 2800);
  };

  // Pending order approvals
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);

  const approveOrderAndInvoice = async (order: Order) => {
    try {
      await handleUpdateOrder(order.id, { status: 'preparing' });
      addToast(
        language === 'ar'
          ? `تم اعتماد الطلب #${order.id} وترحيله للفوترة الإلكترونية`
          : `Order #${order.id} approved and routed to invoicing`,
        'success'
      );
    } catch (e) {
      addToast(language === 'ar' ? 'حدث خطأ أثناء ترحيل الطلب' : 'Error approving order', 'error');
    }
  };

  return (
    <div className="w-full space-y-8 font-tajawal pb-12">
      {/* Upper Navigation & Tab Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl border border-white/5">
        <div className="flex items-center gap-4 text-center md:text-right">
          <div className="p-3 bg-yellow-400 text-slate-900 rounded-2xl shadow-lg">
            <Building className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              {language === 'ar' ? 'النظام المحاسبي والمالي المتكامل' : 'Unified Financial & ERP System'}
              <span className="text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2.5 py-1 rounded-full font-black uppercase">
                PRO v6.2
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">
              شركة نجوم دلتا المحدودة | إدارة وتتبع الأداء المالي والوثائق الرقمية والتعاقدات
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            {language === 'ar' ? 'نظرة عامة' : 'Overview'}
          </button>
          <button
            onClick={() => setActiveTab('onyx_erp')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'onyx_erp'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-white/10'
            }`}
          >
            <Database className="w-4 h-4 text-amber-400" />
            {language === 'ar' ? 'ربط أونكس برو ERP' : 'Onyx Pro Integration'}
          </button>
          <button
            onClick={() => setActiveTab('zatca_invoices')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'zatca_invoices'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            {language === 'ar' ? 'الفوترة الإلكترونية ZATCA' : 'ZATCA Billing'}
          </button>
          <button
            onClick={() => setActiveTab('financial_reports')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'financial_reports'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <PieChart className="w-4 h-4" />
            {language === 'ar' ? 'التقارير والمؤشرات المالية' : 'Financial Reports'}
          </button>
          <button
            onClick={() => setActiveTab('journal_ledgers')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'journal_ledgers'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            {language === 'ar' ? 'القيود والدفاتر المحاسبية' : 'Ledgers & Journals'}
          </button>
          <button
            onClick={() => setActiveTab('e_archiving')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'e_archiving'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Archive className="w-4 h-4" />
            {language === 'ar' ? 'أرشيف المستندات' : 'E-Archiving'}
          </button>
          <button
            onClick={() => setActiveTab('e_contracts')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'e_contracts'
                ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4" />
            {language === 'ar' ? 'بوابة التعاقد والتوثيق' : 'E-Contracts'}
          </button>
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Financial Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
              <span className="text-xs text-slate-400 font-black uppercase">إجمالي مبيعات المتجر</span>
              <h4 className="text-2xl font-black text-slate-800 mt-2 font-mono">
                {totalSales.toLocaleString()} ر.س
              </h4>
              <p className="text-[10px] text-green-500 font-bold mt-2">زيادة 12.4% عن الشهر السابق</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
              <span className="text-xs text-slate-400 font-black uppercase">التكلفة التقديرية للبضاعة (COGS)</span>
              <h4 className="text-2xl font-black text-red-500 mt-2 font-mono">
                {estimatedCost.toLocaleString()} ر.س
              </h4>
              <p className="text-[10px] text-slate-400 font-bold mt-2">بمعدل ربح هامشي 30%</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
              <span className="text-xs text-slate-400 font-black uppercase">صافي الأرباح التشغيلية</span>
              <h4 className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                {netProfit.toLocaleString()} ر.س
              </h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-2">أرباح نقدية حرة قابلة للتوزيع</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
              <span className="text-xs text-slate-400 font-black uppercase">الالتزام الضريبي (المدخلات 15%)</span>
              <h4 className="text-2xl font-black text-primary mt-2 font-mono">
                {vatCollected.toLocaleString()} ر.س
              </h4>
              <p className="text-[10px] text-slate-400 font-bold mt-2">مستحقة للدفع في الإقرار الضريبي القادم</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Real-time Order Approval / General Journal Routing */}
            <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-yellow-500" />
                  الطلبات المعلقة للترحيل المالي والفوترة
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  مراجعة الطلبات المدفوعة وإصدار الفاتورة الضريبية المبسطة ZATCA فورياً
                </p>
              </div>

              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary font-mono">#{order.id}</span>
                        <span className="text-[10px] bg-yellow-400/20 text-yellow-600 border border-yellow-400/30 px-2 py-0.5 rounded-full font-black">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-800 mt-1">{order.customerName || 'عميل المتجر'}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{order.createdAt}</p>
                    </div>

                    <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between">
                      <span className="font-mono font-black text-slate-800">{(order.total || 0).toFixed(2)} ر.س</span>
                      <button
                        onClick={() => approveOrderAndInvoice(order)}
                        className="bg-primary hover:bg-yellow-600 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-md shadow-primary/10"
                      >
                        ترحيل ومصادقة
                      </button>
                    </div>
                  </div>
                ))}

                {pendingOrders.length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-bold italic">
                    لا توجد طلبات معلقة بانتظار ترحيل المحاسبي حالياً. كافة العمليات منظمة ومرحلة!
                  </div>
                )}
              </div>
            </div>

            {/* ERP Sync System Controls */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl border border-white/5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-black text-sm uppercase tracking-wider">مزامنة Onyx Pro ERP</h4>
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-bold">
                  تكامل لحظي ثنائي الاتجاه لمزامنة سجلات العملاء، الفواتير الإلكترونية، والقيود اليومية المزدوجة مع نظام أونكس برو ERP.
                </p>
              </div>

              {/* Live simulator logs output */}
              <div className="bg-black/50 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-yellow-400/80 space-y-2 mt-4 max-h-40 overflow-y-auto">
                {syncLogs.map((log, index) => (
                  <p key={index} className="leading-normal">
                    {log}
                  </p>
                ))}
              </div>

              <button
                onClick={handleErpSync}
                disabled={isSyncing}
                className={`w-full py-3 mt-6 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
                  isSyncing
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-slate-900 hover:scale-[1.02]'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'جاري الاتصال والترحيل...' : 'بدء المزامنة اليدوية الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render subcomponents dynamically according to activeTab */}
      {activeTab === 'onyx_erp' && (
        <OnyxErpIntegrationView
          language={language}
          orders={orders}
          products={products}
          addToast={addToast}
        />
      )}

      {activeTab === 'zatca_invoices' && (
        <ZatcaInvoiceView language={language} invoices={invoices} orders={orders} addToast={addToast} />
      )}

      {activeTab === 'financial_reports' && (
        <FinancialReportsView language={language} orders={orders} invoices={invoices} addToast={addToast} />
      )}

      {activeTab === 'journal_ledgers' && (
        <JournalLedgerView language={language} invoices={invoices} addToast={addToast} />
      )}

      {activeTab === 'e_archiving' && <EArchivingView language={language} addToast={addToast} />}

      {activeTab === 'e_contracts' && <EContractsView language={language} addToast={addToast} />}
    </div>
  );
};

export default AccountingSection;
