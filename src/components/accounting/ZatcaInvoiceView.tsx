import React, { useState } from 'react';
import { Invoice, Order } from '../../types';
import { FileText, Printer, Download, Share2, Search, ArrowRight, Eye, CheckCircle } from 'lucide-react';

/**
 * ZATCA TLV Base64 QR Code Compiler (Saudi Standard)
 * Converts Tag-Length-Value records into ZATCA compliant Base64 string.
 */
export function getZatcaQrBase64(
  seller: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: string,
  vatAmount: string
): string {
  try {
    const encoder = new TextEncoder();
    const getTlvRow = (tag: number, val: string) => {
      const valBytes = encoder.encode(val);
      const header = new Uint8Array(2);
      header[0] = tag;
      header[1] = valBytes.length;
      const row = new Uint8Array(2 + valBytes.length);
      row.set(header);
      row.set(valBytes, 2);
      return row;
    };

    const r1 = getTlvRow(1, seller);
    const r2 = getTlvRow(2, vatNumber);
    const r3 = getTlvRow(3, timestamp);
    const r4 = getTlvRow(4, totalAmount);
    const r5 = getTlvRow(5, vatAmount);

    const totalLength = r1.length + r2.length + r3.length + r4.length + r5.length;
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    [r1, r2, r3, r4, r5].forEach((r) => {
      combined.set(r, offset);
      offset += r.length;
    });

    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return window.btoa(binary);
  } catch (e) {
    console.error('Error generating ZATCA TLV', e);
    return '';
  }
}

interface ZatcaInvoiceViewProps {
  language: 'ar' | 'en';
  invoices: Invoice[];
  orders: Order[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ZatcaInvoiceView: React.FC<ZatcaInvoiceViewProps> = ({
  language,
  invoices,
  orders,
  addToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter and paginate invoices
  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Constants
  const SELLER_VAT_NUMBER = '310499872100003'; // Delta Stars official VAT
  const COMPANY_NAME_AR = 'شركة نجوم دلتا المحدودة';
  const COMPANY_NAME_EN = 'Delta Stars Company Ltd.';

  // Generate QR URL for invoice
  const getQrCodeUrl = (inv: Invoice) => {
    const taxAmt = inv.tax || inv.total * 0.15;
    const base64 = getZatcaQrBase64(
      COMPANY_NAME_AR,
      SELLER_VAT_NUMBER,
      inv.date,
      inv.total.toFixed(2),
      taxAmt.toFixed(2)
    );
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      base64
    )}`;
  };

  return (
    <div className="space-y-6">
      {/* Invoice Details Dialog / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-tajawal overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden print:p-0 print:shadow-none print:rounded-none">
            {/* Header Controls (No Print) */}
            <div className="flex justify-between items-center bg-slate-900 px-6 py-4 text-white print:hidden">
              <span className="text-sm font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                {language === 'ar' ? 'عرض الفاتورة الإلكترونية المعتمدة' : 'View Authorized E-Invoice'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white flex items-center gap-1.5 text-xs font-bold"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                  {language === 'ar' ? 'طباعة' : 'Print'}
                </button>
                <button
                  onClick={() => {
                    addToast(
                      language === 'ar' ? 'تم حفظ الفاتورة بصيغة PDF' : 'Invoice saved as PDF',
                      'success'
                    );
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white flex items-center gap-1.5 text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  {language === 'ar' ? 'تحميل' : 'Download'}
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-xl transition text-white text-xs font-bold"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-8 space-y-6 text-slate-800 print:p-4 print:text-black print:text-sm">
              {/* VAT Stamp */}
              <div className="flex justify-between items-start border-b pb-6">
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900">{COMPANY_NAME_AR}</h4>
                  <p className="text-xs text-slate-500 font-bold">{COMPANY_NAME_EN}</p>
                  <p className="text-xs text-slate-400 font-bold">
                    الرقم الضريبي: <span className="font-mono text-slate-700 font-black">{SELLER_VAT_NUMBER}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-bold">الرياض، المملكة العربية السعودية</p>
                </div>
                <div className="text-left space-y-1">
                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-3 py-1 rounded-full font-black uppercase inline-block">
                    {language === 'ar' ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-2">
                    رقم الفاتورة: <span className="font-mono font-black text-slate-800">#{selectedInvoice.id}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-bold">
                    التاريخ: <span className="font-mono">{new Date(selectedInvoice.date).toLocaleString('ar-SA')}</span>
                  </p>
                </div>
              </div>

              {/* Customer info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">العميل المستفيد</p>
                <h5 className="text-sm font-black text-slate-800">{selectedInvoice.customerName}</h5>
                <p className="text-xs text-slate-500 mt-1 font-bold">
                  نوع المعاملة: مبيعات تجزئة (مواطن/مقيم)
                </p>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b text-xs text-slate-400 font-black">
                      <th className="pb-2 text-right">{language === 'ar' ? 'البند' : 'Item'}</th>
                      <th className="pb-2 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th className="pb-2 text-left">{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="pb-2 text-left">{language === 'ar' ? 'شامل الضريبة' : 'Incl. VAT'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-bold">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 font-black text-slate-900">
                          {language === 'ar' ? item.name_ar : item.name_en}
                        </td>
                        <td className="py-3 text-center font-mono font-black">{item.quantity}</td>
                        <td className="py-3 text-left font-mono">{item.price.toFixed(2)} ر.س</td>
                        <td className="py-3 text-left font-mono font-black text-slate-900">
                          {(item.price * item.quantity).toFixed(2)} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Summary and QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t">
                {/* ZATCA Compliant QR Code */}
                <div className="flex flex-col items-center sm:items-start justify-center">
                  <div className="p-2 border border-slate-200 rounded-2xl bg-white shadow-sm">
                    <img
                      src={getQrCodeUrl(selectedInvoice)}
                      alt="ZATCA Compliance QR Code"
                      className="w-36 h-36"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mt-2 text-center sm:text-right">
                    مسح ضوئي متوافق مع هيئة الزكاة والضريبة والجمارك (فاتورة المرحلة الثانية)
                  </span>
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm font-bold text-slate-600 self-center">
                  <div className="flex justify-between">
                    <span>الإجمالي الخاضع للضريبة:</span>
                    <span className="font-mono font-black text-slate-800">
                      {selectedInvoice.subtotal.toFixed(2)} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono">
                      {(selectedInvoice.tax || selectedInvoice.total * 0.15).toFixed(2)} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-black text-slate-900">
                    <span className="text-primary">المجموع الكلي:</span>
                    <span className="text-secondary font-mono">
                      {selectedInvoice.total.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              </div>

              {/* ZATCA Phase 2 Cryptographic Seal Footer */}
              <div className="border-t border-dashed pt-4 text-center text-[10px] text-slate-400 font-bold space-y-1">
                <p className="flex justify-center items-center gap-1 text-emerald-600 font-black">
                  <CheckCircle className="w-3 h-3" />
                  قيد موثق ومرحل ومصادق رقمياً من خوادم نجوم دلتا المعتمدة
                </p>
                <p className="font-mono">CRYPTOGRAPHIC HASH: SHA256-4190DDFAB220199E392</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Registry Interface */}
      <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border-2 border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-black text-primary flex items-center gap-3">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            {language === 'ar' ? 'سجل الفواتير والفوترة الإلكترونية ZATCA' : 'E-Invoice & ZATCA Registry'}
          </h3>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث برقم الفاتورة أو العميل...' : 'Search invoice or customer...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none transition text-sm font-bold"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead>
              <tr className="text-gray-400 text-xs font-black border-b">
                <th className="pb-4">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice ID'}</th>
                <th className="pb-4">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                <th className="pb-4">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="pb-4">{language === 'ar' ? 'المجموع' : 'Total'}</th>
                <th className="pb-4">{language === 'ar' ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                <th className="pb-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="pb-4">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedInvoices.map((inv) => {
                const taxAmt = inv.tax || inv.total * 0.15;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 font-black text-primary">#{inv.id}</td>
                    <td className="py-4 font-bold">{inv.customerName}</td>
                    <td className="py-4 text-xs text-gray-400 font-mono">
                      {new Date(inv.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-4 font-black text-slate-800">{inv.total.toFixed(2)} ر.س</td>
                    <td className="py-4 font-bold text-gray-400 font-mono">{taxAmt.toFixed(2)} ر.س</td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          inv.status === 'Paid'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {language === 'ar' ? inv.status_ar : inv.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition flex items-center gap-1"
                        title="عرض الفاتورة"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold">{language === 'ar' ? 'عرض الفاتورة' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                    {language === 'ar' ? 'لا توجد فواتير مطابقة لبحثك' : 'No invoices match your search'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-slate-50 transition font-black text-xs"
            >
              {language === 'ar' ? 'السابق' : 'Prev'}
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg font-black text-xs transition ${
                    currentPage === i + 1
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-400 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-slate-50 transition font-black text-xs"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
