// Netlify Function: create-payment-intent (Moyasar)
// Secret key is SERVER-SIDE only — never exposed to browser
const MOYASAR = 'https://api.moyasar.com/v1/payments';
const SECRET  = process.env.MOYASAR_SECRET_KEY || '';

const json = (s, o) => new Response(JSON.stringify(o), {
  status: s, headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let body = {};
  try { body = await req.json(); } catch {}
  const { amount, description, orderId, customerPhone } = body;

  if (!amount || !orderId) return json(400, { error: 'amount and orderId required' });
  if (!SECRET) return json(500, { error: 'Payment gateway not configured' });

  const r = await fetch(MOYASAR, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(SECRET + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'SAR',
      description: description || `طلب نجوم دلتا #${orderId}`,
      callback_url: `https://deltastars.store/payment/verify?orderId=${orderId}`,
      metadata: { order_id: orderId, customer_phone: customerPhone || '' },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json(502, { error: data.message || 'Payment init failed' });
  return json(200, data);
};
