
import { Invoice, Payment, VipClient, VipTransaction, Product } from '../../types';

/**
 * Delta Accounting Engine v27.0
 * محرك محاسبي سيادي يدعم القيد المزدوج، الجرد المستمر، وإدارة VAT.
 */

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference: string;
    lines: JournalLine[];
}

export interface JournalLine {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

export const CHART_OF_ACCOUNTS = {
    ASSETS: { id: '1000', name: 'الأصول المتداولة' },
    INVENTORY: { id: '1201', name: 'مخزون المنتجات الطازجة' },
    RECEIVABLES: { id: '1105', name: 'ذمم العملاء (VIP)' },
    CASH: { id: '1101', name: 'الصندوق / البنك العربي' },
    LIABILITIES: { id: '2000', name: 'الالتزامات' },
    VAT_OUT: { id: '2105', name: 'ضريبة القيمة المضافة (15%)' },
    EQUITY: { id: '3000', name: 'رأس مال شركة نجوم دلتا' },
    REVENUE: { id: '4000', name: 'إيرادات المبيعات' },
    COGS: { id: '5001', name: 'تكلفة البضاعة المباعة' },
    EXPENSES: { id: '6000', name: 'مصاريف التشغيل واللوجستيات' }
};

export class AccountingEngine {
    private journals: JournalEntry[] = [];

    constructor(initialJournals: JournalEntry[] = []) {
        this.journals = initialJournals;
    }

    recordSalesInvoice(invoice: Invoice, cogsAmount: number) {
        const entry: JournalEntry = {
            id: `JE-SLS-${invoice.id}`,
            date: invoice.date,
            description: `إثبات مبيعات فاتورة #${invoice.id} - ${invoice.customerName}`,
            reference: invoice.id,
            lines: [
                { 
                    accountId: CHART_OF_ACCOUNTS.RECEIVABLES.id, 
                    accountName: CHART_OF_ACCOUNTS.RECEIVABLES.name,
                    debit: invoice.total, 
                    credit: 0 
                },
                { 
                    accountId: CHART_OF_ACCOUNTS.REVENUE.id, 
                    accountName: CHART_OF_ACCOUNTS.REVENUE.name,
                    debit: 0, 
                    credit: invoice.subtotal 
                },
                { 
                    accountId: CHART_OF_ACCOUNTS.VAT_OUT.id, 
                    accountName: CHART_OF_ACCOUNTS.VAT_OUT.name,
                    debit: 0, 
                    credit: invoice.tax || (invoice.subtotal * 0.15) 
                },
                {
                    accountId: CHART_OF_ACCOUNTS.COGS.id,
                    accountName: CHART_OF_ACCOUNTS.COGS.name,
                    debit: cogsAmount,
                    credit: 0
                },
                {
                    accountId: CHART_OF_ACCOUNTS.INVENTORY.id,
                    accountName: CHART_OF_ACCOUNTS.INVENTORY.name,
                    debit: 0,
                    credit: cogsAmount
                }
            ]
        };
        this.journals.push(entry);
        return entry;
    }

    getTrialBalance() {
        const balances: { [key: string]: { name: string, debit: number, credit: number } } = {};
        this.journals.forEach(je => {
            je.lines.forEach(line => {
                if (!balances[line.accountId]) {
                    balances[line.accountId] = { name: line.accountName, debit: 0, credit: 0 };
                }
                balances[line.accountId].debit += line.debit;
                balances[line.accountId].credit += line.credit;
            });
        });
        return Object.entries(balances).map(([id, data]) => ({
            id,
            ...data,
            netBalance: data.debit - data.credit
        }));
    }

    getIncomeStatement() {
        const tb = this.getTrialBalance();
        const revenue = tb.filter(a => a.id.startsWith('4')).reduce((s, a) => s + (a.credit - a.debit), 0);
        const cogs = tb.filter(a => a.id === CHART_OF_ACCOUNTS.COGS.id).reduce((s, a) => s + (a.debit - a.credit), 0);
        const expenses = tb.filter(a => a.id.startsWith('6')).reduce((s, a) => s + (a.debit - a.credit), 0);
        return {
            revenue,
            cogs,
            grossProfit: revenue - cogs,
            expenses,
            netProfit: (revenue - cogs) - expenses
        };
    }

    recordCashback(userId: string, amount: number, description: string) {
        const entry: JournalEntry = {
            id: `JE-CBK-${Date.now()}`,
            date: new Date().toISOString(),
            description: `إثبات كاش باك للعميل #${userId}: ${description}`,
            reference: userId,
            lines: [
                {
                    accountId: CHART_OF_ACCOUNTS.EXPENSES.id,
                    accountName: CHART_OF_ACCOUNTS.EXPENSES.name,
                    debit: amount,
                    credit: 0
                },
                {
                    accountId: CHART_OF_ACCOUNTS.LIABILITIES.id,
                    accountName: CHART_OF_ACCOUNTS.LIABILITIES.name,
                    debit: 0,
                    credit: amount
                }
            ]
        };
        this.journals.push(entry);
        return entry;
    }
}
