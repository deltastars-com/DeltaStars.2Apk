/**
 * otp-notify — Send order status SMS via Authentica.sa
 */
const AUTHENTICA_SMS = 'https://api.authentica.sa/v1/sms/send';
const API_KEY    = process.env.AUTHENTICA_API_KEY    || '';
const API_SECRET = process.env.AUTHENTICA_API_SECRET || '';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};
const json = (s, o) => new Response(JSON.stringify(o), { status: s, headers: cors });

const STATUS_MSGS = {
  pending:    'تم استلام طلبك وهو قيد المراجعة',
  confirmed:  'تم تأكيد طلبك وجارٍ التجهيز',
  processing: 'طلبك قيد التجهيز في المستودع',
  shipped:    'طلبك في الطريق إليك مع المندوب',
  delivered:  'تم تسليم طلبك بنجاح. شكراً لثقتك بنجوم دلتا 🌟',
  cancelled:  'تم إلغاء طلبك. للاستفسار: 920023204',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let body = {};
  try { body = await req.json(); } catch {}

  const { phone, orderId, status } = body;
  if (!phone || !orderId) return json(400, { success: false, error: 'phone and orderId required' });

  const statusMsg = STATUS_MSGS[status] || `تم تحديث حالة طلبك #${orderId}`;
  const message = `نجوم دلتا: طلب #${orderId}\n${statusMsg}`;

  if (!API_KEY) {
    console.log('[NOTIFY DEV]', phone, message);
    return json(200, { success: true });
  }

  try {
    const r = await fetch(AUTHENTICA_SMS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'X-Api-Secret': API_SECRET,
      },
      body: JSON.stringify({ phone, message, sender: 'DeltaStars' }),
    });
    return json(r.ok ? 200 : 502, { success: r.ok });
  } catch {
    return json(500, { success: false });
  }
};
