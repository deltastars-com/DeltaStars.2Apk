import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const AUTHENTICA_API_KEY = Deno.env.get('AUTHENTICA_API_KEY');

serve(async (req) => {
  try {
    const { phoneNumber } = await req.json();
    
    // تنسيق رقم الجوال
    let phone = phoneNumber.replace(/[\s\-]/g, '');
    if (phone.startsWith('05')) phone = '+966' + phone.substring(1);
    if (phone.startsWith('966')) phone = '+' + phone;
    
    const response = await fetch('https://api.authentica.sa/api/v2/otp/send', {
      method: 'POST',
      headers: {
        'X-Authorization': AUTHENTICA_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: 'SMS',
        phone: phone,
        message: 'رمز التحقق الخاص بك هو: {{otp}}'
      })
    });

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});