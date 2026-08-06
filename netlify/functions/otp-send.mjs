/**
 * otp-send — Authentica.sa SMS OTP
 * Secret key in Netlify env vars only
 */
const AUTHENTICA_URL = 'https://api.authentica.sa/v1/otp/send';
const API_KEY        = process.env.AUTHENTICA_API_KEY || '';
const API_SECRET     = process.env.AUTHENTICA_API_SECRET || '';
const BRAND          = 'نجوم دلتا';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

const json = (s, o) => new Response(JSON.stringify(o), { status: s, headers: cors });

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let body = {};
  try { body = await req.json(); } catch {}

  const { phone } = body;
  if (!phone) return json(400, { success: false, error: 'رقم الهاتف مطلوب' });

  // Normalize Saudi phone
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('966')) normalized = '+' + normalized;
  else if (normalized.startsWith('05')) normalized = '+966' + normalized.slice(1);
  else if (normalized.startsWith('5') && normalized.length === 9) normalized = '+966' + normalized;

  if (!API_KEY || !API_SECRET) {
    // Dev fallback — log only, return success
    console.log('[OTP DEV] Would send to', normalized);
    return json(200, { success: true, message: 'رمز التحقق تم إرساله' });
  }

  try {
    const r = await fetch(AUTHENTICA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'X-Api-Secret': API_SECRET,
      },
      body: JSON.stringify({
        phone: normalized,
        brand: BRAND,
        lang: 'ar',
        length: 6,
        expiry: 300, // 5 minutes
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return json(502, { success: false, error: data.message || 'فشل إرسال الرمز' });
    return json(200, { success: true, message: 'تم إرسال رمز التحقق إلى هاتفك', ref: data.ref });
  } catch (e) {
    console.error('[OTP] send error', e);
    return json(500, { success: false, error: 'خطأ في الخادم، حاول مرة أخرى' });
  }
};
