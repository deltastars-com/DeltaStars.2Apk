import axios from 'axios';

/**
 * Delta Stars Moyasar Integration Service
 * نظام الدفع الإلكتروني المتكامل مع منصة ميسر السعودية
 */

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';
const MOYASAR_PUBLIC_KEY = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY || import.meta.env.VITE_MOYASAR_PUBLIC_KEY || '';

export interface MoyasarPaymentPayload {
  amount: number; // in Halalas (e.g., 100 SAR = 10000)
  currency: 'SAR';
  description: string;
  callback_url: string;
  source: {
    type: 'creditcard' | 'applepay' | 'stcpay';
    name?: string;
    number?: string;
    month?: string;
    year?: string;
    cvc?: string;
  };
  metadata?: Record<string, any>;
}

export class MoyasarService {
  /**
   * Initializes a payment request
   */
  static async createPayment(payload: MoyasarPaymentPayload) {
    if (!MOYASAR_PUBLIC_KEY) {
      throw new Error('Moyasar Public Key is missing in environment variables.');
    }

    try {
      const response = await axios.post(`${MOYASAR_API_URL}/payments`, payload, {
        auth: {
          username: MOYASAR_PUBLIC_KEY,
          password: '',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Moyasar Payment Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Verifies a payment status
   */
  static async fetchPayment(paymentId: string) {
    try {
      const response = await axios.get(`${MOYASAR_API_URL}/payments/${paymentId}`, {
        auth: {
          username: MOYASAR_PUBLIC_KEY,
          password: '',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Moyasar Fetch Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
}
