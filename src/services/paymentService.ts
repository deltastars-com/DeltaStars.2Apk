import { supabase } from '../lib/supabaseClient';

export const paymentService = {
  async createPayment(amount: number, orderId: string, description?: string) {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: { amount, orderId, description }
    });
    
    if (error) throw new Error(error.message);
    
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
    
    return data;
  }
};
export const PaymentService = {
  executePayment: async (paymentDetails: any, amount: number) => {
    // إعداد واجهة الدفع (مدى، فيزا، تابي، تمارا)
    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + btoa('YOUR_SECRET_KEY') },
      body: JSON.stringify({
        amount: amount * 100, // ميسر يتعامل بالهللات
        currency: 'SAR',
        description: 'طلب متجر نجوم دلتا - البنك العربي الوطني',
        source: paymentDetails
      })
    });
    return await response.json();
  }
};
