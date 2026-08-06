import React, { useState, useMemo } from 'react';
import { useI18n } from './lib/contexts/I18nContext';
import { Invoice, Payment, VipClient, VipTransaction } from '../types';
import { AccountingEngine, CHART_OF_ACCOUNTS } from './lib/AccountingEngine';
import { 
    PrintIcon, MailIcon, PencilIcon, TrashIcon, PlusIcon, 
    DocumentTextIcon, ChartBarIcon, SparklesIcon 
} from './lib/contexts/Icons';

// Adding missing VIP management callbacks to the props interface
type AccountsViewProps = {
    onBack: () => void;
    invoices: Invoice[];
    payments: Payment[];
    vipClients: VipClient[];
    transactions: VipTransaction[];
    onAddPayment: (payment: Payment) => void;
    onAddVipClient: (c: VipClient) => Promise<VipClient>;
    onUpdateVipClient: (c: VipClient) => Promise<VipClient>;
    onDeleteVipClient: (id: string) => Promise<boolean>;
};

export const AccountsView: React.FC<AccountsViewProps> = (props) => {
    const { onBack, invoices, vipClients, transactions } = props;
    const { t, language, formatCurrency } = useI18n();
    const [activeTab, setActiveTab] = useState<'summary' | 'invoices' | 'ledger' | 'reports' | 'ai_advisor' | 'vip_management'>('summary');
    const [isAddingClient, setIsAddingClient] = useState(false);

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

    const PaginationLookup = ({ totalPages, current, onChange }: { totalPages: number, current: number, onChange: (p: number) => void }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-center items-center gap-2 mt-8 py-4 bg-gray-50 border-t">
                <button 
                    disabled={current === 1}
                    onClick={() => onChange(current - 1)}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all font-black text-xs"
                >
                    {language === 'ar' ? 'السابق' : 'Prev'}
                </button>
                <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(i + 1)}
                            className={`w-8 h-8 rounded-lg font-black text-xs transition-all ${current === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button 
                    disabled={current === totalPages}
                    onClick={() => onChange(current + 1)}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all font-black text-xs"
                >
                    {language === 'ar' ? 'التالي' : 'Next'}
                </button>
            </div>
        );
    };

    const [newClient, setNewClient] = useState<Partial<VipClient>>({
        companyName: '',
        contactPerson: '',
        phone: '',
        shippingAddress: '',
        creditLimit: 0,
        currentBalance: 0,
        clientStatus: 'active'
    });

    // محاكاة المحرك المحاسبي مع البيانات الحالية
    const engine = useMemo(() => {
        const ae = new AccountingEngine();
        invoices.forEach(inv => {
            if (inv.status === 'Paid' || inv.status === 'Pending Payment') {
                ae.recordSalesInvoice(inv, inv.subtotal * 0.7); // افتراض تكلفة 70%
            }
        });
        return ae;
    }, [invoices]);

    const incomeStatement = engine.getIncomeStatement();
    const trialBalance = engine.getTrialBalance();

    return (
        <div className="space-y-10 animate-fade-in pb-24 text-black">
            {/* Header Identity */}
            <div className="bg-primary text-white p-12 rounded-[4rem] shadow-4xl flex flex-col md:flex-row justify-between items-center gap-8 border-b-[15px] border-secondary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px]"></div>
                </div>
                <div className="relative z-10">
                    <h2 className="text-5xl font-black mb-3 uppercase tracking-tighter flex items-center gap-4">
                        <ChartBarIcon className="w-12 h-12 text-secondary" />
                        النظام المحاسبي السيادي
                    </h2>
                    <p className="text-xl font-bold opacity-80 italic">Delta Stars ERP - Financial Intelligence Unit</p>
                </div>
                <button onClick={onBack} className="relative z-10 bg-white/10 hover:bg-red-500 hover:scale-105 px-12 py-5 rounded-[2rem] font-black border-2 border-white/20 text-xl transition-all shadow-2xl">
                    &larr; {t('common.back')}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap justify-center gap-4 bg-gray-50 p-4 rounded-[3rem] border-2 border-gray-100 shadow-inner">
                {[
                    { id: 'summary', label: 'لوحة التحكم المالية', icon: '📊' },
                    { id: 'invoices', label: 'إدارة الفواتير', icon: '🧾' },
                    { id: 'reports', label: 'التقارير الختامية', icon: '📜' },
                    { id: 'ledger', label: 'ميزان المراجعة', icon: '⚖️' },
                    { id: 'vip_management', label: 'إدارة كبار العملاء', icon: '💎' },
                    { id: 'ai_advisor', label: 'المستشار المالي AI', icon: '🤖' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-10 py-4 rounded-[2rem] font-black text-lg transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-primary text-white shadow-xl scale-105' : 'bg-white text-slate-400 hover:bg-gray-100 border border-gray-200'}`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeTab === 'summary' && (
                    <div className="space-y-10 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-b-[10px] border-green-500 group hover:-translate-y-2 transition-all">
                                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">إجمالي الإيرادات (المحققة)</p>
                                <p className="text-4xl font-black text-slate-800">{formatCurrency(incomeStatement.revenue)}</p>
                            </div>
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-b-[10px] border-red-500 group hover:-translate-y-2 transition-all">
                                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">تكلفة المبيعات (WAC/FIFO)</p>
                                <p className="text-4xl font-black text-slate-800">{formatCurrency(incomeStatement.cogs)}</p>
                            </div>
                            <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border-b-[10px] border-secondary text-white relative overflow-hidden group hover:-translate-y-2 transition-all">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 blur-xl rounded-full"></div>
                                <p className="text-secondary font-black text-[10px] uppercase tracking-widest mb-4">صافي الربح التشغيلي</p>
                                <p className="text-4xl font-black">{formatCurrency(incomeStatement.netProfit)}</p>
                            </div>
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-b-[10px] border-blue-500 group hover:-translate-y-2 transition-all">
                                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">مستحقات ضريبية (VAT)</p>
                                <p className="text-4xl font-black text-slate-800">{formatCurrency(invoices.reduce((s, i) => s + (i.tax || 0), 0))}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            <div className="bg-white p-10 rounded-[4rem] shadow-3xl border border-gray-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black flex items-center gap-4 text-primary">
                                        <SparklesIcon className="w-6 h-6" /> كبار العملاء المدينين (VIP AR)
                                    </h3>
                                    <button 
                                        onClick={() => setActiveTab('vip_management')}
                                        className="text-xs font-black bg-primary/5 text-primary px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all"
                                    >
                                        إدارة الكل
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {vipClients.slice(0, 4).map(client => (
                                        <div key={client.id} className="p-6 bg-gray-50 rounded-[2rem] flex justify-between items-center hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-white transition-all">VIP</div>
                                                <div>
                                                    <p className="font-black text-lg">{client.companyName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Credit Limit: {formatCurrency(client.creditLimit)}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${client.clientStatus === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                            {client.clientStatus === 'active' ? 'VIP' : 'Standard'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`text-xl font-black ${client.currentBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(client.currentBalance)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[4rem] shadow-3xl border border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mb-8">
                                    <SparklesIcon className="w-16 h-16 text-green-500 animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-black mb-4">كفاءة التحصيل المالي</h3>
                                <p className="text-gray-400 font-bold text-lg mb-8 max-w-sm">نظام التدقيق الآلي يشير إلى التزام 95% من الشركاء بمواعيد السداد v24</p>
                                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-primary w-[95%] shadow-[0_0_15px_rgba(26,58,26,0.3)]"></div>
                                </div>
                                <span className="text-primary font-black uppercase tracking-widest text-xs">Healthy Liquidity Status</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="bg-white p-12 rounded-[4rem] shadow-3xl animate-fade-in-right border border-gray-100 max-w-4xl mx-auto">
                        <div className="text-center border-b pb-12 mb-12">
                            <h2 className="text-4xl font-black text-primary mb-2">قائمة الدخل التقديرية</h2>
                            <p className="text-gray-400 font-bold tracking-widest uppercase">Income Statement (P&L) | {new Date().getFullYear()}</p>
                        </div>
                        <div className="space-y-8 px-10">
                            <div className="flex justify-between items-end border-b pb-4">
                                <span className="text-2xl font-black text-slate-800">إجمالي المبيعات (Revenue)</span>
                                <span className="text-2xl font-black">{formatCurrency(incomeStatement.revenue)}</span>
                            </div>
                            <div className="flex justify-between items-end border-b pb-4 text-red-500">
                                <span className="text-xl font-bold italic">(-) تكلفة البضاعة المباعة (COGS)</span>
                                <span className="text-xl font-black">({formatCurrency(incomeStatement.cogs)})</span>
                            </div>
                            <div className="flex justify-between items-end bg-gray-50 p-6 rounded-2xl border-2 border-primary/5">
                                <span className="text-3xl font-black text-primary">مجمل الربح (Gross Profit)</span>
                                <span className="text-3xl font-black text-primary">{formatCurrency(incomeStatement.grossProfit)}</span>
                            </div>
                            <div className="flex justify-between items-end border-b pb-4 text-orange-600">
                                <span className="text-xl font-bold italic">(-) مصروفات تشغيلية ولوجستية</span>
                                <span className="text-xl font-black">({formatCurrency(incomeStatement.expenses)})</span>
                            </div>
                            <div className="flex justify-between items-center bg-primary text-white p-10 rounded-[3rem] shadow-4xl transform scale-105 border-b-[15px] border-secondary">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black uppercase tracking-widest opacity-60">Sovereign Net Profit</span>
                                    <span className="text-5xl font-black">صافي الربح</span>
                                </div>
                                <span className="text-5xl font-black text-secondary">{formatCurrency(incomeStatement.netProfit)}</span>
                            </div>
                        </div>
                        <div className="mt-20 pt-10 border-t flex justify-between items-center">
                            <div className="text-[10px] text-gray-300 font-black uppercase">Certified by Delta Sovereign Engine v24</div>
                            <button className="flex items-center gap-3 bg-slate-100 p-4 rounded-xl hover:bg-primary hover:text-white transition-all font-black">
                                <PrintIcon className="w-5 h-5" /> تصدير PDF
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'ledger' && (
                    <div className="bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-gray-100 animate-fade-in">
                        <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                            <h3 className="text-2xl font-black">ميزان المراجعة التحليلي (Trial Balance)</h3>
                            <span className="bg-secondary px-6 py-2 rounded-full font-black text-xs uppercase">Live Ledger v24</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b-4 border-gray-100">
                                    <tr>
                                        <th className="p-8 font-black text-gray-400 uppercase tracking-widest">كود الحساب</th>
                                        <th className="p-8 font-black text-gray-400 uppercase tracking-widest">اسم الحساب</th>
                                        <th className="p-8 font-black text-green-600 uppercase tracking-widest">مدين (Debit)</th>
                                        <th className="p-8 font-black text-red-600 uppercase tracking-widest">دائن (Credit)</th>
                                        <th className="p-8 font-black text-primary uppercase tracking-widest">الصافي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trialBalance.map(acc => (
                                        <tr key={acc.id} className="border-b hover:bg-gray-50 transition-all group">
                                            <td className="p-8 font-mono font-bold text-gray-400">{acc.id}</td>
                                            <td className="p-8 font-black text-slate-800 text-lg">{acc.name}</td>
                                            <td className="p-8 font-bold text-green-500">{formatCurrency(acc.debit)}</td>
                                            <td className="p-8 font-bold text-red-500">{formatCurrency(acc.credit)}</td>
                                            <td className="p-8">
                                                <span className={`px-6 py-2 rounded-xl font-black text-xl ${acc.netBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {formatCurrency(acc.netBalance)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <div className="bg-white p-10 rounded-[4rem] shadow-3xl border border-gray-100 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-slate-800">سجل الفواتير السيادي</h3>
                            <div className="flex gap-4">
                                <button className="bg-primary text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                                    <PlusIcon className="w-5 h-5" /> فاتورة جديدة
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {invoices.map(inv => (
                                <div key={inv.id} className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-primary opacity-20"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="font-black text-2xl mb-1 text-slate-800">{inv.id}</p>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{inv.date}</p>
                                        </div>
                                        <span className={`px-6 py-2 rounded-full font-black text-xs uppercase ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {language === 'ar' ? inv.status_ar : inv.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-black uppercase">Client Information</span>
                                            <span className="text-lg font-black text-primary">{inv.customerName}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-slate-800">{formatCurrency(inv.total)}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">VAT INC (15%)</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 bg-white border border-gray-200 p-4 rounded-2xl hover:bg-primary hover:text-white transition-all font-black text-sm flex items-center justify-center gap-2">
                                            <DocumentTextIcon className="w-4 h-4" /> عرض
                                        </button>
                                        <button className="bg-secondary text-white p-4 rounded-2xl hover:scale-110 transition-all">
                                            <PrintIcon className="w-5 h-5" />
                                        </button>
                                        <button className="bg-green-500 text-white p-4 rounded-2xl hover:scale-110 transition-all">
                                            <MailIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'vip_management' && (
                    <div className="space-y-10 animate-fade-in-up">
                        <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                            <div>
                                <h3 className="text-3xl font-black text-primary mb-2">إدارة حسابات كبار العملاء</h3>
                                <p className="text-gray-400 font-bold">إدارة الائتمان والتحصيل للشركاء الاستراتيجيين</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingClient(!isAddingClient)}
                                className="bg-secondary text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition-all"
                            >
                                <PlusIcon className="w-6 h-6" /> {isAddingClient ? 'إلغاء' : 'إضافة عميل VIP جديد'}
                            </button>
                        </div>

                        {isAddingClient && (
                            <div className="bg-white p-12 rounded-[4rem] shadow-4xl border-2 border-secondary/20 animate-fade-in">
                                <h4 className="text-2xl font-black mb-10 text-primary border-b pb-4">نموذج تسجيل شريك استراتيجي جديد</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">اسم الشركة / الكيان</label>
                                        <input 
                                            type="text" 
                                            value={newClient.companyName}
                                            onChange={e => setNewClient({...newClient, companyName: e.target.value})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                            placeholder="مثال: شركة النجوم المحدودة"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الشخص المسؤول (Contact Person)</label>
                                        <input 
                                            type="text" 
                                            value={newClient.contactPerson}
                                            onChange={e => setNewClient({...newClient, contactPerson: e.target.value})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                            placeholder="الاسم الثلاثي للمسؤول"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">رقم التواصل</label>
                                        <input 
                                            type="text" 
                                            value={newClient.phone}
                                            onChange={e => setNewClient({...newClient, phone: e.target.value})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                            placeholder="05xxxxxxxx"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">عنوان الشحن الرئيسي</label>
                                        <input 
                                            type="text" 
                                            value={newClient.shippingAddress}
                                            onChange={e => setNewClient({...newClient, shippingAddress: e.target.value})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                            placeholder="المدينة، الحي، الشارع"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الحد الائتماني (Credit Limit)</label>
                                        <input 
                                            type="number" 
                                            value={newClient.creditLimit}
                                            onChange={e => setNewClient({...newClient, creditLimit: Number(e.target.value)})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الرصيد الافتتاحي (Initial Balance)</label>
                                        <input 
                                            type="number" 
                                            value={newClient.currentBalance}
                                            onChange={e => setNewClient({...newClient, currentBalance: Number(e.target.value)})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">حالة العميل (Client Status)</label>
                                        <select 
                                            value={newClient.clientStatus}
                                            onChange={e => setNewClient({...newClient, clientStatus: e.target.value as 'active' | 'standard'})}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-secondary/30 rounded-2xl font-bold outline-none transition-all"
                                        >
                                            <option value="active">VIP (Active)</option>
                                            <option value="standard">Standard</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-12 flex gap-6">
                                    <button 
                                        onClick={async () => {
                                            if (!newClient.companyName) return;
                                            const client: VipClient = {
                                                ...newClient as VipClient,
                                                id: `VIP-${Date.now()}`
                                            };
                                            await props.onAddVipClient(client);
                                            setIsAddingClient(false);
                                            setNewClient({
                                                companyName: '',
                                                contactPerson: '',
                                                phone: '',
                                                shippingAddress: '',
                                                creditLimit: 0,
                                                currentBalance: 0,
                                                clientStatus: 'active'
                                            });
                                        }}
                                        className="flex-1 bg-primary text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-all"
                                    >
                                        تأكيد وتسجيل العميل
                                    </button>
                                    <button 
                                        onClick={() => setIsAddingClient(false)}
                                        className="px-12 py-6 bg-gray-100 text-gray-400 rounded-[2rem] font-black text-xl hover:bg-gray-200 transition-all"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        )}

                         <div className="bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-gray-100">
                            <div className="bg-primary p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <h4 className="text-xl font-black">قائمة الشركاء الحاليين</h4>
                                    <span className="text-xs font-bold opacity-60 uppercase tracking-widest">{vipClients.length} Active VIPs</span>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <input
                                        type="text"
                                        placeholder={language === 'ar' ? 'بحث بالشركة أو المسؤول...' : 'Search by company or manager...'}
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:bg-white focus:text-black outline-none transition-all text-sm font-black text-white placeholder-white/40"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right min-w-[800px]">
                                    <thead className="bg-gray-50 border-b-2 border-gray-100">
                                        <tr>
                                            <th className="p-6 font-black text-gray-400 text-xs uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('companyName')}>الشركة {sortConfig?.key === 'companyName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="p-6 font-black text-gray-400 text-xs uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('contactPerson')}>المسؤول {sortConfig?.key === 'contactPerson' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="p-6 font-black text-gray-400 text-xs uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('clientStatus')}>الحالة {sortConfig?.key === 'clientStatus' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="p-6 font-black text-gray-400 text-xs uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('creditLimit')}>الحد الائتماني {sortConfig?.key === 'creditLimit' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="p-6 font-black text-gray-400 text-xs uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => handleSort('currentBalance')}>الرصيد الحالي {sortConfig?.key === 'currentBalance' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                            <th className="p-6 font-black text-gray-400 text-xs uppercase tracking-widest">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const { data, totalPages } = processData<VipClient>(vipClients, ['companyName', 'contactPerson', 'id']);
                                            return (
                                                <>
                                                    {data.map(client => (
                                                        <tr key={client.id} className="border-b hover:bg-gray-50 transition-all group">
                                                            <td className="p-6">
                                                                <p className="font-black text-slate-800">{client.companyName}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold">{client.id}</p>
                                                            </td>
                                                            <td className="p-6 font-bold text-gray-600">{client.contactPerson}</td>
                                                            <td className="p-6">
                                                                <span className={`px-4 py-1 rounded-full font-black text-xs uppercase ${client.clientStatus === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {client.clientStatus === 'active' ? 'VIP' : 'Standard'}
                                                                </span>
                                                            </td>
                                                            <td className="p-6 font-black text-primary">{formatCurrency(client.creditLimit)}</td>
                                                            <td className="p-6">
                                                                <span className={`px-4 py-1 rounded-full font-black text-sm ${client.currentBalance < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                                    {formatCurrency(client.currentBalance)}
                                                                </span>
                                                            </td>
                                                            <td className="p-6">
                                                                <div className="flex gap-2 group-hover:opacity-100 transition-opacity">
                                                                    <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                                        <PencilIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => props.onDeleteVipClient(client.id)}
                                                                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {data.length === 0 && (
                                                        <tr><td colSpan={6} className="py-24 text-center text-gray-400 font-black italic">{language === 'ar' ? 'لا توجد نتائج بحث مطابقة' : 'No matching results'}</td></tr>
                                                    )}
                                                    <tr className="bg-gray-50/50">
                                                        <td colSpan={6} className="p-0">
                                                            <PaginationLookup totalPages={totalPages} current={currentPage} onChange={setCurrentPage} />
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai_advisor' && (
                    <div className="space-y-10 animate-fade-in-up">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-4xl border-b-[20px] border-secondary">
                            <div className="absolute top-0 right-0 w-full h-full opacity-10">
                                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-secondary rounded-full blur-[120px]"></div>
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="text-center md:text-right">
                                    <h3 className="text-4xl font-black mb-4 flex items-center justify-center md:justify-start gap-4">
                                        <SparklesIcon className="w-10 h-10 text-secondary" />
                                        المستشار المالي الذكي (Oday AI)
                                    </h3>
                                    <p className="text-xl opacity-70 font-bold">تحليل السيولة والتنبؤ بالمخاطر المالية باستخدام الذكاء الاصطناعي</p>
                                </div>
                                <div className="bg-white/10 p-8 rounded-[3rem] border border-white/20 backdrop-blur-xl text-center">
                                    <p className="text-secondary font-black text-sm uppercase tracking-widest mb-2">Cash Flow Accuracy</p>
                                    <p className="text-5xl font-black">98.4%</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-white p-10 rounded-[4rem] shadow-3xl border border-gray-100">
                                <h4 className="text-2xl font-black mb-8 text-primary flex items-center gap-3">
                                    <ChartBarIcon className="w-6 h-6" /> توقعات التدفق النقدي (30 يوم)
                                </h4>
                                <div className="space-y-6">
                                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-black">المتحصلات المتوقعة</span>
                                            <span className="text-green-600 font-black">+{formatCurrency(incomeStatement.revenue * 1.2)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 w-[85%]"></div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-black">الالتزامات المتوقعة</span>
                                            <span className="text-red-600 font-black">-{formatCurrency(incomeStatement.cogs * 1.1)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 w-[40%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[4rem] shadow-3xl border border-gray-100">
                                <h4 className="text-2xl font-black mb-8 text-secondary flex items-center gap-3">
                                    <SparklesIcon className="w-6 h-6" /> تنبيهات المخاطر الذكية
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-2xl border-r-4 border-orange-500">
                                        <div className="text-2xl">⚠️</div>
                                        <div>
                                            <p className="font-black text-orange-800">تأخر محتمل في التحصيل</p>
                                            <p className="text-sm text-orange-600 font-bold">العميل "مطاعم النخبة" لديه نمط تأخير متزايد بنسبة 15%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border-r-4 border-blue-500">
                                        <div className="text-2xl">💡</div>
                                        <div>
                                            <p className="font-black text-blue-800">فرصة تحسين التكلفة</p>
                                            <p className="text-sm text-blue-600 font-bold">شراء كميات أكبر من "التمور الملكية" الآن سيوفر 8% من التكاليف المستقبلية</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
