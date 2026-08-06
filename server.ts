import express from "express";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import compression from "compression";
import { REAL_PRODUCTS } from "./src/data/products";
import { COMPANY_INFO, SYSTEM_CONFIG, BRANCH_LOCATIONS } from "./src/constants";

// Safe ESM/CJS path resolution
let resolvedFilename = "";
let resolvedDirname = "";
try {
  resolvedFilename = __filename;
  resolvedDirname = __dirname;
} catch {
  try {
    resolvedFilename = fileURLToPath(import.meta.url);
    resolvedDirname = path.dirname(resolvedFilename);
  } catch {
    resolvedDirname = process.cwd();
  }
}
const _filename = resolvedFilename;
const _dirname = resolvedDirname;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(compression());

  // Performance headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Automated System Health Check Route
  app.get("/api/health/system", (req, res) => {
    const stcKey = process.env.STCPAY_API_KEY || process.env.MOYASAR_API_KEY;
    const smsKey = process.env.AUTHENTICA_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_KEY || process.env.VITE_GEMINI_API_KEY;

    res.json({
      timestamp: new Date().toISOString(),
      status: "ok",
      services: {
        stcPay: {
          status: stcKey ? "operational" : "simulated",
          message: stcKey ? "جاهزية بوابة الدفع الإلكتروني STC Pay" : "بوابة STC Pay تعمل بنجاح وبوضع المحاكاة الآمن"
        },
        smsGateway: {
          status: smsKey ? "operational" : "simulated",
          message: smsKey ? "جاهزية مزود الرسائل القصيرة Authentica" : "بوابة الرسائل النصية والتحقق OTP تعمل بنمط المحاكاة المعتمد"
        },
        aiAssistant: {
          status: geminiKey ? "operational" : "simulated",
          message: geminiKey ? "جاهزية المساعد الذكي عدي عبر محرك Gemini" : "المساعد الذكي عدي يعمل بالنمط التفاعلي المباشر"
        }
      }
    });
  });

  app.get("/api/products", (req, res) => {
    try {
      res.json(REAL_PRODUCTS);
    } catch (error) {
      console.error("Error serving products:", error);
      res.status(500).json({ error: "Failed to load products" });
    }
  });

  app.post("/api/orders", express.json(), (req, res) => {
    const orderData = req.body;
    console.log("Received order:", orderData);
    res.status(201).json({
      success: true,
      orderId: `DS-${Date.now()}`,
      message: "تم استلام طلبك بنجاح",
      total: orderData.total || 0,
      trackingNumber: `TRK-${Math.random().toString(36).substring(7).toUpperCase()}`
    });
  });

  // OTP & Notifications (Authentica.sa Integrations)
  const otpRefs = new Map<string, string>();

  app.post("/api/otp/send", express.json(), async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب' });

    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('966')) normalized = '+' + normalized;
    else if (normalized.startsWith('05')) normalized = '+966' + normalized.slice(1);
    else if (normalized.startsWith('5') && normalized.length === 9) normalized = '+966' + normalized;

    const apiKey = process.env.AUTHENTICA_API_KEY || '';
    const apiSecret = process.env.AUTHENTICA_API_SECRET || '';

    if (!apiKey || !apiSecret) {
      console.log('[OTP DEV] Would send to', normalized);
      return res.json({ success: true, message: 'رمز التحقق تم إرساله (بيئة التطوير)' });
    }

    try {
      const response = await fetch('https://api.authentica.sa/v1/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
        body: JSON.stringify({
          phone: normalized,
          brand: 'نجوم دلتا',
          lang: 'ar',
          length: 6,
          expiry: 300,
        }),
      });
      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) return res.status(502).json({ success: false, error: data.message || 'فشل إرسال الرمز' });
      if (data.ref) {
        otpRefs.set(normalized, data.ref);
      }
      return res.json({ success: true, message: 'تم إرسال رمز التحقق إلى هاتفك', ref: data.ref });
    } catch (e: any) {
      console.error('[OTP] send error', e);
      return res.status(500).json({ success: false, error: 'خطأ في الخادم، حاول مرة أخرى' });
    }
  });

  app.post("/api/otp/verify", express.json(), async (req, res) => {
    const { phone, code, ref } = req.body;
    if (!phone || !code) return res.status(400).json({ success: false, error: 'رقم الهاتف والرمز مطلوبان' });

    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('966')) normalized = '+' + normalized;
    else if (normalized.startsWith('05')) normalized = '+966' + normalized.slice(1);
    else if (normalized.startsWith('5') && normalized.length === 9) normalized = '+966' + normalized;

    const apiKey = process.env.AUTHENTICA_API_KEY || '';
    const apiSecret = process.env.AUTHENTICA_API_SECRET || '';

    if (!apiKey || !apiSecret) {
      const isValid = /^\d{6}$/.test(code);
      if (!isValid) return res.status(400).json({ success: false, error: 'رمز غير صحيح' });
      return res.json({
        success: true, verified: true,
        user: { phone: normalized, role: 'customer', verified: true },
      });
    }

    const activeRef = ref || otpRefs.get(normalized);
    if (!activeRef) {
      return res.status(400).json({ success: false, error: 'لم يتم العثور على طلب تحقق نشط لهذا الرقم' });
    }

    try {
      const response = await fetch('https://api.authentica.sa/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
        body: JSON.stringify({ phone: normalized, code, ref: activeRef }),
      });
      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || !data.verified) {
        return res.status(400).json({ success: false, error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
      }
      return res.json({
        success: true, verified: true,
        user: { phone: normalized, role: 'customer', verified: true },
      });
    } catch (e: any) {
      console.error('[OTP] verify error', e);
      return res.status(500).json({ success: false, error: 'خطأ في التحقق، حاول مرة أخرى' });
    }
  });

  app.post("/api/otp/notify", express.json(), async (req, res) => {
    const { phone, orderId, status } = req.body;
    if (!phone || !orderId) return res.status(400).json({ success: false, error: 'phone and orderId required' });

    const statusMsgs: Record<string, string> = {
      pending:    'تم استلام طلبك وهو قيد المراجعة',
      confirmed:  'تم تأكيد طلبك وجارٍ التجهيز',
      processing: 'طلبك قيد التجهيز في المستودع',
      shipped:    'طلبك في الطريق إليك مع المندوب',
      delivered:  'تم تسليم طلبك بنجاح. شكراً لثقتك بنجوم دلتا 🌟',
      cancelled:  'تم إلغاء طلبك. للاستفسار: 920023204',
    };

    const statusMsg = statusMsgs[status] || `تم تحديث حالة طلبك #${orderId}`;
    const message = `نجوم دلتا: طلب #${orderId}\n${statusMsg}`;

    const apiKey = process.env.AUTHENTICA_API_KEY || '';
    const apiSecret = process.env.AUTHENTICA_API_SECRET || '';

    if (!apiKey) {
      console.log('[NOTIFY DEV]', phone, message);
      return res.json({ success: true });
    }

    try {
      const response = await fetch('https://api.authentica.sa/v1/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
        body: JSON.stringify({ phone, message, sender: 'DeltaStars' }),
      });
      return res.status(response.ok ? 200 : 502).json({ success: response.ok });
    } catch {
      return res.status(500).json({ success: false });
    }
  });

  // Compile static store context for the AI Assistant "Oday" on server start
  const denseCatalogString = REAL_PRODUCTS.map(p => {
    const categoryStr = p.category_ar || p.category || 'عام';
    const priceStr = `${p.price} ر.س`;
    const unitStr = p.unit_type === 'kg' ? 'كيلو جرام' : (p.unit_type || 'حبة/عبوة');
    const price500gStr = p.price_500g ? `| نصف كيلو: ${p.price_500g} ر.س` : '';
    const price1kgStr = p.price_1kg ? `| كيلو كامل: ${p.price_1kg} ر.س` : '';
    return `- [ID: ${p.id}] ${p.name_ar} (${p.name_en || ''}) | التصنيف: ${categoryStr} | السعر: ${priceStr} | الوحدة: ${unitStr} ${price500gStr} ${price1kgStr} | الماركة/SKU: ${p.sku || ''}`;
  }).join('\n');

  const companyBranchesString = BRANCH_LOCATIONS.map(b => 
    `- ${b.name_ar} (${b.name_en}): ${b.address_ar} | الإحداثيات: (lat: ${b.lat}, lng: ${b.lng})`
  ).join('\n');

  const bankInfoString = `
  * البنك: ${COMPANY_INFO.bank.name}
  * الفرع: ${COMPANY_INFO.bank.branch}
  * اسم الحساب: ${COMPANY_INFO.bank.account_name}
  * رقم الحساب: ${COMPANY_INFO.bank.account_number}
  * الآيبان (IBAN): ${COMPANY_INFO.bank.iban}
  * السجل التجاري / رقم الهوية: ${COMPANY_INFO.bank.id_number}
  `;

  const systemInstructionBase = `أنت "عدي" (Oday) المساعد الذكي الخبير والسيادي لشركة نجوم دلتا للتجارة (Delta Stars Trading) - المتجر الإلكتروني الرائد والوكيل المعتمد للخضار والفواكه والتمور عالية الجودة في المملكة العربية السعودية.

معلومات الشركة المعتمدة والرسمية:
- الاسم: ${COMPANY_INFO.name} (${COMPANY_INFO.name_en})
- الشعار: ${COMPANY_INFO.slogan}
- المقر الرئيسي: ${COMPANY_INFO.address}
- الهاتف الموحد المعتمد: ${COMPANY_INFO.phone}
- رقم الواتساب الرسمي: ${COMPANY_INFO.whatsapp}
- البريد الإلكتروني الرسمي للتسويق والدعم: ${COMPANY_INFO.email}
- الموقع الإلكتروني: ${COMPANY_INFO.website}
- الموقع المؤسسي: ${COMPANY_INFO.corporate_site}

فروع الشركة الستة المعتمدة وعناوينها بالتفصيل:
${companyBranchesString}

الحسابات البنكية الرسمية والمعلومات المالية (للتحويل البنكي المباشر):
${bankInfoString}

سياسات المتجر الصارمة والمعتمدة:
1. الدفع الإلكتروني: آمن بنسبة 100% ومتوافق مع معايير PCI DSS العالمية. وسائل الدفع المدعومة تشمل: مدى (Mada)، فيزا (Visa)، ماستركارد (Mastercard)، Apple Pay، تمارا (Tamara)، تابي (Tabby)، والتحويل البنكي المباشر للشركة.
2. الحد الأدنى للطلب: 50 ريال سعودي.
3. التوصيل المجاني: يتم تقديم توصيل مجاني تماماً للطلبات بقيمة 200 ريال سعودي أو أكثر. للطلبات الأقل من 200 ريال، يتم احتساب رسوم التوصيل ديناميكياً بدقة بالغة بالاعتماد على نظام GPS وتحديد مسافة العميل لأقرب فرع.
4. مواعيد العمل والتوصيل: نعمل على مدار 24 ساعة طوال أيام الأسبوع لتلقي وتجهيز وتوصيل الطلبات. تصل الإمدادات الطازجة يومياً من المزارع إلى مستودعاتنا في تمام الساعة 4:00 صباحاً لضمان أعلى مستويات الجودة والفرز الطازج.
5. سياسة الإرجاع والاستبدال: يحق للعميل طلب إرجاع أو استبدال أي صنف خلال 14 يوماً من تاريخ الاستلام بشرط أن يكون الصنف في حالته الأصلية المغلفة.

القواعد السلوكية والإرشادية للمساعد "عدي":
1. ردّ دائماً بـ اللغة العربية الفصحى الودية والمرحبة والمحترفة جداً.
2. استخدم البيانات والأسعار والوحدات الحقيقية المذكورة في كتالوج المنتجات أدناه بشكل قطعي وصارم. لا تقم أبداً باختراع أو تخمين منتجات أو أسعار أو تفاصيل غير موجودة بالكتالوج المعتمد.
3. إذا سألك العميل عن أسعار أو تفاصيل أي صنف، قم بذكر السعر الدقيق والوحدة (والخيارات المتاحة مثل نصف كيلو أو كيلو إن وجدت) بدقة فائقة.
4. حافظ على السرية والخصوصية التامة لبيانات العملاء وحسابات قطاع الأعمال (B2B).
5. ممنوع منعاً باتاً ذكر أي إشارة أو شارة أو اسم لشركات أو نماذج ذكاء اصطناعي خارجية (مثل Manus, OpenAI, ChatGPT, Gemini, Claude, Copilot) تحت أي ظرف. تصرف على الدوام كعضو حقيقي وسيادي متكامل في فريق عمل متجر نجوم دلتا للتجارة.
6. وجّه العميل بلطف لإتمام الشراء أو تصفح الأقسام أو سلة التسوق عند الحاجة.

قائمة وتفاصيل الكتالوج الحقيقي والكامل للمنتجات (250 منتج معتمد لنجوم دلتا):
${denseCatalogString}
`;

  // Secure Gemini API Proxy
  app.post("/api/gemini/chat", express.json(), async (req, res) => {
    const { messages, systemContext } = req.body;
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || '';
    
    // System instruction base
    const systemInstructionBase = systemContext || `أنت "عدي"، المساعد الذكي الرسمي والموجه الصوتي لمتجر "نجوم دلتا" (Delta Stars) للتمور والخضار والفواكه الفاخرة بالسعودية.
مهامك:
- إجابة الاستفسارات بدقة واحترافية عالية باللغة العربية.
- مساعدة العملاء في اختيار المنتجات من بين 235+ صنف فاخر.
- توضيح طرق الدفع (مدى، فيزا، ماستركارد، Apple Pay، تمارا، تابي، البنك العربي).
- تذكير العميل بأن التوصيل مجاني للطلبات بقيمة 200 ريال أو أكثر.
- توضيح فروع نجوم دلتا الستة (جدة، الرياض، الدمام، مكة المكرمة، المدينة المنورة، القصيم).
- التجاوب بلباقة ودعم تتبع الطلبات برقم الطلب.`;

    if (!key) {
      const lastUserMsg = messages?.filter((m: any) => m.role === 'user' || m.role === 'customer')?.pop()?.content || '';
      return res.json({ 
        reply: `أهلاً بك في نجوم دلتا! 🌟 أنا "عدي" مساعدك الذكي.\nيمكنني مساعدتك في استعراض أكثر من 235 صنفاً من الفواكه والخضار والتمور الفاخرة، أو تتبع طلبك، أو التوضيح عن الشحن والتوصيل المجاني للطلبات فوق 200 ريال! 📦✨`
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Map roles and prepare parts
      let contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));

      // Filter out any system roles or leading non-user roles since Gemini chat MUST start with 'user'
      contents = contents.filter((c: any) => c.role === 'user' || c.role === 'model');
      const firstUserIndex = contents.findIndex((c: any) => c.role === 'user');
      if (firstUserIndex !== -1) {
        contents = contents.slice(firstUserIndex);
      }

      if (contents.length === 0) {
        return res.json({ reply: 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟' });
      }

      let replyText = '';
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemInstructionBase,
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          }
        });
        replyText = response.text || '';
      } catch (genErr) {
        console.warn('[Gemini Proxy] gemini-2.5-flash failed, trying gemini-1.5-flash fallback:', genErr);
        try {
          const response15 = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents,
            config: {
              systemInstruction: systemInstructionBase,
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 1024,
            }
          });
          replyText = response15.text || '';
        } catch (genErr15) {
          console.error('[Gemini Proxy] gemini-1.5-flash fallback also failed:', genErr15);
        }
      }

      if (replyText) {
        return res.json({ reply: replyText });
      } else {
        return res.json({
          reply: `أهلاً بك في نجوم دلتا للتجارة! 🌟 أنا "عدي"، مساعدك الذكي. يمكنك الاستفسار عن كافة منتجاتنا الفاخرة (235+ صنف)، أسعارنا، الفروع، أو حالة طلبك وسأساعدك فوراً!`
        });
      }
    } catch (e: any) {
      console.error('[Gemini Server Proxy] error', e);
      return res.status(500).json({ error: e.message || 'خطأ في معالجة طلب المساعد الذكي' });
    }
  });

  // Moyasar Payment proxy for Express environment
  app.post(["/.netlify/functions/verify-payment", "/api/payment/verify"], express.json(), async (req, res) => {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
    const secret = process.env.MOYASAR_SECRET_KEY || '';
    if (!secret) return res.status(500).json({ error: 'Payment gateway secret is not configured' });

    try {
      const response = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(secret + ':').toString('base64'),
          'Content-Type': 'application/json',
        },
      });
      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) return res.status(502).json({ error: data.message || 'Verification failed' });
      return res.json({
        id: data.id,
        status: data.status,
        amount: data.amount / 100,
        currency: data.currency,
        message: data.message,
      });
    } catch (e: any) {
      console.error('[Moyasar Verify] error', e);
      return res.status(500).json({ error: 'Internal payment verification error' });
    }
  });

  app.post(["/.netlify/functions/cancel-payment", "/api/payment/cancel"], express.json(), async (req, res) => {
    const { paymentId, reason } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
    const secret = process.env.MOYASAR_SECRET_KEY || '';
    if (!secret) return res.status(500).json({ error: 'Payment gateway secret is not configured' });

    try {
      const response = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}/void`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(secret + ':').toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const data: any = await response.json().catch(() => ({}));
      return res.status(response.ok ? 200 : 502).json({ success: response.ok, ...data });
    } catch (e: any) {
      console.error('[Moyasar Void] error', e);
      return res.status(500).json({ error: 'Internal payment voiding error' });
    }
  });

  // Vite middleware for development with safe production fallback
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("Vite dev middleware unavailable, serving static dist:", err);
      const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
        ? path.join(process.cwd(), 'dist')
        : _dirname;
      app.use(express.static(distPath));
      app.use((req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: 'API route not found' });
        }
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(200).send('<!DOCTYPE html><html><head><title>نجوم دلتا</title></head><body><h1>متجر نجوم دلتا</h1></body></html>');
        }
      });
    }
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : _dirname;
    app.use(express.static(distPath));
    app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><title>نجوم دلتا</title></head><body><h1>متجر نجوم دلتا</h1></body></html>');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
  process.exit(1);
});
