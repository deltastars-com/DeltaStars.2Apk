# ⚙️ الباك أند (Backend) — الدليل الموحد

**نجوم دلتا للتجارة** — خريطة كاملة لكل مكونات الخادم في المستودع وكيفية نشرها.

---

## 1. 🗂️ المكونات

| المسار | الوصف | بيئة النشر |
|:---|:---|:---|
| `server.ts` | خادم Express للعرض/التطوير: API عام + Gemini Proxy + OTP + دفع + استضافة Vite | أي Node 18+ (يقرأ `PORT`) |
| `netlify/functions/` | دوال Serverless (OTP، دفع، نماذج) — 8 دوال | Netlify |
| `services/` | `OrderAutomation.ts` (أتمتة الطلبات والتوجيه)، `PaymentService.ts` (الدفع) | يندمج مع الدوال |
| `prisma/` | `schema.prisma` (نموذج البيانات) + `seed.ts` | DB بأي مزود (اختياري) |
| `supabase/` | `functions/` (دوال الحافة) + `supabase/` (SQL) | Supabase |
| `الباك_اند_Backend_SQL/` | 6 ملفات SQL كاملة (جداول + دوال + بذور + صلاحيات) | Supabase SQL Editor |
| `scripts/generate_sql_seed.ts` | مولّد بذور SQL للمنتجات | CLI |

## 2. 🚀 نشر Netlify (الموصى به للويب)

```bash
npm run build          # يبني dist + server.cjs
netlify deploy --prod --dir=dist
```
- `netlify.toml` يعيد توجيه `/api/*` إلى الدوال تلقائياً.
- رؤوس الأمان (CSP/HSTS) في `netlify.toml` و`_headers`.

## 3. 🗄️ قاعدة بيانات Supabase

1. افتح SQL Editor في لوحة Supabase.
2. نفّذ ملفات `الباك_اند_Backend_SQL/` بالترتيب (01 → 06).
3. فعّل **Realtime** للجداول الحرجة (التتبع):
   ```sql
   alter publication supabase_realtime add table public.orders;
   alter publication supabase_realtime add table public.drivers;
   alter publication supabase_realtime add table public.shipments;
   ```
4. انشر دوال الحافة:
   ```bash
   supabase functions deploy payment-webhook
   supabase functions deploy create-order
   supabase functions deploy send-otp
   supabase functions deploy verify-otp
   supabase functions deploy update-driver-location
   ```

## 4. 🔑 مفاتيح البيئة للخادم

| المفتاح | الاستخدام |
|:---|:---|
| `AUTHENTICA_API_KEY` / `AUTHENTICA_API_SECRET` | رسائل OTP عبر Authentica.sa |
| `MOYASAR_SECRET_KEY` | التحقق من المدفوعات (Moyasar) |
| `GEMINI_API_KEY` (أو `VITE_GEMINI_KEY`) | المساعد الذكي عدي |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | بيانات المتجر |
| `SUPABASE_SERVICE_ROLE_KEY` | دوال الحافة فقط |

> جميع هذه المفاتيح مضبوطة في لوحة Freebuff (Keys/API keys) وفي GitHub Actions/Codemagic secrets.

## 5. 🧪 نقطة فحص الصحة

```
GET /api/health         → حالة الخادم
GET /api/health/system  → حالة (STC Pay، SMS، AI) — operational/simulated
```

---

*© 2026 شركة نجوم دلتا للتجارة — جميع الحقوق محفوظة.*
