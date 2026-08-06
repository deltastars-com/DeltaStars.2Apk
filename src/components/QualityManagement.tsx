import React, { useState, useMemo, useEffect } from 'react';
import { useFirebase, useI18n, useToast } from './lib/contexts';
import { SearchIcon, FilterIcon, StarIcon } from './lib/contexts/Icons';

interface QualityCheck {
  id: string;
  productId: string;
  itemName: string;
  score: number;
  status: 'ممتاز' | 'جيد جداً' | 'مقبول' | 'مرفوض';
  date: string;
  inspector: string;
  temp: number; // Refrigerated temperature checks
  humidity: number; // Refrigerated humidity checks
  origin: string;
  notes: string;
  batchNo: string;
}

export default function QualityManagement() {
  const { language } = useI18n();
  const { products } = useFirebase();
  const { addToast } = useToast();

  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);

  // New Check form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [score, setScore] = useState(9.0);
  const [inspector, setInspector] = useState('م. أحمد العتيبي');
  const [temp, setTemp] = useState(4); // target temperature for fresh produce is 4C
  const [humidity, setHumidity] = useState(85); // typical 85% RH
  const [origin, setOrigin] = useState('مزارع القصيم الوطنية');
  const [notes, setNotes] = useState('تم التحقق من سلسلة التبريد وسلامة العبوات من أي تلف.');
  const [batchNo, setBatchNo] = useState(() => `BATCH-${Math.floor(100000 + Math.random() * 900000)}`);

  // Load from LocalStorage or default fallback
  useEffect(() => {
    const saved = localStorage.getItem('delta_stars_quality_checks');
    if (saved) {
      try {
        setChecks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultChecks: QualityCheck[] = [
        { id: 'QC-98421', productId: '', itemName: 'طماطم بلدي فاخر', score: 9.6, status: 'ممتاز', date: '2026-07-12', inspector: 'م. أحمد العتيبي', temp: 4, humidity: 88, origin: 'مزارع الخرج', notes: 'حالة الطماطم ممتازة وصلابة جيدة وخالية من أي عيوب.', batchNo: 'BATCH-482910' },
        { id: 'QC-98422', productId: '', itemName: 'خيار صوبة وطني', score: 8.8, status: 'جيد جداً', date: '2026-07-11', inspector: 'م. علي الغامدي', temp: 5, humidity: 85, origin: 'مزارع حائل', notes: 'الخيار طازج ومقرمش، التعبئة سليمة ومطابقة للمواصفات.', batchNo: 'BATCH-882319' },
        { id: 'QC-98423', productId: '', itemName: 'برتقال أبو صرة مستورد', score: 6.8, status: 'مقبول', date: '2026-07-10', inspector: 'م. سارة الحربي', temp: 3, humidity: 90, origin: 'مصر', notes: 'بعض الحبات بها تفاوت بسيط في الحجم ولكن جودتها ممتازة للعصير.', batchNo: 'BATCH-110293' },
      ];
      setChecks(defaultChecks);
      localStorage.setItem('delta_stars_quality_checks', JSON.stringify(defaultChecks));
    }
  }, []);

  const saveToStorage = (updatedList: QualityCheck[]) => {
    setChecks(updatedList);
    localStorage.setItem('delta_stars_quality_checks', JSON.stringify(updatedList));
  };

  // Derived Statistics
  const stats = useMemo(() => {
    if (checks.length === 0) return { avg: 0, rejectRate: 0, count: 0, uniqueOrigins: 0 };
    const sum = checks.reduce((acc, c) => acc + c.score, 0);
    const avg = parseFloat((sum / checks.length).toFixed(1));
    const rejections = checks.filter(c => c.status === 'مرفوض').length;
    const rejectRate = parseFloat(((rejections / checks.length) * 100).toFixed(1));
    const uniqueOrigins = new Set(checks.map(c => c.origin).filter(Boolean)).size;
    return { avg, rejectRate, count: checks.length, uniqueOrigins };
  }, [checks]);

  const filteredChecks = useMemo(() => {
    return checks.filter(check => {
      const matchSearch = check.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          check.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          check.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          check.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || check.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [checks, searchTerm, statusFilter]);

  const handleCreateCheck = (e: React.FormEvent) => {
    e.preventDefault();

    let name = customItemName;
    if (selectedProductId) {
      const p = products.find(prod => String(prod.id) === String(selectedProductId));
      if (p) {
        name = language === 'ar' ? p.name_ar : (p.name_en || p.name_ar);
      }
    }

    if (!name) {
      addToast(
        language === 'ar' ? 'يرجى اختيار منتج أو كتابة اسمه' : 'Please select a product or enter its name',
        'error'
      );
      return;
    }

    let calculatedStatus: 'ممتاز' | 'جيد جداً' | 'مقبول' | 'مرفوض' = 'مرفوض';
    if (score >= 9.0) calculatedStatus = 'ممتاز';
    else if (score >= 8.0) calculatedStatus = 'جيد جداً';
    else if (score >= 6.0) calculatedStatus = 'مقبول';

    const newCheck: QualityCheck = {
      id: `QC-${Math.floor(10000 + Math.random() * 90000)}`,
      productId: selectedProductId,
      itemName: name,
      score,
      status: calculatedStatus,
      date: new Date().toISOString().split('T')[0],
      inspector,
      temp,
      humidity,
      origin,
      notes,
      batchNo
    };

    const updated = [newCheck, ...checks];
    saveToStorage(updated);
    setIsModalOpen(false);
    
    // Reset Form
    setSelectedProductId('');
    setCustomItemName('');
    setScore(9.0);
    setNotes('تم التحقق من سلسلة التبريد وسلامة العبوات من أي تلف.');
    setBatchNo(`BATCH-${Math.floor(100000 + Math.random() * 900000)}`);

    addToast(
      language === 'ar' ? 'تم تسجيل فحص جودة جديد بنجاح ✅' : 'New quality check registered successfully ✅',
      'success'
    );
  };

  const handleDeleteCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا التقرير؟' : 'Are you sure you want to delete this report?')) {
      const updated = checks.filter(c => c.id !== id);
      saveToStorage(updated);
      addToast(
        language === 'ar' ? 'تم حذف التقرير' : 'Report deleted',
        'info'
      );
    }
  };

  const handlePrintCertificate = (check: QualityCheck) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
      <head>
        <title>شهادة مطابقة الجودة - ${check.itemName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
          body {
            font-family: 'Tajawal', sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            color: #1e293b;
            background: #fff;
          }
          .certificate-box {
            border: 10px double #15803d;
            padding: 40px;
            border-radius: 20px;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #15803d;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #166534;
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: 900;
          }
          .header p {
            margin: 5px 0;
            font-weight: bold;
            color: #64748b;
          }
          .title {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            color: #15803d;
            margin: 30px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .detail-item {
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 8px;
          }
          .detail-item strong {
            color: #0f172a;
          }
          .score-badge {
            display: inline-block;
            background: #f0fdf4;
            border: 2px solid #16a34a;
            color: #166534;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: 900;
            margin: 20px 0;
          }
          .notes-box {
            background: #f8fafc;
            border-right: 5px solid #15803d;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
            font-style: italic;
          }
          .footer-sign {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .stamp {
            border: 3px dashed #16a34a;
            color: #16a34a;
            padding: 10px 20px;
            transform: rotate(-5deg);
            font-weight: 900;
            border-radius: 10px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="certificate-box">
          <div class="header">
            <h1>شركة نجوم دلتا للتجارة • DELTA STARS CO.</h1>
            <p>إدارة الجودة وسلامة الأغذية وسلسلة التبريد المعتمدة</p>
          </div>
          
          <div class="title">شهادة فحص ومطابقة الجودة الفنية</div>
          
          <p style="text-align: center; font-size: 16px; line-height: 1.6;">
            تشهد إدارة الرقابة الفنية بمشروع <strong>نجوم دلتا</strong> بأنه تم فحص الشحنة المذكورة أدناه بموجب معايير الجودة السعودية وثبت مطابقتها لجميع المواصفات المبردة والقياسية.
          </p>

          <div style="text-align: center;">
            <div class="score-badge">التقييم الفني: ${check.score} / 10 (${check.status})</div>
          </div>

          <div class="details-grid">
            <div class="detail-item"><strong>رقم تقرير الفحص:</strong> ${check.id}</div>
            <div class="detail-item"><strong>رقم التشغيلة (Batch):</strong> ${check.batchNo}</div>
            <div class="detail-item"><strong>اسم المنتج الغذائي:</strong> ${check.itemName}</div>
            <div class="detail-item"><strong>تاريخ الفحص والمطابقة:</strong> ${check.date}</div>
            <div class="detail-item"><strong>مصدر ومورد الشحنة:</strong> ${check.origin}</div>
            <div class="detail-item"><strong>اسم المفتش المسؤول:</strong> ${check.inspector}</div>
            <div class="detail-item"><strong>درجة الحرارة المستلمة:</strong> ${check.temp} °C</div>
            <div class="detail-item"><strong>نسبة الرطوبة المحيطة:</strong> ${check.humidity} %</div>
          </div>

          <div class="notes-box">
            <strong>ملاحظات الفحص والتحليل المخبري السريع:</strong><br/>
            ${check.notes}
          </div>

          <div class="footer-sign">
            <div>
              <p>توقيع مفتش الجودة</p>
              <p style="font-weight: bold; margin-top: 20px;">${check.inspector}</p>
            </div>
            <div class="stamp">
              نجوم دلتا مبردة<br/>APPROVED QUALITY
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-tajawal text-right" dir="rtl">
      {/* Upper bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-green-900 flex items-center gap-2">
            <span className="p-2 bg-green-100 text-green-800 rounded-2xl">🛡️</span>
            {language === 'ar' ? 'إدارة الجودة وسلسلة التبريد الفعالة' : 'Quality Control & Cold Chain'}
          </h3>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {language === 'ar' ? 'فحص المنتجات المستلمة ومطابقتها للمقاييس العالية لنجوم دلتا' : 'Verify incoming produce and track refrigeration metrics'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-700 text-white px-6 py-3 rounded-2xl font-black hover:bg-green-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-700/20 flex items-center gap-2"
        >
          <span>+ تسجيل فحص مخبري وسريع</span>
        </button>
      </div>

      {/* Analytics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-400 font-black uppercase tracking-wider mb-1">متوسط درجة الجودة</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-green-700">{stats.avg} / 10</p>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-bold">آمن وممتاز</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-400 font-black uppercase tracking-wider mb-1">معدل رفض الشحنات</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-red-500">{stats.rejectRate}%</p>
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold">مستبعدة فورا</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-400 font-black uppercase tracking-wider mb-1">إجمالي الفحوصات المسجلة</p>
          <p className="text-3xl font-black text-blue-600">{stats.count}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-400 font-black uppercase tracking-wider mb-1">المصادر والمزارع المعتمدة</p>
          <p className="text-3xl font-black text-emerald-600">{stats.uniqueOrigins}</p>
        </div>
      </div>

      {/* Filter and Search Container */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={language === 'ar' ? 'بحث عن فحص بالمنتج، المفتش أو المصدر...' : 'Search quality checks...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <FilterIcon className="text-gray-400 w-5 h-5" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">{language === 'ar' ? 'كل حالات الجودة' : 'All Quality Status'}</option>
            <option value="ممتاز">{language === 'ar' ? 'ممتاز (9+)' : 'Excellent'}</option>
            <option value="جيد جداً">{language === 'ar' ? 'جيد جداً (8+)' : 'Very Good'}</option>
            <option value="مقبول">{language === 'ar' ? 'مقبول (6+)' : 'Acceptable'}</option>
            <option value="مرفوض">{language === 'ar' ? 'مرفوض شحنة غير صالحة' : 'Rejected'}</option>
          </select>
        </div>
      </div>

      {/* List / Table of Quality Checks */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'رقم التقرير' : 'Report ID'}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'المصدر' : 'Source'}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'التبريد والرطوبة' : 'Temp / RH'}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'درجة المطابقة' : 'Score'}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'الحالة والمفتش' : 'Status & Inspector'}</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-left">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    {language === 'ar' ? 'لا توجد فحوصات مطابقة للبحث' : 'No records found matching filters'}
                  </td>
                </tr>
              ) : (
                filteredChecks.map(check => (
                  <tr 
                    key={check.id} 
                    onClick={() => setSelectedCheck(check)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-sm font-black text-green-800">
                      {check.id}
                      <span className="block text-[9px] text-gray-400 font-bold">{check.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-800 group-hover:text-green-700 transition-colors">{check.itemName}</p>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{check.batchNo}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">
                      {check.origin}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700">
                        <span className="inline-block bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black mr-1">{check.temp}°C</span>
                        <span className="inline-block bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded font-black">{check.humidity}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              check.score >= 9.0 ? 'bg-emerald-500' :
                              check.score >= 8.0 ? 'bg-blue-500' :
                              check.score >= 6.0 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${check.score * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black">{check.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block ${
                        check.status === 'ممتاز' ? 'bg-emerald-50 text-emerald-700' : 
                        check.status === 'جيد جداً' ? 'bg-blue-50 text-blue-700' : 
                        check.status === 'مقبول' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {check.status}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">{check.inspector}</p>
                    </td>
                    <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handlePrintCertificate(check)}
                          title={language === 'ar' ? 'طباعة تقرير معتمد' : 'Print Certificate'}
                          className="p-2 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all"
                        >
                          🖨️
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCheck(check.id, e)}
                          title={language === 'ar' ? 'حذف الفحص' : 'Delete'}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Quality Check Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full border-4 border-green-700 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-2xl font-black text-green-900">{language === 'ar' ? 'تسجيل فحص ومطابقة مخبرية وسريعة' : 'Register New Quality Inspection'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 font-black p-2 rounded-full hover:bg-gray-50 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCheck} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Dropdown selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'اختر منتج من القائمة' : 'Select Product'}</label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      if (e.target.value === 'custom') setCustomItemName('');
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                  >
                    <option value="">-- {language === 'ar' ? 'اختر منتج أو اكتب اسمه بالأسفل' : 'Select standard product'} --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{language === 'ar' ? p.name_ar : (p.name_en || p.name_ar)}</option>
                    ))}
                    <option value="custom">{language === 'ar' ? 'منتج غير مدرج بالقائمة ✍️' : 'Write custom item name'}</option>
                  </select>
                </div>

                {/* Custom Name input if not selecting standard */}
                {(!selectedProductId || selectedProductId === 'custom') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'اسم الصنف المستلم' : 'Item Name'}</label>
                    <input 
                      type="text" 
                      placeholder={language === 'ar' ? 'مثال: طماطم بلدي' : 'e.g. Local Tomato'}
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                      required
                    />
                  </div>
                )}

                {/* Origin / Supplier */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'المورد / مصدر الشحنة' : 'Supplier / Origin'}</label>
                  <input 
                    type="text" 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                    required
                  />
                </div>

                {/* Inspector Name */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'المفتش المسؤول' : 'Inspector'}</label>
                  <input 
                    type="text" 
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                    required
                  />
                </div>

                {/* Batch Number */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'رقم التشغيلة (Batch)' : 'Batch ID'}</label>
                  <input 
                    type="text" 
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                    required
                  />
                </div>
              </div>

              {/* Refrigeration metrics */}
              <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-green-900 uppercase">{language === 'ar' ? 'درجة الحرارة المستلمة (°C)' : 'Temperature (°C)'}</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl font-bold text-sm text-green-900"
                    required
                  />
                  <span className="text-[10px] text-green-700/80 font-bold block">{language === 'ar' ? 'المعيار المبرد المعتمد: 1-5 درجات مئوية' : 'Fresh Standard: 1-5°C'}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-green-900 uppercase">{language === 'ar' ? 'نسبة الرطوبة محيط الشحنة (%)' : 'Humidity (%)'}</label>
                  <input 
                    type="number" 
                    value={humidity}
                    onChange={(e) => setHumidity(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl font-bold text-sm text-green-900"
                    required
                  />
                  <span className="text-[10px] text-green-700/80 font-bold block">{language === 'ar' ? 'المعيار المعتمد: 80-90%' : 'Fresh Standard: 80-90%'}</span>
                </div>
              </div>

              {/* Score Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'درجة مطابقة المواصفات الإجمالية' : 'Quality Score'}</label>
                  <span className="text-xl font-black text-green-800">{score} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.1" 
                  value={score}
                  onChange={(e) => setScore(parseFloat(e.target.value))}
                  className="w-full accent-green-700 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] font-black text-gray-400">
                  <span>{language === 'ar' ? '1 (غير صالح/تالف)' : '1 (Damaged)'}</span>
                  <span>{language === 'ar' ? '6 (مقبول)' : '6 (Acceptable)'}</span>
                  <span>{language === 'ar' ? '8 (جيد جداً)' : '8 (Good)'}</span>
                  <span>{language === 'ar' ? '10 (ممتاز فاخر)' : '10 (Pristine)'}</span>
                </div>
              </div>

              {/* Inspector notes */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'تقرير الفحص والملاحظات' : 'Inspection Report Notes'}</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                  placeholder={language === 'ar' ? 'ملاحظات سلامة الشحنة...' : 'Write notes...'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-xl text-sm transition-all"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="py-4 bg-green-700 hover:bg-green-600 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-green-700/20"
                >
                  {language === 'ar' ? 'تسجيل واعتماد التقرير 🔒' : 'Approve & Save Report 🔒'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Detail Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-xl w-full border-4 border-green-700 shadow-2xl text-slate-800 relative">
            <button 
              onClick={() => setSelectedCheck(null)}
              className="absolute top-6 left-6 text-gray-400 hover:text-red-500 font-black p-2 rounded-full hover:bg-slate-50 transition-all text-xl"
            >
              ✕
            </button>

            <header className="border-b border-gray-100 pb-4 mb-6">
              <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase px-3 py-1 rounded-xl">
                {language === 'ar' ? 'تقرير فحص معتمد' : 'Quality Certificate Details'}
              </span>
              <h3 className="text-2xl font-black mt-2 text-green-900">
                {selectedCheck.itemName}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                {selectedCheck.id} • {selectedCheck.date}
              </p>
            </header>

            <div className="space-y-6">
              {/* Score Display Card */}
              <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'الحالة الفنية' : 'QC Verdict'}</p>
                  <p className="text-xl font-black text-slate-800 mt-1">{selectedCheck.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'درجة التقييم' : 'Overall Score'}</p>
                  <p className="text-3xl font-black text-green-700 mt-1">{selectedCheck.score} / 10</p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                <div className="p-4 bg-slate-50/50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-black mb-1">المصدر / المورد</p>
                  <p>{selectedCheck.origin}</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-black mb-1">المفتش المستلم</p>
                  <p>{selectedCheck.inspector}</p>
                </div>
                <div className="p-4 bg-blue-50/20 rounded-xl border border-blue-50">
                  <p className="text-[10px] text-blue-500 font-black mb-1">درجة حرارة المستودع/الشاحنة</p>
                  <p className="text-blue-700 font-black">{selectedCheck.temp} °C</p>
                </div>
                <div className="p-4 bg-cyan-50/20 rounded-xl border border-cyan-50">
                  <p className="text-[10px] text-cyan-500 font-black mb-1">نسبة الرطوبة النسبية</p>
                  <p className="text-cyan-700 font-black">{selectedCheck.humidity} %</p>
                </div>
              </div>

              {/* Notes */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-gray-400 font-black mb-1">تفاصيل الفحص والتقرير المخبري السريع</p>
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{selectedCheck.notes}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <button 
                  onClick={() => handlePrintCertificate(selectedCheck)}
                  className="py-4 bg-green-700 hover:bg-green-600 text-white font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🖨️ {language === 'ar' ? 'طباعة التقرير المعتمد' : 'Print Report'}</span>
                </button>
                <button 
                  onClick={() => setSelectedCheck(null)}
                  className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-xl text-sm transition-all"
                >
                  {language === 'ar' ? 'إغلاق النافذة' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

