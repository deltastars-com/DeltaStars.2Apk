// Netlify Function: verify-payment
// Secret key stays server-side only
const MOYASAR = 'https://api.moyasar.com/v1/payments';
const SECRET  = process.env.MOYASAR_SECRET_KEY || '';

const json = (s, o) => new Response(JSON.stringify(o), {
  status: s, headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let body = {};
  try { body = await req.json(); } catch {}
  const { paymentId } = body;
  if (!paymentId) return json(400, { error: 'paymentId required' });
  if (!SECRET)    return json(500, { error: 'Payment gateway not configured' });

  const r = await fetch(`${MOYASAR}/${paymentId}`, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(SECRET + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json(502, { error: data.message || 'Verification failed' });
  return json(200, {
    id: data.id, status: data.status,
    amount: data.amount / 100, currency: data.currency,
    message: data.message,
  });
};
