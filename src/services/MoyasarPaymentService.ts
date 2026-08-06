/**
 * Delta Stars — Moyasar Payment Service
 * Public key from VITE_MOYASAR_PUBLISHABLE_KEY only.
 * Secret key lives in Netlify env, never in frontend.
 */

declare global {
  interface Window { Moyasar: any; }
}

const PK = (import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY as string) || '';
const CALLBACK_BASE = import.meta.env.VITE_APP_URL || 'https://deltastars.store';

export interface PaymentConfig {
  amount: number;       // SAR
  description: string;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  id: string;
  status: 'paid' | 'failed' | 'initiated' | 'pending';
  amount: number;
  message?: string;
}

/** Load Moyasar JS once */
function loadMoyasarScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Moyasar) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('تعذّر تحميل بوابة الدفع'));
    document.head.appendChild(s);
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
    document.head.appendChild(css);
  });
}

/** Mount Moyasar hosted-form into elementSelector */
export async function mountMoyasarForm(
  elementSelector: string,
  config: PaymentConfig
): Promise<void> {
  await loadMoyasarScript();
  window.Moyasar.init({
    element: elementSelector,
    amount: Math.round(config.amount * 100),   // halalas
    currency: 'SAR',
    description: config.description,
    publishable_api_key: PK,
    callback_url: `${CALLBACK_BASE}/payment/verify?orderId=${config.orderId}`,
    on_completed: (payment: PaymentResult) => {
      window.dispatchEvent(new CustomEvent('moyasar:paid', { detail: payment }));
    },
    on_failure: (error: any) => {
      window.dispatchEvent(new CustomEvent('moyasar:failed', { detail: error }));
    },
    metadata: {
      order_id: config.orderId,
      customer_name: config.customerName || '',
      customer_phone: config.customerPhone || '',
      ...config.metadata,
    },
    methods: ['creditcard', 'mada', 'applepay', 'stcpay'],
    apple_pay: {
      country: 'SA',
      label: 'نجوم دلتا للتجارة',
      validate_merchant_url: `${CALLBACK_BASE}/.netlify/functions/verify-payment`,
    },
  });
}

/** Verify a payment via server-side endpoint (uses secret key server-side) */
export async function verifyPayment(paymentId: string): Promise<PaymentResult> {
  const isNetlify = window.location.hostname.includes('netlify') || window.location.hostname.includes('localhost') && !window.location.port;
  const endpoint = isNetlify ? '/.netlify/functions/verify-payment' : '/api/payment/verify';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل التحقق من الدفع');
  return data;
}

/** Cancel / refund via server-side endpoint */
export async function cancelPayment(
  paymentId: string, reason?: string
): Promise<{ success: boolean }> {
  const isNetlify = window.location.hostname.includes('netlify') || window.location.hostname.includes('localhost') && !window.location.port;
  const endpoint = isNetlify ? '/.netlify/functions/cancel-payment' : '/api/payment/cancel';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, reason }),
  });
  return res.json();
}
