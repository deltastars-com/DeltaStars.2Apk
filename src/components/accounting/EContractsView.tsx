import React, { useState, useEffect, useRef } from 'react';
import { Award, Fingerprint, Check, CheckCircle2, AlertCircle, Plus, Trash2, Shield, Lock, Trash, Save, Play, Eye } from 'lucide-react';

interface ContractAgreement {
  id: string;
  title: string;
  party: string;
  startDate: string;
  endDate: string;
  terms: string;
  status: 'Signed' | 'Draft' | 'Expired';
  secureHash?: string;
  signedDate?: string;
}

interface EContractsViewProps {
  language: 'ar' | 'en';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const STORAGE_KEY = 'delta_contracts_v2';

export const EContractsView: React.FC<EContractsViewProps> = ({ language, addToast }) => {
  const [contracts, setContracts] = useState<ContractAgreement[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Draft Contract Form State
  const [newTitle, setNewTitle] = useState('');
  const [newParty, setNewParty] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState('');
  const [newTerms, setNewTerms] = useState('');

  // Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Biometric Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);

  // Active Viewing Contract
  const [viewingContract, setViewingContract] = useState<ContractAgreement | null>(null);

  // Seed initial contracts
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setContracts(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing contracts', e);
      }
    } else {
      const initial: ContractAgreement[] = [
        {
          id: 'CON-2026-X01',
          title: 'اتفاقية توريد منتجات زراعية موسمية طازجة',
          party: 'شركة مزارع القصيم التعاونية والمصنفة للتمور الفاخرة',
          startDate: '2026-01-15',
          endDate: '2027-01-15',
          terms: 'يلتزم الطرف الثاني بتوريد منتجات الخضار والتمور عالية الجودة لجميع الفروع الستة التابعة لشركة نجوم دلتا المحدودة، على أن يتم حساب رسوم التوصيل طبقاً لمواقع الفروع وحساب التكلفة الفعلية بشكل شهري.',
          status: 'Signed',
          secureHash: 'SEC-HASH-819A20199EFBC2',
          signedDate: '2026-01-14',
        },
        {
          id: 'CON-2026-X02',
          title: 'عقد توظيف سائق لوجستي معتمد وتوزيع محلي',
          party: 'الكابتن عبد الرحمن الحربي - رخصة نقل ثقيل رقم 410982',
          startDate: '2026-03-01',
          endDate: '2027-03-01',
          terms: 'العمل كقائد شاحنة توزيع لتغطية فروع ومستودعات المنطقة الوسطى والشرقية، مع الالتزام بتطبيق أنظمة التتبع GPS وضمان سلامة وجودة المنتجات أثناء الشحن والنقل.',
          status: 'Signed',
          secureHash: 'SEC-HASH-55109AA12093CD',
          signedDate: '2026-02-28',
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      setContracts(initial);
    }
  }, []);

  const saveContracts = (updated: ContractAgreement[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setContracts(updated);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();
    const pos = getCoordinates(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    setIsSigned(true);
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
    setIsSigned(false);
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Synthesize laser/beep audio utilizing Web Audio API
  const playScanAudio = (frequency: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.8, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.log('Audio synthesis is not allowed or failed');
    }
  };

  // Simulated Biometric Fingerprint scan
  const handleFingerprintScan = () => {
    if (isBiometricVerified) return;
    setIsScanning(true);
    setScanProgress(0);
    playScanAudio(600, 1.8); // play sound

    const interval = setInterval(() => {
      setScanProgress((old) => {
        if (old >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setIsBiometricVerified(true);
          playScanAudio(1200, 0.4); // successful beep
          return 100;
        }
        return old + 10;
      });
    }, 180);
  };

  // Draft contract submission
  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newParty.trim()) {
      addToast(language === 'ar' ? 'الرجاء إدخال اسم العقد والطرف الثاني' : 'Please insert title and partner name', 'error');
      return;
    }

    const draftDoc: ContractAgreement = {
      id: `CON-DRAFT-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      party: newParty,
      startDate: newStartDate,
      endDate: newEndDate || 'مفتوح',
      terms: newTerms || 'لا يوجد شروط مسجلة بعد',
      status: 'Draft',
    };

    const updated = [draftDoc, ...contracts];
    saveContracts(updated);
    setShowDraftModal(false);

    // Reset draft fields
    setNewTitle('');
    setNewParty('');
    setNewStartDate(new Date().toISOString().split('T')[0]);
    setNewEndDate('');
    setNewTerms('');

    addToast(language === 'ar' ? 'تم إنشاء مسودة الاتفاقية بنجاح!' : 'Contract draft created!', 'success');
  };

  // Final Sign Contract execution
  const executeSigning = (contractId: string) => {
    if (!isSigned) {
      addToast(language === 'ar' ? 'الرجاء كتابة التوقيع اليدوي على لوحة التوقيع' : 'Please sign in the signature pad', 'error');
      return;
    }
    if (!isBiometricVerified) {
      addToast(language === 'ar' ? 'الرجاء توثيق البصمة الحيوية أولاً' : 'Please verify biometric fingerprint first', 'error');
      return;
    }

    const secureHex = `SEC-HASH-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}${Date.now().toString(16).toUpperCase()}`;

    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        return {
          ...c,
          status: 'Signed' as const,
          secureHash: secureHex,
          signedDate: new Date().toISOString().split('T')[0],
        };
      }
      return c;
    });

    saveContracts(updated);
    setIsSigned(false);
    setIsBiometricVerified(false);
    setViewingContract(null);
    addToast(language === 'ar' ? 'تم توقيع العقد قانونياً ورقمياً بنجاح!' : 'Contract signed and sealed successfully!', 'success');
  };

  const handleDelete = (id: string) => {
    const updated = contracts.filter((c) => c.id !== id);
    saveContracts(updated);
    addToast(language === 'ar' ? 'تم حذف مسودة العقد' : 'Contract draft deleted', 'info');
  };

  return (
    <div className="space-y-8 font-tajawal animate-fade-in">
      {/* Draft Creation Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleCreateDraft}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-5"
          >
            <div className="border-b pb-3">
              <h4 className="text-lg font-black text-slate-800">صياغة مسودة اتفاقية جديدة</h4>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label>اسم أو عنوان الاتفاقية</label>
                <input
                  type="text"
                  placeholder="مثال: عقد توريد خضروات"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary font-black"
                  required
                />
              </div>

              <div className="space-y-1">
                <label>الطرف الثاني (المتعاقد معه)</label>
                <input
                  type="text"
                  placeholder="الاسم الكامل للشركة أو الفرد"
                  value={newParty}
                  onChange={(e) => setNewParty(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary font-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label>تاريخ البدء</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary font-mono font-black"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label>تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary font-mono font-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label>شروط وبنود الاتفاقية</label>
                <textarea
                  rows={4}
                  placeholder="اكتب البنود والشروط القانونية والمالية..."
                  value={newTerms}
                  onChange={(e) => setNewTerms(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary font-bold text-slate-700 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-black text-xs hover:bg-yellow-600 transition"
              >
                حفظ كمسودة
              </button>
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl font-black text-xs hover:bg-slate-200 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contract Signature Panel / View details */}
      {viewingContract && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 md:p-10 rounded-3xl text-white shadow-2xl border border-white/5 space-y-8 animate-fade-in">
          {/* Back to registry */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-yellow-400 font-black text-lg">بوابة التوثيق والتعاقد الآمن</span>
            <button
              onClick={() => {
                setViewingContract(null);
                setIsBiometricVerified(false);
                setIsSigned(false);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition"
            >
              العودة للعقود
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Contract body text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-xl font-black text-white">{viewingContract.title}</h4>
                <div className="flex gap-4 text-xs text-white/50 font-bold">
                  <span>الرمز: <span className="font-mono text-yellow-400">#{viewingContract.id}</span></span>
                  <span>الطرف الأول: <span className="text-white">نجوم دلتا</span></span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-sm leading-relaxed text-white/80 font-bold">
                  {viewingContract.terms}
                </div>
              </div>
            </div>

            {/* Right Column: Signing mechanics */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              {viewingContract.status === 'Draft' ? (
                <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h5 className="text-xs font-black text-yellow-400 uppercase tracking-widest">
                    التوقيع والتوثيق الحيوي الثنائي
                  </h5>

                  {/* 1. Canvas signature */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/70 font-bold">التوقيع اليدوي الإلكتروني</span>
                      <button
                        onClick={clearCanvas}
                        className="text-[10px] text-red-400 font-black hover:underline"
                      >
                        مسح اللوحة
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-inner border border-white/10 relative">
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={120}
                        className="w-full h-28 bg-white cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!isSigned && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs pointer-events-none font-bold">
                          ارسم توقيعك هنا بالماوس أو اللمس
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Biometric scanner */}
                  <div className="space-y-2">
                    <span className="text-xs text-white/70 font-bold">توثيق الهوية الحيوية (البصمة الإلكترونية)</span>
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                      {/* Active scanning bar */}
                      {isScanning && (
                        <div
                          className="absolute left-0 w-full h-1 bg-emerald-400 z-10 animate-pulse"
                          style={{
                            top: `${scanProgress}%`,
                            boxShadow: '0 0 12px #34d399',
                            transition: 'top 0.15s linear',
                          }}
                        />
                      )}

                      <button
                        type="button"
                        onMouseDown={handleFingerprintScan}
                        onTouchStart={handleFingerprintScan}
                        disabled={isScanning || isBiometricVerified}
                        className={`p-4 rounded-full transition flex items-center justify-center ${
                          isBiometricVerified
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isScanning
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                        }`}
                      >
                        <Fingerprint className={`w-8 h-8 ${isScanning ? 'animate-pulse' : ''}`} />
                      </button>

                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-black text-white">
                          {isBiometricVerified
                            ? 'تم التحقق من البصمة ومطابقة الهوية'
                            : isScanning
                            ? `جاري مطابقة بصمة المسؤول (${scanProgress}%)`
                            : 'اضغط مستمراً لمطابقة البصمة'}
                        </p>
                        <p className="text-[10px] text-white/40 font-bold">
                          بروتوكول التحقق الآمن مدمج مع الخوادم
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approve Action */}
                  <button
                    onClick={() => executeSigning(viewingContract.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 py-3 rounded-xl font-black text-xs transition uppercase shadow-xl shadow-yellow-500/10"
                  >
                    اعتماد العقد وإصدار الختم الرقمي
                  </button>
                </div>
              ) : (
                /* Signed view status certificate card */
                <div className="bg-gradient-to-b from-slate-900 to-black p-6 rounded-2xl border border-emerald-500/20 text-center space-y-6 flex flex-col items-center justify-center shadow-xl">
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 inline-block">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-white text-base">العقد موقع ومعتمد قانونياً</h5>
                    <p className="text-xs text-white/50 font-mono">HASH: {viewingContract.secureHash}</p>
                    <p className="text-xs text-emerald-400 font-bold">تاريخ التوثيق: {viewingContract.signedDate}</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 w-full text-xs text-white/70 space-y-2 text-right">
                    <p className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      تشفير الأرشفة: متوافق بنسبة 100%
                    </p>
                    <p className="flex items-center gap-1.5 font-bold">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      الاعتماد الرقمي: الهيئة العامة للتعاقدات
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contracts Registry Explorer */}
      {!viewingContract && (
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border-2 border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-6">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <div>
                <h4 className="text-lg md:text-xl font-black text-slate-800">إدارة العقود والاتفاقيات الإلكترونية</h4>
                <p className="text-xs text-slate-400 font-bold mt-1">إنشاء، مراجعة، وتوقيع العقود بطريقة ذكية وآمنة</p>
              </div>
            </div>

            <button
              onClick={() => setShowDraftModal(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-yellow-600 transition shadow-lg shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              صياغة عقد جديد
            </button>
          </div>

          {/* Contracts table/list */}
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[700px]">
              <thead>
                <tr className="text-gray-400 text-xs font-black border-b pb-4">
                  <th className="pb-4">رمز العقد</th>
                  <th className="pb-4">عنوان الاتفاقية</th>
                  <th className="pb-4">الطرف الثاني</th>
                  <th className="pb-4">فترة السريان</th>
                  <th className="pb-4">الحالة القانونية</th>
                  <th className="pb-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold text-slate-700">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 font-mono text-xs text-slate-400">#{c.id}</td>
                    <td className="py-4 font-black text-slate-900">{c.title}</td>
                    <td className="py-4 text-xs">{c.party}</td>
                    <td className="py-4 text-xs text-gray-400 font-mono">
                      {c.startDate} إلى {c.endDate}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          c.status === 'Signed'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {c.status === 'Signed' ? 'موقع ومعتمد' : 'مسودة غير موقعة'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingContract(c)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-primary hover:text-white rounded-lg text-xs font-black text-slate-600 transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {c.status === 'Signed' ? 'عرض وتنزيل' : 'مراجعة وتوقيع'}
                        </button>
                        {c.status === 'Draft' && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
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
