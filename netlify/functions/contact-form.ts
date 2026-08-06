// Netlify Function: contact-form
const json = (s: number, o: object) => new Response(JSON.stringify(o), {
  status: s, headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

export default async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let body: any = {};
  try { body = await (req as any).json(); } catch {}
  const { name, phone, email, message } = body;
  if (!name || !message) return json(400, { error: 'name and message required' });
  // Log to console — hook up email service when ready
  console.log('[Contact Form]', { name, phone, email, message });
  return json(200, { success: true, message: 'تم استلام رسالتك بنجاح' });
};
