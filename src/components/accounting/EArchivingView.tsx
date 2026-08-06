import React, { useState, useEffect } from 'react';
import { Archive, FolderOpen, Search, Plus, Trash2, Download, Eye, FileText, UploadCloud, ShieldCheck, HelpCircle } from 'lucide-react';

interface ArchivedDocument {
  id: string;
  name: string;
  category: 'invoice' | 'contract' | 'receipt' | 'tax' | 'other';
  date: string;
  size: string;
  status: 'Verified' | 'Pending Audit' | 'Archived';
  url?: string;
}

interface EArchivingViewProps {
  language: 'ar' | 'en';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const STORAGE_KEY = 'delta_archived_documents_v2';

export const EArchivingView: React.FC<EArchivingViewProps> = ({ language, addToast }) => {
  const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Scanning Simulation States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  // Initial Seed
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing documents', e);
      }
    } else {
      const initial: ArchivedDocument[] = [
        {
          id: 'DOC-2026-001',
          name: 'فاتورة توريد خضروات طازجة مزارع الخرج يونيو',
          category: 'invoice',
          date: '2026-06-30',
          size: '1.2 MB',
          status: 'Verified',
        },
        {
          id: 'DOC-2026-002',
          name: 'عقد توريد ثمار الفاكهة المستوردة - شركة الغذاء الدولي',
          category: 'contract',
          date: '2026-07-02',
          size: '2.4 MB',
          status: 'Verified',
        },
        {
          id: 'DOC-2026-003',
          name: 'الإقرار الضريبي لشركة نجوم دلتا الربع الثاني 2026',
          category: 'tax',
          date: '2026-07-10',
          size: '850 KB',
          status: 'Pending Audit',
        },
        {
          id: 'DOC-2026-004',
          name: 'سند تحصيل كبار الموردين - الدفعة الاستباقية للتمور',
          category: 'receipt',
          date: '2026-07-08',
          size: '410 KB',
          status: 'Archived',
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      setDocuments(initial);
    }
  }, []);

  const saveDocs = (updated: ArchivedDocument[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDocuments(updated);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Process Simulated Upload
  const processSimulatedUpload = (fileName: string, categoryType: ArchivedDocument['category']) => {
    setIsUploading(true);
    setUploadProgress(0);
    setScanStep('جاري قراءة الملف وتحليل الامتدادات...');

    // Progress interval
    const interval = setInterval(() => {
      setUploadProgress((old) => {
        if (old >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = old + 12;
        if (next > 40 && next < 70) {
          setScanStep('جاري الفحص الأمني للوثيقة من الفيروسات والتهديدات (SafeScan)...');
        } else if (next >= 70 && next < 100) {
          setScanStep('جاري استخراج البيانات الوصفية (Metadata) والربط المالي مع أونيكس برو...');
        }
        return next;
      });
    }, 300);

    // Complete upload simulation after 3 seconds
    setTimeout(() => {
      setIsUploading(false);
      setScanStep('');
      setUploadProgress(0);

      const sizeRandom = (Math.random() * 2 + 0.1).toFixed(1);
      const newDoc: ArchivedDocument = {
        id: `DOC-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
        name: fileName.split('.')[0],
        category: categoryType,
        date: new Date().toISOString().split('T')[0],
        size: `${sizeRandom} MB`,
        status: 'Verified',
      };

      const updated = [newDoc, ...documents];
      saveDocs(updated);
      addToast(
        language === 'ar' ? 'تم أرشفة وتوثيق المستند الجديد بنجاح!' : 'Document archived successfully!',
        'success'
      );
    }, 3200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processSimulatedUpload(file.name, 'invoice');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processSimulatedUpload(file.name, 'invoice');
    }
  };

  const handleDelete = (id: string) => {
    const updated = documents.filter((doc) => doc.id !== id);
    saveDocs(updated);
    addToast(
      language === 'ar' ? 'تم حذف المستند من الأرشيف الرقمي' : 'Document deleted from archive',
      'info'
    );
  };

  // Filter and search logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 font-tajawal animate-fade-in">
      {/* Upload Drag & Drop Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <Archive className="w-6 h-6 text-primary" />
            <h4 className="text-lg font-black text-slate-800">
              {language === 'ar' ? 'أرشفة وتوثيق ملفات جديدة' : 'Upload & Archive New Documents'}
            </h4>
          </div>

          {/* Upload Drop Zone */}
          {!isUploading ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-4 border-dashed rounded-3xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                dragActive ? 'border-primary bg-primary/5 scale-95' : 'border-slate-200 hover:border-primary/50'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.csv,.docx,.png,.jpg"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-4">
                <div className="p-4 bg-slate-50 rounded-full inline-block text-primary">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700">
                    {language === 'ar' ? 'اسحب الملف وأفلته هنا أو اضغط للتصفح' : 'Drag and drop files here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    يدعم PDF, Excel, Word, الصور (أقصى حجم 15MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            /* Uploading Scanner simulator view */
            <div className="border-2 border-dashed rounded-3xl p-8 bg-slate-900 text-white space-y-6 flex flex-col items-center justify-center overflow-hidden relative">
              {/* Green futuristic radar effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent animate-pulse pointer-events-none" />
              <div className="w-16 h-16 rounded-full border-4 border-t-emerald-500 border-r-emerald-500/20 border-b-emerald-500/20 border-l-emerald-500/20 animate-spin" />

              <div className="text-center space-y-2 relative z-10 w-full max-w-md">
                <h5 className="text-sm font-black text-emerald-400 uppercase tracking-widest">
                  {scanStep}
                </h5>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 font-mono font-bold">
                  SECURITY PROTOCOL SCANNING ({uploadProgress}%)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Categories statistics card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl text-white space-y-4 shadow-xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <h5 className="text-sm font-black text-yellow-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              أمن وموثوقية الأرشفة الرقمية
            </h5>
            <p className="text-xs text-white/70 leading-relaxed font-bold">
              جميع الفواتير والمستندات يتم أرشفتاها في خوادم مشفرة بنظام SHA-256 وربطها بذكاء مع القيود المحاسبية.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div className="bg-white/5 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-bold">فواتير موردين</span>
              <span className="text-lg font-mono font-black text-white">
                {documents.filter((d) => d.category === 'invoice').length}
              </span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-bold">اتفاقيات وعقود</span>
              <span className="text-lg font-mono font-black text-white">
                {documents.filter((d) => d.category === 'contract').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual File Explorer */}
      <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border-2 border-gray-100 shadow-sm space-y-6">
        {/* Header and filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <div>
              <h4 className="text-lg md:text-xl font-black text-slate-800">مستودع الوثائق والمستندات العام</h4>
              <p className="text-xs text-slate-400 font-bold mt-1">تصفح، فلتر، وابحث في كافة الأوراق المؤرشفة</p>
            </div>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['all', 'invoice', 'contract', 'receipt', 'tax', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' && (language === 'ar' ? 'الكل' : 'All')}
                {cat === 'invoice' && (language === 'ar' ? 'فواتير' : 'Invoices')}
                {cat === 'contract' && (language === 'ar' ? 'عقود' : 'Contracts')}
                {cat === 'receipt' && (language === 'ar' ? 'سندات' : 'Receipts')}
                {cat === 'tax' && (language === 'ar' ? 'إقرارات ضريبية' : 'Tax')}
                {cat === 'other' && (language === 'ar' ? 'أخرى' : 'Other')}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input bar */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder={language === 'ar' ? 'ابحث في الملفات باسم المستند أو رمزه...' : 'Search archived files...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none transition text-sm font-bold"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        {/* Documents list table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-right min-w-[800px]">
            <thead>
              <tr className="text-gray-400 text-xs font-black border-b pb-4">
                <th className="pb-4">{language === 'ar' ? 'رمز المستند' : 'Doc ID'}</th>
                <th className="pb-4">{language === 'ar' ? 'اسم الملف' : 'Document Name'}</th>
                <th className="pb-4">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                <th className="pb-4">{language === 'ar' ? 'تاريخ الأرشفة' : 'Archived Date'}</th>
                <th className="pb-4">{language === 'ar' ? 'الحجم' : 'File Size'}</th>
                <th className="pb-4">{language === 'ar' ? 'الحالة الأرشيفية' : 'Status'}</th>
                <th className="pb-4">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold text-slate-700">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 font-mono text-xs text-slate-400">#{doc.id}</td>
                  <td className="py-4 text-slate-900 font-black flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {doc.name}
                  </td>
                  <td className="py-4 text-xs font-black text-primary">
                    {doc.category === 'invoice' && 'فاتورة شراء/بيع'}
                    {doc.category === 'contract' && 'اتفاقية تعاون'}
                    {doc.category === 'receipt' && 'سند مالي'}
                    {doc.category === 'tax' && 'إقرار ضريبي'}
                    {doc.category === 'other' && 'ملف إداري'}
                  </td>
                  <td className="py-4 text-xs text-gray-400 font-mono">{doc.date}</td>
                  <td className="py-4 text-xs font-mono text-gray-400">{doc.size}</td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        doc.status === 'Verified'
                          ? 'bg-green-100 text-green-600'
                          : doc.status === 'Pending Audit'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.status === 'Verified' && 'موثق تكنولوجياً'}
                      {doc.status === 'Pending Audit' && 'تحت التدقيق'}
                      {doc.status === 'Archived' && 'مؤرشف نهائي'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          addToast(
                            language === 'ar' ? 'جاري تحميل الملف المؤرشف...' : 'Downloading file...',
                            'success'
                          );
                        }}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition"
                        title="تحميل"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-bold italic">
                    لا توجد ملفات مطابقة لبحثك في الأرشيف الرقمي
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
