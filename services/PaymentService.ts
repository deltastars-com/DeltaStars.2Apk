/**
 * Delta Stars Payment Integration Service - Moyasar v3.0
 * خدمة الدفع المتكاملة مع بوابة ميسر - الإصدار النهائي
 * تاريخ التحديث: 20 يونيو 2026
 */

import { supabase } from '../supabaseClient';

// ============================================================
// 1. الأنواع والواجهات (Types & Interfaces)
// ============================================================

export interface MoyasarConfig {
  publishableKey: string;
  amount: number;
  currency: 'SAR';
  description: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface MoyasarPaymentResponse {
  id: string;
  status: 'initiated' | 'pending' | 'paid' | 'failed' | 'refunded' | 'voided';
  amount: number;
  currency: string;
  description: string;
  payment_url?: string;
  transaction_id?: string;
  error_message?: string;
}

export interface MoyasarPaymentMethod {
  type: 'creditcard' | 'applepay' | 'stcpay' | 'mada';
  creditcard?: {
    name: string;
    number: string;
    cvc: string;
    month: string;
    year: string;
    save_card?: boolean;
  };
  applepay?: {
    token: string;
  };
  stcpay?: {
    phone: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  error?: string;
  paymentIntent?: any;
}

// ============================================================
// 2. المفاتيح الرسمية (Production Keys)
// ============================================================

// 🔴 تنبيه هام: هذه المفاتيح حساسة، تأكد من استخدامها في متغيرات البيئة فقط
const MOYASAR_SECRET_KEY = import.meta.env.VITE_MOYASAR_SECRET_KEY || '';
const MOYASAR_PUBLISHABLE_KEY = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY || 'pk_live_g4AiZEDz5NyQMizpPxZ3nMUqpjoEEBgBatMky3tz';
const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

// ============================================================
// 3. الخدمة الرئيسية - إنشاء طلب دفع
// ============================================================

/**
 * إنشاء طلب دفع جديد عبر بوابة ميسر
 * @param config - إعدادات الدفع
 * @returns Promise<MoyasarPaymentResponse>
 */
export const initiateMoyasarPayment = async (
  config: MoyasarConfig
): Promise<MoyasarPaymentResponse> => {
  try {
    console.log('💰 Initiating Moyasar Payment:', {
      amount: config.amount,
      currency: config.currency,
      description: config.description,
    });

    // التحقق من المبلغ (يجب أن يكون أكبر من 0)
    if (config.amount <= 0) {
      throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    }

    // إنشاء طلب الدفع في الخادم (نستخدم Netlify Function أو API مباشر)
    const paymentData = {
      amount: Math.round(config.amount * 100), // تحويل إلى هللة (Hala)
      currency: config.currency || 'SAR',
      description: config.description || 'طلب من متجر دلتا ستارز',
      metadata: {
        ...config.metadata,
        order_id: config.metadata?.order_id || 'unknown',
        source: 'deltastars_store',
        timestamp: new Date().toISOString(),
      },
      callback_url: config.callbackUrl || `${window.location.origin}/payment/verify`,
      // طرق الدفع المدعومة
      payment_methods: ['creditcard', 'applepay', 'stcpay', 'mada'],
    };

    // استخدام Netlify Function كوسيط للحفاظ على سرية المفتاح السري
    const response = await fetch('/.netlify/functions/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في إنشاء طلب الدفع');
    }

    const result = await response.json();

    console.log('✅ Payment initiated successfully:', result.id);

    return {
      id: result.id,
      status: result.status || 'initiated',
      amount: result.amount || config.amount,
      currency: result.currency || config.currency,
      description: result.description || config.description,
      payment_url: result.payment_url || null,
      transaction_id: result.transaction_id || null,
    };
  } catch (error: any) {
    console.error('❌ Payment initiation error:', error);
    return {
      id: '',
      status: 'failed',
      amount: config.amount,
      currency: config.currency || 'SAR',
      description: config.description || '',
      error_message: error.message || 'حدث خطأ أثناء معالجة الدفع',
    };
  }
};

// ============================================================
// 4. تأكيد الدفع والتحقق منه
// ============================================================

/**
 * التحقق من حالة الدفع
 * @param paymentId - معرف الدفع من ميسر
 * @returns Promise<PaymentResult>
 */
export const verifyPayment = async (paymentId: string): Promise<PaymentResult> => {
  try {
    console.log(`🔍 Verifying payment: ${paymentId}`);

    const response = await fetch(`/.netlify/functions/verify-payment?paymentId=${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في التحقق من الدفع');
    }

    const result = await response.json();

    console.log('✅ Payment verification result:', result);

    return {
      success: result.status === 'paid' || result.status === 'captured' || result.status === 'succeeded',
      transactionId: result.transaction_id || paymentId,
      orderId: result.metadata?.order_id,
      amount: result.amount ? result.amount / 100 : 0,
      status: result.status,
      paymentIntent: result,
    };
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    return {
      success: false,
      error: error.message || 'فشل في التحقق من الدفع',
    };
  }
};

// ============================================================
// 5. إلغاء طلب الدفع
// ============================================================

/**
 * إلغاء طلب دفع معلق
 * @param paymentId - معرف الدفع
 * @returns Promise<boolean>
 */
export const cancelPayment = async (paymentId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Cancelling payment: ${paymentId}`);

    const response = await fetch(`/.netlify/functions/cancel-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId }),
    });

    if (!response.ok) {
      throw new Error('فشل في إلغاء الدفع');
    }

    console.log('✅ Payment cancelled successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Payment cancellation error:', error);
    return false;
  }
};

// ============================================================
// 6. تحديث حالة الطلب بعد الدفع الناجح
// ============================================================

/**
 * تحديث حالة الطلب في قاعدة البيانات بعد الدفع الناجح
 * @param orderId - معرف الطلب
 * @param transactionId - معرف المعاملة
 * @param amount - المبلغ المدفوع
 * @returns Promise<boolean>
 */
export const updateOrderAfterPayment = async (
  orderId: string,
  transactionId: string,
  amount: number
): Promise<boolean> => {
  try {
    console.log(`📝 Updating order ${orderId} after successful payment`);

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: 'card',
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Order update failed:', error);
      return false;
    }

    // تسجيل الدفعة في جدول المدفوعات
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: orderId,
      transaction_id: transactionId,
      amount: amount,
      status: 'completed',
      payment_method: 'card',
      created_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error('❌ Payment record creation failed:', paymentError);
      // لا نعيد false هنا لأن الطلب تم تحديثه بنجاح
    }

    console.log('✅ Order updated successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error updating order:', error);
    return false;
  }
};

// ============================================================
// 7. إنشاء طلب دفع مباشر من العميل (طريقة بديلة)
// ============================================================

/**
 * إنشاء طلب دفع مباشر من العميل باستخدام المفتاح العام
 * هذه الطريقة تستخدم في حالة عدم توفر Netlify Functions
 * ملاحظة: هذه الطريقة أقل أماناً ويجب استخدامها بحذر
 */
export const createPaymentIntentDirect = async (config: {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<any> => {
  try {
    // التحقق من وجود المفتاح العام
    if (!MOYASAR_PUBLISHABLE_KEY) {
      throw new Error('مفتاح ميسر العام غير موجود');
    }

    // إنشاء طلب دفع باستخدام الـ API مباشرة
    const response = await fetch(`${MOYASAR_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOYASAR_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(config.amount * 100),
        currency: config.currency || 'SAR',
        description: config.description || 'طلب من متجر دلتا ستارز',
        metadata: {
          ...config.metadata,
          source: 'deltastars_store',
        },
        callback_url: `${window.location.origin}/payment/verify`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في إنشاء طلب الدفع');
    }

    const result = await response.json();

    return {
      success: true,
      paymentId: result.id,
      status: result.status,
      amount: result.amount / 100,
      currency: result.currency,
      description: result.description,
      paymentUrl: result.payment_url || null,
    };
  } catch (error: any) {
    console.error('❌ Direct payment creation error:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء إنشاء طلب الدفع',
    };
  }
};

// ============================================================
// 8. تحميل مكتبة ميسر ديناميكياً
// ============================================================

/**
 * تحميل مكتبة ميسر ديناميكياً في المتصفح
 * @returns Promise<boolean>
 */
export const loadMoyasarSDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // التحقق مما إذا كانت المكتبة محملة بالفعل
    if (typeof window !== 'undefined' && (window as any).Moyasar) {
      console.log('✅ Moyasar SDK already loaded');
      resolve(true);
      return;
    }

    console.log('📦 Loading Moyasar SDK...');

    // إنشاء عنصر script
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/js/moyasar.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ Moyasar SDK loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Moyasar SDK');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

// ============================================================
// 9. تهيئة نموذج الدفع في الصفحة
// ============================================================

/**
 * تهيئة نموذج الدفع في الصفحة باستخدام مكتبة ميسر
 * @param config - إعدادات النموذج
 * @returns boolean - نجاح التهيئة
 */
export const initializeMoyasarForm = async (config: {
  amount: number;
  publishableKey?: string;
  elementSelector?: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: any) => void;
}): Promise<boolean> => {
  try {
    // تحميل المكتبة
    const sdkLoaded = await loadMoyasarSDK();
    if (!sdkLoaded) {
      console.error('❌ Cannot initialize form: SDK not loaded');
      return false;
    }

    // التحقق من وجود الكائن في window
    const moyasar = (window as any).Moyasar;
    if (!moyasar) {
      console.error('❌ Moyasar object not found');
      return false;
    }

    const elementSelector = config.elementSelector || '.mysr-form';
    const publishableKey = config.publishableKey || MOYASAR_PUBLISHABLE_KEY;

    // تهيئة النموذج
    moyasar.init({
      element: elementSelector,
      amount: Math.round(config.amount * 100),
      currency: 'SAR',
      description: 'طلب من متجر دلتا ستارز السيادي',
      publishable_api_key: publishableKey,
      callback_url: `${window.location.origin}/payment/verify`,
      metadata: {
        order_id: localStorage.getItem('last_order_id') || 'unknown',
        branch_id: localStorage.getItem('selected_branch_id') || 'unknown',
      },
      methods: ['creditcard', 'applepay', 'stcpay', 'mada'],
      // معالج الدفع الناجح
      onSuccess: (payment: any) => {
        console.log('✅ Payment successful:', payment);
        if (config.onSuccess) {
          config.onSuccess(payment);
        }
      },
      // معالج الدفع الفاشل
      onError: (error: any) => {
        console.error('❌ Payment error:', error);
        if (config.onError) {
          config.onError(error);
        }
      },
      // معالج إلغاء الدفع
      onCancel: () => {
        console.log('ℹ️ Payment cancelled by user');
      },
    });

    console.log('✅ Moyasar form initialized successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Form initialization error:', error);
    return false;
  }
};

// ============================================================
// 10. تصدير جميع الدوال والثوابت
// ============================================================

// تصدير المفاتيح للاستخدام في أماكن أخرى
export { MOYASAR_PUBLISHABLE_KEY, MOYASAR_SECRET_KEY, MOYASAR_API_URL };

// تصدير واجهة الاستخدام الرئيسية
export default {
  initiateMoyasarPayment,
  verifyPayment,
  cancelPayment,
  updateOrderAfterPayment,
  createPaymentIntentDirect,
  loadMoyasarSDK,
  initializeMoyasarForm,
  MOYASAR_PUBLISHABLE_KEY,
  MOYASAR_SECRET_KEY,
};
