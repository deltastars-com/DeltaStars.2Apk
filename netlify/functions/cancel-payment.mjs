// Netlify Function: cancel-payment
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

  const r = await fetch(`${MOYASAR}/${paymentId}/void`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(SECRET + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
  });
  const data = await r.json().catch(() => ({}));
  return json(r.ok ? 200 : 502, { success: r.ok, ...data });
};
