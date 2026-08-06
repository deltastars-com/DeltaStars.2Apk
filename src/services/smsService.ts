/**
 * SMS Service — routes through Netlify Functions → Authentica.sa
 */
export const smsService = {
  async sendVerificationCode(phone: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'فشل إرسال رمز التحقق');
    return data;
  },

  async verifyCode(phone: string, code: string): Promise<{ success: boolean; verified: boolean }> {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'رمز التحقق غير صحيح');
    return data;
  },

  async sendOrderStatusUpdate(phone: string, orderId: string, status: string, metadata?: any): Promise<{ success: boolean }> {
    const res = await fetch('/api/otp/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, orderId, status, metadata }),
    });
    const data = await res.json();
    return data;
  },

  async sendWhatsAppNotification(phone: string, message: string): Promise<{ success: boolean }> {
    console.log('[WhatsApp Dev Notification]', phone, message);
    return { success: true };
  },
};
