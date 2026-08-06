import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const normalizePhone = (phone: string): string => {
  let p = phone.trim().replace(/[\s\-]/g, '');
  if (p.startsWith('+966')) return p;
  if (p.startsWith('966')) return `+${p}`;
  if (p.startsWith('05')) return `+966${p.slice(1)}`;
  if (p.startsWith('5')) return `+966${p}`;
  return `+966${p}`;
};

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phoneNumber, action, code } = await req.json();

    if (!phoneNumber) {
      return new Response(JSON.stringify({ success: false, error: 'رقم الجوال مطلوب' }), { status: 400, headers: corsHeaders });
    }
    if (!action || (action !== 'send-otp' && action !== 'verify-otp')) {
      return new Response(JSON.stringify({ success: false, error: 'action غير صالح' }), { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('AUTHENTICA_API_KEY');
    if (!apiKey) {
      console.error('❌ AUTHENTICA_API_KEY غير موجود في Supabase Secrets');
      return new Response(JSON.stringify({ success: false, error: 'خدمة الرسائل غير متاحة' }), { status: 500, headers: corsHeaders });
    }

    const formattedPhone = normalizePhone(phoneNumber);
    console.log(`📱 action=${action}, phone=${formattedPhone}`);

    if (action === 'send-otp') {
      const otpCode = generateOTP();
      const response = await fetch('https://api.authentica.sa/api/v2/otp/send', {
        method: 'POST',
        headers: { 'X-Authorization': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ channel: 'SMS', phone: formattedPhone, message: `رمز التحقق الخاص بك هو: ${otpCode}` }),
      });
      const result = await response.json();
      if (!response.ok || result?.status === false) throw new Error(result?.message || 'فشل الإرسال');
      return new Response(JSON.stringify({ success: true, message: 'تم إرسال الرمز', code: otpCode }), { status: 200, headers: corsHeaders });
    }

    if (action === 'verify-otp') {
      if (!code) return new Response(JSON.stringify({ success: false, error: 'الرمز مطلوب' }), { status: 400, headers: corsHeaders });
      const response = await fetch('https://api.authentica.sa/api/v2/otp/verify', {
        method: 'POST',
        headers: { 'X-Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code }),
      });
      const result = await response.json();
      if (!response.ok || result?.status === false) throw new Error(result?.message || 'رمز غير صحيح');
      return new Response(JSON.stringify({ success: true, message: 'تم التحقق' }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'غير معروف' }), { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error('❌', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
});
