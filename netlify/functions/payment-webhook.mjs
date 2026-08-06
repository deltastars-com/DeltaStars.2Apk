/**
 * payment-webhook — Moyasar payment webhook handler
 */
const MOYASAR_SECRET = process.env.MOYASAR_SECRET_KEY || '';
const cors = { 'Content-Type': 'application/json; charset=utf-8' };
const json = (s, o) => new Response(JSON.stringify(o), { status: s, headers: cors });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let event = {};
  try { event = await req.json(); } catch {}

  console.log('[Webhook] Moyasar event:', event.type, event.data?.id);

  // Verify it's a real Moyasar request
  const auth = req.headers.get('authorization') || '';
  if (MOYASAR_SECRET && auth !== `Basic ${Buffer.from(MOYASAR_SECRET + ':').toString('base64')}`) {
    return json(401, { error: 'Unauthorized' });
  }

  // Handle payment events
  if (event.type === 'payment.paid') {
    const { id, metadata } = event.data || {};
    console.log('[Payment] SUCCESS orderId:', metadata?.order_id, 'paymentId:', id);
    // Here: update Supabase order status to 'paid'
  } else if (event.type === 'payment.failed') {
    console.log('[Payment] FAILED:', event.data?.id);
  }

  return json(200, { received: true });
};
