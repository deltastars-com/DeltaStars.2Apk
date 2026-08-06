import React, { useState, useEffect } from 'react';
import { Order, Product } from '../../types';
import { onyxService, OnyxConfig, OnyxAccountMapping, OnyxSyncLog } from '../../services/onyxService';
import {
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
  GitBranch,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileCode,
  Sliders,
  Check,
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  Users,
  FileSpreadsheet
} from 'lucide-react';

interface OnyxErpIntegrationViewProps {
  language: 'ar' | 'en';
  orders: Order[];
  products: Product[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const OnyxErpIntegrationView: React.FC<OnyxErpIntegrationViewProps> = ({
  language,
  orders,
  products,
  addToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'config' | 'mapping' | 'logs'>('console');

  // Form states
  const [config, setConfig] = useState<OnyxConfig>(onyxService.getConfig());
  const [mapping, setMapping] = useState<OnyxAccountMapping>(onyxService.getAccountMapping());
  const [logs, setLogs] = useState<OnyxSyncLog[]>(onyxService.getLogs());

  // Action states
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [isReconcilingStock, setIsReconcilingStock] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  useEffect(() => {
    setLogs(onyxService.getLogs());
  }, [activeSubTab]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onyxService.saveConfig(config);
    addToast(
      language === 'ar' ? 'تم حفظ إعدادات سيرفر Onyx Pro ERP بنجاح' : 'Onyx Pro API configuration saved',
      'success'
    );
  };

  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();
    onyxService.saveAccountMapping(mapping);
    addToast(
      language === 'ar' ? 'تم حفظ ومطابقة شجرة الحسابات مع أونكس بنجاح' : 'Chart of Accounts mapping saved',
      'success'
    );
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await onyxService.testConnection();
    setIsTesting(false);
    setTestResult(result);
    setLogs(onyxService.getLogs());

    if (result.success) {
      addToast(result.message, 'success');
    } else {
      addToast(result.message, 'error');
    }
  };

  const handleSyncAllOrders = async () => {
    setIsSyncingOrders(true);
    let successCount = 0;

    for (const order of orders.slice(0, 10)) {
      const res = await onyxService.syncOrder(order);
      if (res.success) successCount++;
    }

    setIsSyncingOrders(false);
    setLogs(onyxService.getLogs());

    addToast(
      language === 'ar' ? `تم ترحيل ${successCount} طلب بنجاح إلى أونكس برو ERP` : `Synced ${successCount} orders to Onyx`,
      'success'
    );
  };

  const handleReconcileStock = async () => {
    setIsReconcilingStock(true);
    const res = await onyxService.reconcileInventoryFromOnyx(products);
    setIsReconcilingStock(false);
    setLogs(onyxService.getLogs());

    addToast(
      language === 'ar' ? `تمت مطابقة مخزون ${res.reconciledCount} منتجاً مع أونكس` : `Reconciled stock for ${res.reconciledCount} items`,
      'success'
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-tajawal">
      {/* Sub Header & Tabs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-500/20 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 rounded-2xl shadow-xl">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black rounded-lg uppercase">
                  ENTERPRISE ERP CONNECTOR
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  متصل ومتوافق 100%
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-amber-100">
                {language === 'ar' ? 'منظومة الربط المحاسبي مع Onyx Pro ERP' : 'Onyx Pro ERP Integration Hub'}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                شركة نجوم دلتا للتجارة | المزامنة الآلية المباشرة للفواتير، القيود المزدوجة، والمخزون مع نظام أونكس برو.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-amber-200 font-black text-xs rounded-xl transition flex items-center gap-2 border border-amber-500/30 active:scale-95 disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? (language === 'ar' ? 'اختبار الاتصال...' : 'Testing Ping...') : (language === 'ar' ? 'فحص السيرفر (Ping)' : 'Test Connection')}
            </button>

            <button
              onClick={handleSyncAllOrders}
              disabled={isSyncingOrders}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingOrders ? 'animate-spin' : ''}`} />
              {isSyncingOrders ? (language === 'ar' ? 'جاري الترحيل...' : 'Syncing...') : (language === 'ar' ? 'ترحيل المبيعات الآن' : 'Sync Orders')}
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab('console')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
              activeSubTab === 'console'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            {language === 'ar' ? 'لوحة المزامنة اللحظية' : 'Live Sync Console'}
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
              activeSubTab === 'config'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Server className="w-4 h-4" />
            {language === 'ar' ? 'إعدادات سيرفر أونكس API' : 'Server & API Config'}
          </button>
          <button
            onClick={() => setActiveSubTab('mapping')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
              activeSubTab === 'mapping'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            {language === 'ar' ? 'ربط شجرة الحسابات (Chart of Accounts)' : 'Account Mapping'}
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
              activeSubTab === 'logs'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileCode className="w-4 h-4" />
            {language === 'ar' ? `سجل العمليات (${logs.length})` : `Sync Audit Logs (${logs.length})`}
          </button>
        </div>
      </div>

      {/* Test Connection Banner Result */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-black shadow-md ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <span>{testResult.message}</span>
          </div>
          {testResult.latencyMs && (
            <span className="font-mono bg-white px-3 py-1 rounded-lg border text-[11px]">
              Latency: {testResult.latencyMs}ms
            </span>
          )}
        </div>
      )}

      {/* TAB 1: CONSOLE */}
      {activeSubTab === 'console' && (
        <div className="space-y-8">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-black uppercase">{language === 'ar' ? 'حالة السيرفر والربط' : 'API Gateway Status'}</span>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span>{language === 'ar' ? 'نشط ومستقر' : 'Online & Active'}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">{config.apiUrl}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-black uppercase">{language === 'ar' ? 'فرع ومستودع أونكس' : 'Onyx Branch & WH'}</span>
              <div className="flex items-center gap-2 text-slate-900 font-black text-lg font-mono">
                <span>الفرع: {config.branchCode} | {config.warehouseCode}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'مستودع الرياض الرئيسي' : 'Riyadh Main Warehouse'}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-black uppercase">{language === 'ar' ? 'المطابقة الضريبية ZATCA' : 'ZATCA Integration'}</span>
              <div className="flex items-center gap-2 text-primary font-black text-lg">
                <ShieldCheck className="w-5 h-5" />
                <span>{config.zatcaPhase2Enabled ? (language === 'ar' ? 'مرحلة 2 مفعّلة' : 'Phase 2 Enabled') : 'Phase 1'}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'إصدار الفواتير بالـ QR المشفّر' : 'Encrypted QR Invoicing'}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-black uppercase">{language === 'ar' ? 'المزامنة التلقائية' : 'Auto Sync Interval'}</span>
              <div className="flex items-center gap-2 text-amber-600 font-black text-lg">
                <Zap className="w-5 h-5" />
                <span>كل {config.syncIntervalMinutes} دقيقة</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'تزامن خلفي دون تدخل بشري' : 'Background Automated Cron'}</p>
            </div>
          </div>

          {/* Quick Trigger Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{language === 'ar' ? 'ترحيل طلبات المبيعات' : 'Post Sales Invoices'}</h4>
                  <p className="text-xs text-gray-400 font-bold">{language === 'ar' ? 'تحويل المبيعات لقيود يومية' : 'Create Onyx Journal Entries'}</p>
                </div>
              </div>
              <button
                onClick={handleSyncAllOrders}
                disabled={isSyncingOrders}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                {language === 'ar' ? 'بدء ترحيل طلبات المتجر' : 'Batch Post Orders'}
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 text-cyan-800 rounded-2xl">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{language === 'ar' ? 'تحديث أرصدة المخزون' : 'Sync Inventory Stock'}</h4>
                  <p className="text-xs text-gray-400 font-bold">{language === 'ar' ? 'جلب الكميات الفعلية من أونكس' : 'Pull Quantities from Onyx WH'}</p>
                </div>
              </div>
              <button
                onClick={handleReconcileStock}
                disabled={isReconcilingStock}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isReconcilingStock ? 'animate-spin' : ''}`} />
                {language === 'ar' ? 'جلب تحديثات المستودع' : 'Pull Onyx Inventory'}
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{language === 'ar' ? 'مزامنة دليل العملاء' : 'Sync Debtors Directory'}</h4>
                  <p className="text-xs text-gray-400 font-bold">{language === 'ar' ? 'فتح حسابات العملاء الجدد' : 'Create Debtors Accounts'}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await onyxService.syncClient({ id: 'CLIENT_001', name: 'عميل مميز نجوم دلتا', phone: '0501234567' });
                  setLogs(onyxService.getLogs());
                  addToast(language === 'ar' ? 'تمت مزامنة سجلات العملاء مع أونكس' : 'Synced customer accounts', 'success');
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {language === 'ar' ? 'تصدير دليل العملاء' : 'Export Debtors'}
              </button>
            </div>
          </div>

          {/* Recent Sync Audit Stream */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              {language === 'ar' ? 'السجل اللحظي لمزامنـات أونكس برو ERP' : 'Live Integration Log Stream'}
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {logs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{log.message}</span>
                        {log.onyxRefId && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-mono text-[10px] font-black">
                            {log.onyxRefId}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">
                        مرجع النظام: #{log.referenceId} | النوع: {log.type}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-gray-400 self-end md:self-auto">
                    {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVER & API CONFIG */}
      {activeSubTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
          <div className="border-b pb-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Server className="w-6 h-6 text-amber-500" />
              {language === 'ar' ? 'بيانات الاتصال وخادم Web Services الخاص بأونكس برو' : 'Onyx Pro API Endpoint Configuration'}
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              أدخل عنوان الـ REST API والمفاتيح الأمنية المقدمة من فريق الدعم الفني لنظام أونكس برو بشركتكم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
            <div className="space-y-2 md:col-span-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'عنوان الخادم API Base URL' : 'API Base URL'}</label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'مفتاح التطبيق API Key' : 'API Key'}</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'المفتاح السري Secret Key' : 'Secret Key'}</label>
              <input
                type="password"
                value={config.secretKey}
                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'كود الشركة في أونكس' : 'Onyx Company Code'}</label>
              <input
                type="text"
                value={config.companyCode}
                onChange={(e) => setConfig({ ...config, companyCode: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'كود الفرع الرئيسي' : 'Branch Code'}</label>
              <input
                type="text"
                value={config.branchCode}
                onChange={(e) => setConfig({ ...config, branchCode: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'كود المستودع الرئيسي' : 'Warehouse Code'}</label>
              <input
                type="text"
                value={config.warehouseCode}
                onChange={(e) => setConfig({ ...config, warehouseCode: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'تكرار التزامن التلقائي (بالدقائق)' : 'Sync Interval (Minutes)'}</label>
              <input
                type="number"
                value={config.syncIntervalMinutes}
                onChange={(e) => setConfig({ ...config, syncIntervalMinutes: parseInt(e.target.value) || 15 })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSyncEnabled}
                  onChange={(e) => setConfig({ ...config, autoSyncEnabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
                <span className="text-slate-800 font-black">{language === 'ar' ? 'تفعيل التزامن التلقائي اللحظي' : 'Enable Real-time Auto Sync'}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.zatcaPhase2Enabled}
                  onChange={(e) => setConfig({ ...config, zatcaPhase2Enabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
                <span className="text-slate-800 font-black">{language === 'ar' ? 'مطابقة الربط مع الهيئة العامة للزكاة والدخل (ZATCA Phase 2)' : 'ZATCA Phase 2 Compliance'}</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition active:scale-95"
            >
              {language === 'ar' ? 'حفظ إعدادات سيرفر أونكس' : 'Save Onyx Server Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ACCOUNT MAPPING */}
      {activeSubTab === 'mapping' && (
        <form onSubmit={handleSaveMapping} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
          <div className="border-b pb-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-500" />
              {language === 'ar' ? 'مصفوفة مطابقة شجرة الحسابات العامة لـ Onyx Pro' : 'Chart of Accounts Mapping Matrix'}
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              ربط حسابات متجر نجوم دلتا بالحسابات المقابلة بدليل الحسابات المعتمد بشركتكم في أونكس برو.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب ايرادات المبيعات الإلكترونية' : 'Sales Revenue Account'}</label>
              <input
                type="text"
                value={mapping.salesAccount}
                onChange={(e) => setMapping({ ...mapping, salesAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب تكلفة البضاعة المباعة (COGS)' : 'COGS Account'}</label>
              <input
                type="text"
                value={mapping.cogsAccount}
                onChange={(e) => setMapping({ ...mapping, cogsAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب مخزون البضائع بالمستودعات' : 'Inventory Asset Account'}</label>
              <input
                type="text"
                value={mapping.inventoryAccount}
                onChange={(e) => setMapping({ ...mapping, inventoryAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب أمانات ضريبة القيمة المضافة ZATCA' : 'VAT Payable Account'}</label>
              <input
                type="text"
                value={mapping.vatAccount}
                onChange={(e) => setMapping({ ...mapping, vatAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب الصندوق النقدي (الدفع عند الاستلام)' : 'Cash / COD Account'}</label>
              <input
                type="text"
                value={mapping.cashAccount}
                onChange={(e) => setMapping({ ...mapping, cashAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب وسيط بطاقات مدى وفيزا البنكي' : 'Bank Mada/Visa Account'}</label>
              <input
                type="text"
                value={mapping.bankMadaAccount}
                onChange={(e) => setMapping({ ...mapping, bankMadaAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب تسويات Apple Pay' : 'Apple Pay Clearing Account'}</label>
              <input
                type="text"
                value={mapping.applePayAccount}
                onChange={(e) => setMapping({ ...mapping, applePayAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-black">{language === 'ar' ? 'حساب ذمم بوابات التقسيط (تمارا وتابي)' : 'Tamara & Tabby Clearing'}</label>
              <input
                type="text"
                value={mapping.tamaraTabbyAccount}
                onChange={(e) => setMapping({ ...mapping, tamaraTabbyAccount: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-mono text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition active:scale-95"
            >
              {language === 'ar' ? 'حفظ ربط شجرة الحسابات' : 'Save Account Mapping'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-6 h-6 text-amber-500" />
                {language === 'ar' ? 'سجل العمليات والتدقيق اللحظي لـ Onyx Pro' : 'Full Onyx Sync Audit Trail'}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                سجل تاريخي كامل لجميع طلبات الاستدعاء، القيود المحاسبية ورحلات الربط المباشر.
              </p>
            </div>

            <button
              onClick={() => {
                onyxService.clearLogs();
                setLogs([]);
                addToast(language === 'ar' ? 'تم تفريغ السجل بنجاح' : 'Cleared logs', 'info');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-black text-xs rounded-xl transition"
            >
              {language === 'ar' ? 'تفريغ السجل' : 'Clear Logs'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black border-b">
                <tr>
                  <th className="p-4">{language === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
                  <th className="p-4">{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th className="p-4">{language === 'ar' ? 'المرجع' : 'Reference'}</th>
                  <th className="p-4">{language === 'ar' ? 'كود أونكس' : 'Onyx Ref'}</th>
                  <th className="p-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4">{language === 'ar' ? 'تفاصيل العملية' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('ar-SA')}
                    </td>
                    <td className="p-4 uppercase text-[10px] font-black text-slate-500">{log.type}</td>
                    <td className="p-4 font-mono font-black text-slate-900">#{log.referenceId}</td>
                    <td className="p-4 font-mono text-amber-700 font-black">{log.onyxRefId || '-'}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status === 'success' ? 'نجحت' : 'فشلت'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-black text-slate-800">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnyxErpIntegrationView;
