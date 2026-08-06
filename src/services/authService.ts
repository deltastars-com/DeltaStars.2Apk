/**
 * Delta Stars — Auth Service
 * OTP via Netlify Functions → Authentica.sa
 * Keys live only in Netlify environment vars, never in this file.
 */

const API = '/api/otp';

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('966')) return '+' + d;
  if (d.startsWith('05'))  return '+966' + d.slice(1);
  if (d.startsWith('5') && d.length === 9) return '+966' + d;
  return raw;
}

export const authService = {
  async sendOTP(phone: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizePhone(phone) }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'فشل إرسال رمز التحقق');
    return data;
  },

  async verifyOTP(phone: string, code: string): Promise<{
    success: boolean; verified: boolean;
    user?: { phone: string; role: string; verified: boolean };
  }> {
    const res = await fetch(`${API}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizePhone(phone), code }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'رمز التحقق غير صحيح');
    return data;
  },

  async verifyOTPAndSignIn(phone: string, code: string): Promise<any> {
    const res = await this.verifyOTP(phone, code);
    if (!res.verified) throw new Error('Verification failed');
    return {
      user: {
        id: 'user-' + phone.replace(/\D/g, ''),
        phone: phone,
        role: res.user?.role || 'customer',
        verified: true,
        user_metadata: {
          full_name: 'VIP User',
          role: res.user?.role || 'customer',
          permissions: [],
          phone_verified: true
        }
      }
    };
  },

  async sendOrderNotification(
    phone: string, orderId: string, status: string
  ): Promise<void> {
    await fetch(`${API}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizePhone(phone), orderId, status }),
    }).catch(() => {});
  },
};
