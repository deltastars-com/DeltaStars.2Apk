/**
 * otp-verify — Authentica.sa OTP verification
 */
const AUTHENTICA_VERIFY = 'https://api.authentica.sa/v1/otp/verify';
const API_KEY    = process.env.AUTHENTICA_API_KEY    || '';
const API_SECRET = process.env.AUTHENTICA_API_SECRET || '';

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

  const { phone, code, ref } = body;
  if (!phone || !code) return json(400, { success: false, error: 'رقم الهاتف والرمز مطلوبان' });

  if (!API_KEY || !API_SECRET) {
    // Dev fallback — accept any 6-digit code
    const isValid = /^\d{6}$/.test(code);
    if (!isValid) return json(400, { success: false, error: 'رمز غير صحيح' });
    return json(200, {
      success: true, verified: true,
      user: { phone, role: 'customer', verified: true },
    });
  }

  try {
    const r = await fetch(AUTHENTICA_VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'X-Api-Secret': API_SECRET,
      },
      body: JSON.stringify({ phone, code, ref }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.verified) {
      return json(400, { success: false, error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
    }
    return json(200, {
      success: true, verified: true,
      user: { phone, role: 'customer', verified: true },
    });
  } catch (e) {
    console.error('[OTP] verify error', e);
    return json(500, { success: false, error: 'خطأ في التحقق، حاول مرة أخرى' });
  }
};
