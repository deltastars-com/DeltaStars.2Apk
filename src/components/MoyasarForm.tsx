import React, { useEffect, useRef, useState } from 'react';
import { mountMoyasarForm } from '../services/MoyasarPaymentService';
import { MadaLogo, VisaLogo, MastercardLogo, ApplePayLogo, GooglePayLogo, TabbyLogo, TamaraLogo, MoyasarLogo } from './PaymentIcons';

interface MoyasarFormProps {
  amount: number;
  orderId?: string;
  description?: string;
  customerPhone?: string;
  customerName?: string;
  onSuccess?: (payment: any) => void;
  onFailure?: (error: any) => void;
}

const MoyasarForm: React.FC<MoyasarFormProps> = ({
  amount, orderId, description, customerPhone, customerName,
  onSuccess, onFailure,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  const finalOrderId = orderId || `DS-TX-${Math.floor(100000 + Math.random() * 900000)}`;

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    mountMoyasarForm('.mysr-form', {
      amount,
      orderId: finalOrderId,
      description: description || `طلب نجوم دلتا #${finalOrderId}`,
      customerPhone,
      customerName,
    }).then(() => setLoading(false))
      .catch((e) => { setError(e.message); setLoading(false); });

    const onPaid = (e: Event) => onSuccess?.((e as CustomEvent).detail);
    const onFail = (e: Event) => onFailure?.((e as CustomEvent).detail);
    window.addEventListener('moyasar:paid', onPaid);
    window.addEventListener('moyasar:failed', onFail);
    return () => {
      window.removeEventListener('moyasar:paid', onPaid);
      window.removeEventListener('moyasar:failed', onFail);
    };
  }, [amount, finalOrderId, description, customerPhone, customerName, onSuccess, onFailure]);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-lg">💳</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">إتمام الدفع عبر البوابة</h3>
            <p className="text-emerald-600 font-black text-sm">{amount.toFixed(2)} ريال</p>
          </div>
        </div>
        <MoyasarLogo className="h-8 shrink-0" />
      </div>

      {/* Payment methods icons */}
      <div className="flex items-center gap-3.5 mb-6 flex-wrap justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <MadaLogo className="h-6" />
        <VisaLogo className="h-4" />
        <MastercardLogo className="h-5" />
        <ApplePayLogo className="h-5" />
        <GooglePayLogo className="h-5" />
        <TabbyLogo className="h-6" />
        <TamaraLogo className="h-6" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
          <span className="mr-3 text-gray-500">جارٍ تحميل بوابة الدفع...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}
      <div className="mysr-form" />

      <p className="text-xs text-gray-400 mt-4 text-center">
        🔒 الدفع مشفر وآمن بتقنية SSL — لا يتم تخزين بيانات بطاقتك
      </p>
    </div>
  );
};

export default MoyasarForm;
