/**
 * Delta Stars — Gemini AI Service (عدي المساعد الذكي)
 * API key from VITE_GEMINI_KEY env var only.
 *
 * v2 — Root-cause fix (Aug 2026):
 * On static hosts (e.g. Tencent EdgeOne) that cannot run the Netlify/Node
 * serverless proxy, and when no client-side Gemini key is injected at
 * build time, the assistant used to fall back to a generic canned reply
 * with ZERO product knowledge — which is exactly why "عدي" was giving
 * wrong/vague answers. The fallback below now does real fuzzy matching
 * against the live product catalog so answers stay accurate even when
 * Gemini itself is unreachable.
 */

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const KEY = import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface CatalogProduct {
  name_ar?: string;
  name_en?: string;
  price?: number;
  price_500g?: number;
  price_1kg?: number;
  unit_ar?: string;
  price_unit?: string;
  origin_ar?: string;
  origin?: string;
  category_ar?: string;
  stock_available?: number;
  stock?: number;
}

export async function chatWithOday(
  messages: GeminiMessage[],
  systemContext: string,
  products: CatalogProduct[] = []
): Promise<string> {
  // 1. Try server-side secure API first (works when deployed on Netlify/Node)
  try {
    const res = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemContext }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.reply) return data.reply;
    }
    console.warn("Server-side Gemini proxy returned non-OK, trying client fallback...");
  } catch (e) {
    console.warn("Server-side Gemini proxy call failed, trying client fallback...", e);
  }

  // 2. Client-side direct Gemini call (works when VITE_GEMINI_KEY is baked into the build)
  try {
    if (KEY) {
      let contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      contents = contents.filter(c => c.role === 'user' || c.role === 'model');
      const firstUserIndex = contents.findIndex(c => c.role === 'user');
      if (firstUserIndex !== -1) {
        contents = contents.slice(firstUserIndex);
      }

      if (contents.length > 0) {
        const body = {
          system_instruction: { parts: [{ text: systemContext }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        };

        const res = await fetch(`${GEMINI_API}?key=${KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        }
      }
    }
  } catch (err) {
    console.warn("Client side Gemini API call error:", err);
  }

  // 3. Real product-aware local fallback (never invents data — only ever
  //    reports what's actually in the catalog passed in)
  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  return generateSmartStoreReply(lastUserMsg, products);
}

/**
 * Normalizes Arabic text for fuzzy matching:
 * strips diacritics, unifies alef/ya/ta-marbuta variants, removes
 * punctuation and extra whitespace, lowercases Latin chars.
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')          // diacritics
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function priceOf(p: CatalogProduct): { value: number; unit: string } {
  if (p.price) return { value: p.price, unit: p.unit_ar || p.price_unit || 'ريال' };
  if (p.price_1kg) return { value: p.price_1kg, unit: 'ريال / كيلو' };
  if (p.price_500g) return { value: p.price_500g, unit: 'ريال / نصف كيلو' };
  return { value: 0, unit: '' };
}

function generateSmartStoreReply(userText: string, products: CatalogProduct[]): string {
  const normQuery = normalizeArabic(userText);
  const queryTokens = normQuery.split(' ').filter(t => t.length >= 2);

  // ── 1) Real product search — the core fix ──────────────────────────
  if (products && products.length > 0 && queryTokens.length > 0) {
    const scored = products
      .map(p => {
        const normName = normalizeArabic(p.name_ar || p.name_en || '');
        if (!normName) return { p, score: 0 };
        let score = 0;
        if (normName.includes(normQuery) || normQuery.includes(normName)) score += 10;
        for (const tok of queryTokens) {
          if (normName.includes(tok)) score += 2;
        }
        return { p, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const top = scored.slice(0, 5).map(({ p }) => {
        const { value, unit } = priceOf(p);
        const stock = p.stock_available ?? p.stock ?? 0;
        const avail = stock > 0 ? '✅ متوفر' : '❌ غير متوفر حالياً';
        const origin = p.origin_ar || p.origin ? ` | المنشأ: ${p.origin_ar || p.origin}` : '';
        return `• ${p.name_ar || p.name_en} — ${value} ${unit} — ${avail}${origin}`;
      }).join('\n');
      return `🔍 وجدت هذه النتائج المطابقة في كتالوجنا الحقيقي:\n${top}\n\nهل تود إضافة أحدها إلى السلة؟`;
    }
  }

  // ── 2) Known intents (branches, payment, delivery) — same as before ──
  const query = normQuery;
  if (query.includes('فرع') || query.includes('عنوان') || query.includes('موقع')) {
    return `فروع نجوم دلتا الستة بالمملكة 📍:\n• الفرع الرئيسي: جدة - حي الصفا\n• فرع الرياض - العزيزية\n• فرع الدمام - حي الشاطئ\n• فرع مكة المكرمة - الشوقية\n• فرع المدينة المنورة - حي البحر\n• فرع القصيم - بريدة`;
  }
  if (query.includes('دفع') || query.includes('بطاقه') || query.includes('تمارا') || query.includes('تابي') || query.includes('مدي')) {
    return `طرق الدفع المعتمدة 💳:\n• مدى (Mada)، فيزا (Visa)، ماستركارد، Apple Pay\n• تقسيط تمارا وتابي بدون فوائد\n• تحويل بنكي مباشر لحساب الشركة (البنك العربي الوطني)\nجميع العمليات آمنة 100% ومشفّرة.`;
  }
  if (query.includes('شحن') || query.includes('توصيل') || query.includes('مجاني')) {
    return `خدمة التوصيل 🚚:\n• التوصيل مجاني تماماً للطلبات بقيمة 200 ريال أو أكثر 🎉\n• للطلبات الأقل من 200 ريال، تُحسب الرسوم آلياً حسب أقرب فرع من موقعك!`;
  }
  if (query.includes('سعر') || query.includes('منتج') || query.includes('فاكهه') || query.includes('خضار')) {
    return `أهلاً بك! لدينا أكثر من 250 صنفاً طازجاً من الخضار والفواكه وتمور القصيم الفاخرة 🌟.\nاذكر اسم الصنف مباشرة (مثال: "سعر التفاح" أو "عندكم موز؟") وسأبحث لك فوراً في الكتالوج الحقيقي!`;
  }

  return `أهلاً بك في متجر نجوم دلتا! 🌟 أنا "عدي" مساعدك الذكي.\nيمكنك سؤالي مباشرة عن اسم أي منتج (مثال: "سعر التمر" أو "عندكم خيار؟") وسأعطيك السعر والتوفر الحقيقي فوراً، أو اسأل عن الفروع وطرق الدفع والتوصيل!`;
}
