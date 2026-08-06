import React, { useState, useEffect, useMemo } from 'react';
import { CHART_OF_ACCOUNTS, JournalEntry, JournalLine } from '../lib/AccountingEngine';
import { BookOpen, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface JournalLedgerViewProps {
  language: 'ar' | 'en';
  invoices: any[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const LOCAL_STORAGE_KEY = 'delta_journal_entries_v2';

export const JournalLedgerView: React.FC<JournalLedgerViewProps> = ({
  language,
  invoices,
  addToast,
}) => {
  // Local state for journals list
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [subTab, setSubTab] = useState<'voucher' | 'registry' | 'ledger' | 'trial'>(
    'voucher'
  );

  // New Entry Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [lines, setLines] = useState<Omit<JournalLine, 'accountName'>[]>([
    { accountId: '1101', debit: 0, credit: 0 }, // Cash as default
    { accountId: '4000', debit: 0, credit: 0 }, // Sales Revenue as default
  ]);

  // Ledger Filter Account State
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1101');

  // Load initial journals or fetch from storage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setJournals(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored journals', e);
      }
    } else {
      // Seed initial journals using invoices
      const initial: JournalEntry[] = [];
      invoices.forEach((inv, index) => {
        const subtotal = inv.subtotal || inv.total / 1.15;
        const tax = inv.tax || inv.total - subtotal;
        const cogs = subtotal * 0.7; // Estimate COGS as 70%

        initial.push({
          id: `JE-SLS-${inv.id}`,
          date: inv.date,
          description: `إثبات مبيعات فاتورة #${inv.id} - ${inv.customerName}`,
          reference: inv.id,
          lines: [
            {
              accountId: '1105', // Receivables (VIP / Clients)
              accountName: 'ذمم العملاء (VIP)',
              debit: inv.total,
              credit: 0,
            },
            {
              accountId: '4000', // Sales Revenue
              accountName: 'إيرادات المبيعات',
              debit: 0,
              credit: subtotal,
            },
            {
              accountId: '2105', // VAT Output
              accountName: 'ضريبة القيمة المضافة (15%)',
              debit: 0,
              credit: tax,
            },
            {
              accountId: '5001', // COGS
              accountName: 'تكلفة البضاعة المباعة',
              debit: cogs,
              credit: 0,
            },
            {
              accountId: '1201', // Inventory
              accountName: 'مخزون المنتجات الطازجة',
              debit: 0,
              credit: cogs,
            },
          ],
        });
      });

      // Also add some base capital equity journal
      initial.unshift({
        id: 'JE-CAP-001',
        date: '2026-01-01',
        description: 'إيداع رأس مال التأسيس لشركة نجوم دلتا',
        reference: 'FOUND-RESL',
        lines: [
          {
            accountId: '1101', // Cash
            accountName: 'الصندوق / البنك العربي',
            debit: 500000,
            credit: 0,
          },
          {
            accountId: '3000', // Equity Capital
            accountName: 'رأس مال شركة نجوم دلتا',
            debit: 0,
            credit: 500000,
          },
        ],
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      setJournals(initial);
    }
  }, [invoices]);

  // Save journals helper
  const saveJournals = (updated: JournalEntry[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setJournals(updated);
  };

  // Double Entry Totals Calculations
  const debitSum = useMemo(() => lines.reduce((s, l) => s + (Number(l.debit) || 0), 0), [lines]);
  const creditSum = useMemo(() => lines.reduce((s, l) => s + (Number(l.credit) || 0), 0), [lines]);
  const isBalanced = debitSum === creditSum && debitSum > 0;

  // Account name helper from CHART_OF_ACCOUNTS
  const getAccountName = (id: string): string => {
    const found = Object.values(CHART_OF_ACCOUNTS).find((acc) => acc.id === id);
    return found ? found.name : 'حساب مخصص';
  };

  // Add line to Form
  const addLine = () => {
    setLines([...lines, { accountId: '6000', debit: 0, credit: 0 }]);
  };

  // Remove line from Form
  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Handle Form Input Changes
  const handleLineChange = (
    index: number,
    field: 'accountId' | 'debit' | 'credit',
    value: any
  ) => {
    const updated = [...lines];
    if (field === 'debit') {
      updated[index].debit = Number(value) || 0;
      if (updated[index].debit > 0) updated[index].credit = 0; // Double entry constraint
    } else if (field === 'credit') {
      updated[index].credit = Number(value) || 0;
      if (updated[index].credit > 0) updated[index].debit = 0;
    } else {
      updated[index].accountId = value;
    }
    setLines(updated);
  };

  // Post Journal Voucher
  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      addToast(
        language === 'ar' ? 'القيد غير متوازن! يجب تساوي الجانب المدين والداين' : 'Journal is unbalanced!',
        'error'
      );
      return;
    }
    if (!entryDesc.trim()) {
      addToast(
        language === 'ar' ? 'الرجاء إدخال شرح أو وصف القيد' : 'Please insert a description',
        'error'
      );
      return;
    }

    const newEntry: JournalEntry = {
      id: `JE-GEN-${Date.now()}`,
      date: entryDate,
      description: entryDesc,
      reference: entryRef || 'INTERNAL',
      lines: lines.map((l) => ({
        ...l,
        accountName: getAccountName(l.accountId),
      })),
    };

    const updated = [newEntry, ...journals];
    saveJournals(updated);

    // Reset Form
    setEntryDesc('');
    setEntryRef('');
    setLines([
      { accountId: '1101', debit: 0, credit: 0 },
      { accountId: '4000', debit: 0, credit: 0 },
    ]);

    addToast(
      language === 'ar' ? 'تم ترحيل قيد اليومية بنجاح إلى دفتر الأستاذ' : 'Journal entry posted successfully!',
      'success'
    );
  };

  // --- Dynamic General Ledger Calculations ---
  const ledgerTransactions = useMemo(() => {
    const txs: { date: string; desc: string; ref: string; debit: number; credit: number; balance: number }[] = [];
    let runningBalance = 0;

    // Accounts increase/decrease rule
    const isAssetOrExpense =
      selectedLedgerAccount.startsWith('1') || selectedLedgerAccount.startsWith('5') || selectedLedgerAccount.startsWith('6');

    // Sort chronologically
    const sortedJournals = [...journals].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedJournals.forEach((je) => {
      je.lines.forEach((line) => {
        if (line.accountId === selectedLedgerAccount) {
          const debit = line.debit || 0;
          const credit = line.credit || 0;

          if (isAssetOrExpense) {
            runningBalance += debit - credit;
          } else {
            runningBalance += credit - debit;
          }

          txs.push({
            date: je.date,
            desc: je.description,
            ref: je.reference,
            debit,
            credit,
            balance: runningBalance,
          });
        }
      });
    });

    return { transactions: txs.reverse(), finalBalance: runningBalance };
  }, [journals, selectedLedgerAccount]);

  // --- Trial Balance Calculations ---
  const trialBalance = useMemo(() => {
    const balances: Record<string, { name: string; debit: number; credit: number }> = {};

    // Initialize all accounts from chart
    Object.values(CHART_OF_ACCOUNTS).forEach((acc) => {
      balances[acc.id] = { name: acc.name, debit: 0, credit: 0 };
    });

    journals.forEach((je) => {
      je.lines.forEach((line) => {
        if (!balances[line.accountId]) {
          balances[line.accountId] = { name: line.accountName, debit: 0, credit: 0 };
        }
        balances[line.accountId].debit += line.debit || 0;
        balances[line.accountId].credit += line.credit || 0;
      });
    });

    let totalDebits = 0;
    let totalCredits = 0;

    const rows = Object.entries(balances).map(([id, data]) => {
      totalDebits += data.debit;
      totalCredits += data.credit;
      const isAssetOrExpense = id.startsWith('1') || id.startsWith('5') || id.startsWith('6');
      const netBalance = isAssetOrExpense ? data.debit - data.credit : data.credit - data.debit;

      return {
        id,
        name: data.name,
        debit: data.debit,
        credit: data.credit,
        netBalance,
        type: isAssetOrExpense ? 'debit' : 'credit',
      };
    });

    return { rows, totalDebits, totalCredits };
  }, [journals]);

  return (
    <div className="space-y-8 font-tajawal animate-fade-in">
      {/* Sub Tabs Controls */}
      <div className="flex border-b pb-1 gap-4 overflow-x-auto">
        <button
          onClick={() => setSubTab('voucher')}
          className={`pb-3 font-black text-sm transition relative whitespace-nowrap ${
            subTab === 'voucher' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'ar' ? 'إنشاء قيد محاسبي جديد' : 'New Journal Entry'}
          {subTab === 'voucher' && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSubTab('registry')}
          className={`pb-3 font-black text-sm transition relative whitespace-nowrap ${
            subTab === 'registry' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'ar' ? 'سجل قيود اليومية' : 'Journal Voucher Logs'}
          {subTab === 'registry' && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSubTab('ledger')}
          className={`pb-3 font-black text-sm transition relative whitespace-nowrap ${
            subTab === 'ledger' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'ar' ? 'دفتر الأستاذ العام' : 'General Ledger'}
          {subTab === 'ledger' && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSubTab('trial')}
          className={`pb-3 font-black text-sm transition relative whitespace-nowrap ${
            subTab === 'trial' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'}
          {subTab === 'trial' && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full" />
          )}
        </button>
      </div>

      {/* VIEW: Voucher creation */}
      {subTab === 'voucher' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voucher Entry Form */}
          <form
            onSubmit={handlePostJournal}
            className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 border-b pb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h4 className="text-lg font-black text-slate-800">
                {language === 'ar' ? 'سند قيد اليومية العامة' : 'General Journal Voucher'}
              </h4>
            </div>

            {/* Date, description, reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">التاريخ</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl font-bold font-mono outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">المرجع / السند</label>
                <input
                  type="text"
                  placeholder="مثال: SLS-1029 أو INV-RECPT"
                  value={entryRef}
                  onChange={(e) => setEntryRef(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl font-bold outline-none focus:border-primary text-sm"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-400 font-bold">شرح القيد المحاسبي</label>
                <input
                  type="text"
                  placeholder="اكتب شرحاً تفصيلياً للقيد..."
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl font-bold outline-none focus:border-primary text-sm"
                  required
                />
              </div>
            </div>

            {/* Ledger Line entries */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-black text-slate-700">{language === 'ar' ? 'تفاصيل الحسابات' : 'Account Details'}</p>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 text-xs font-black text-primary hover:text-yellow-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة سطر حساب
                </button>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {/* Account selection */}
                    <div className="sm:col-span-6">
                      <select
                        value={line.accountId}
                        onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                        className="w-full bg-white px-3 py-1.5 border rounded-xl text-xs font-bold outline-none focus:border-primary"
                      >
                        {Object.values(CHART_OF_ACCOUNTS).map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            [{acc.id}] - {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Debit entry */}
                    <div className="sm:col-span-2.5">
                      <input
                        type="number"
                        placeholder="مدين"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                        className="w-full text-left font-mono px-3 py-1.5 border rounded-xl text-xs font-bold bg-white focus:border-emerald-500"
                      />
                    </div>

                    {/* Credit entry */}
                    <div className="sm:col-span-2.5">
                      <input
                        type="number"
                        placeholder="دائن"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                        className="w-full text-left font-mono px-3 py-1.5 border rounded-xl text-xs font-bold bg-white focus:border-red-500"
                      />
                    </div>

                    {/* Trash icon */}
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        disabled={lines.length <= 2}
                        onClick={() => removeLine(idx)}
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Voucher balancing banner */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-900 text-white rounded-2xl gap-4">
              <div className="flex gap-6 text-sm font-black font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">إجمالي المدين</span>
                  <span className="text-emerald-400">{debitSum.toFixed(2)} ر.س</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">إجمالي الدائن</span>
                  <span className="text-red-400">{creditSum.toFixed(2)} ر.س</span>
                </div>
              </div>

              {isBalanced ? (
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  القيد متوازن
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  غير متوازن (الفرق: {Math.abs(debitSum - creditSum).toFixed(2)})
                </div>
              )}

              <button
                type="submit"
                disabled={!isBalanced}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition shadow-lg ${
                  isBalanced
                    ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-600 hover:scale-105'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                رحّل القيد المحاسبي
              </button>
            </div>
          </form>

          {/* Quick Info Box / Audit Guidance */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl text-white space-y-4 shadow-xl border border-white/5">
            <h5 className="text-sm font-black text-yellow-400 uppercase tracking-wider">
              مبادئ القيد المزدوج والرقابة
            </h5>
            <p className="text-xs text-white/70 leading-relaxed font-bold">
              تلتزم شركة نجوم دلتا بمعايير الهيئة السعودية للمحاسبين القانونيين (SOCPA).
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white/5 p-3 rounded-2xl text-xs space-y-1">
                <span className="font-black text-white">الأصول والمصاريف:</span>
                <span className="text-emerald-400 block font-mono">المدين يزيدها (+) الدائن ينقصها (-)</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl text-xs space-y-1">
                <span className="font-black text-white">الالتزامات، الملكية والإيرادات:</span>
                <span className="text-red-400 block font-mono">الدائن يزيدها (+) المدين ينقصها (-)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span>LEDGER COMPLIANCE SOCPA</span>
              <span>v2.4</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Logs / Registry */}
      {subTab === 'registry' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm space-y-6">
          <h4 className="text-lg font-black text-slate-800">دفتر قيود اليومية العامة المسجلة</h4>
          <div className="space-y-3">
            {journals.map((je) => (
              <div key={je.id} className="border rounded-2xl overflow-hidden hover:border-primary transition">
                <div className="bg-slate-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b">
                  <div>
                    <span className="font-mono text-xs font-black text-primary">{je.id}</span>
                    <h5 className="text-sm font-black text-slate-800 mt-1">{je.description}</h5>
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-slate-400">
                    <span>المرجع: <span className="text-slate-800 font-mono">{je.reference}</span></span>
                    <span>التاريخ: <span className="text-slate-800 font-mono">{je.date}</span></span>
                  </div>
                </div>

                <div className="p-4">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-slate-400 font-black border-b pb-2">
                        <th className="pb-2">رقم الحساب</th>
                        <th className="pb-2">اسم الحساب في الدفتر</th>
                        <th className="pb-2 text-left">مدين (Debit)</th>
                        <th className="pb-2 text-left">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-bold text-slate-700">
                      {je.lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-400">[{l.accountId}]</td>
                          <td className="py-2.5 text-slate-800">{l.accountName}</td>
                          <td className={`py-2.5 text-left font-mono ${l.debit > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                            {l.debit > 0 ? l.debit.toFixed(2) + ' ر.س' : '-'}
                          </td>
                          <td className={`py-2.5 text-left font-mono ${l.credit > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                            {l.credit > 0 ? l.credit.toFixed(2) + ' ر.س' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {journals.length === 0 && (
              <p className="text-center py-12 text-gray-400 font-bold italic">لا توجد قيود مسجلة</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW: General Ledger */}
      {subTab === 'ledger' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
            <div>
              <h4 className="text-lg font-black text-slate-800">كشف الأستاذ العام وتفاصيل الحركات</h4>
              <p className="text-xs text-slate-400 font-bold mt-1">تصفية تفصيلية للحساب والتحقق من العمليات</p>
            </div>
            {/* Account selection filter */}
            <div className="w-full sm:w-80">
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="w-full bg-slate-50 px-4 py-2 border rounded-xl text-sm font-black outline-none focus:border-primary text-slate-700"
              >
                {Object.values(CHART_OF_ACCOUNTS).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    [{acc.id}] - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-1 flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-black uppercase">الرصيد الختامي الحالي</span>
              <h5 className="text-3xl font-black text-primary mt-2">
                {ledgerTransactions.finalBalance.toLocaleString()} ر.س
              </h5>
              <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed">
                نوع الحساب الأساسي:{' '}
                {selectedLedgerAccount.startsWith('1') || selectedLedgerAccount.startsWith('5') || selectedLedgerAccount.startsWith('6')
                  ? 'مدين بطبيعته (الأصول والمصروفات)'
                  : 'دائن بطبيعته (الالتزامات وحقوق الملكية والإيرادات)'}
              </p>
            </div>

            <div className="md:col-span-2 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400 font-black border-b pb-3">
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3">البيان / الحركة</th>
                    <th className="pb-3">المرجع</th>
                    <th className="pb-3 text-left">الجانب المدين</th>
                    <th className="pb-3 text-left">الجانب الدائن</th>
                    <th className="pb-3 text-left">الرصيد المتراكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-bold text-slate-700">
                  {ledgerTransactions.transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-slate-400">{tx.date}</td>
                      <td className="py-3 text-slate-800">{tx.desc}</td>
                      <td className="py-3 font-mono text-slate-400">{tx.ref}</td>
                      <td className="py-3 text-left font-mono text-emerald-600">
                        {tx.debit > 0 ? tx.debit.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 text-left font-mono text-red-500">
                        {tx.credit > 0 ? tx.credit.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 text-left font-mono text-slate-800">{tx.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                  {ledgerTransactions.transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 font-bold italic">
                        لا توجد حركات مسجلة لهذا الحساب
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Trial Balance */}
      {subTab === 'trial' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h4 className="text-lg font-black text-slate-800">ميزان المراجعة بالأرصدة</h4>
              <p className="text-xs text-slate-400 font-bold mt-1">التحقق المالي الشامل وتطابق المدين مع الدائن</p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 text-emerald-600 border border-emerald-100 text-xs px-4 py-2 rounded-full font-black">
              <CheckCircle2 className="w-4 h-4" />
              ميزان المراجعة متطابق
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 font-black border-b pb-3">
                  <th className="pb-3">رمز الحساب</th>
                  <th className="pb-3">اسم الحساب</th>
                  <th className="pb-3 text-left">مجموع مدين</th>
                  <th className="pb-3 text-left">مجموع دائن</th>
                  <th className="pb-3 text-left">الرصيد المدين النهائي</th>
                  <th className="pb-3 text-left">الرصيد الدائن النهائي</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-700">
                {trialBalance.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono text-slate-400">[{row.id}]</td>
                    <td className="py-3 text-slate-800 font-black">{row.name}</td>
                    <td className="py-3 text-left font-mono text-slate-400">{row.debit.toFixed(2)}</td>
                    <td className="py-3 text-left font-mono text-slate-400">{row.credit.toFixed(2)}</td>
                    <td className="py-3 text-left font-mono text-emerald-600 font-black">
                      {row.type === 'debit' ? row.netBalance.toFixed(2) + ' ر.س' : '-'}
                    </td>
                    <td className="py-3 text-left font-mono text-red-500 font-black">
                      {row.type === 'credit' ? row.netBalance.toFixed(2) + ' ر.س' : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white font-black text-sm border-t-2">
                  <td colSpan={2} className="py-4 px-4 font-black">الإجمالي الكلي لميزان المراجعة</td>
                  <td className="py-4 text-left font-mono text-emerald-400">
                    {trialBalance.totalDebits.toFixed(2)} ر.س
                  </td>
                  <td className="py-4 text-left font-mono text-red-400">
                    {trialBalance.totalCredits.toFixed(2)} ر.س
                  </td>
                  <td colSpan={2} className="py-4 text-left font-black text-yellow-400">
                    {trialBalance.totalDebits === trialBalance.totalCredits ? 'متطابق (OK)' : 'غير متطابق'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
