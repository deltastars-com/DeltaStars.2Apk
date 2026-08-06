import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const MOYASAR_SECRET_KEY = Deno.env.get('MOYASAR_SECRET_KEY');

serve(async (req) => {
  try {
    const { amount, orderId, description } = await req.json();
    
    const auth = btoa(`${MOYASAR_SECRET_KEY}:`);
    
    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'SAR',
        description: description || `طلب رقم ${orderId}`,
        callback_url: `${Deno.env.get('APP_URL') || 'https://your-site.com'}/payment-callback`,
        source: { type: 'creditcard' }
      })
    });

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentId: result.id,
        checkoutUrl: result.source?.transaction_url || null 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});