-- ==========================================================
-- 06_missing_tables_fix.sql
-- Delta Stars Sovereign Database Schema — Migration Patch
-- تاريخ الإضافة: أغسطس 2026
--
-- سبب هذا الملف: فحص فعلي لتقرير PageSpeed Insights على الموقع المنشور
-- (deltastars-dpsc2ewaaiho.edgeone.dev) أظهر 404 Not Found على 8 جداول
-- يستدعيها الفرونت إند عبر Supabase REST API لكنها لم تكن معرّفة إطلاقاً
-- في ملفات المخطط السابقة. تم استنتاج أعمدة كل جدول من الكود الفعلي
-- (types.ts + كل استدعاءات .insert()/.select() في src/).
--
-- طريقة التشغيل: نفّذ هذا الملف في Supabase SQL Editor بعد تشغيل
-- 01_schema_tables.sql إلى 05_roles_permissions.sql بنفس الترتيب.
-- ==========================================================

-- 1) categories — كان يُستدعى من useProducts.ts و FirebaseContext.tsx
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2) units — وحدات القياس (كيلو، صندوق، نصف كيلو...)
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    abbreviation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3) delivery_agents — مطابق تماماً لواجهة DeliveryAgent في types.ts
CREATE TABLE IF NOT EXISTS public.delivery_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'car' CHECK (vehicle_type IN ('truck', 'car')),
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('delivering', 'online', 'offline')),
    rating NUMERIC(2,1) DEFAULT 5.0,
    completed_orders INTEGER DEFAULT 0,
    earnings DECIMAL(12,2) DEFAULT 0.00,
    location_lat DECIMAL(10,7),
    location_lng DECIMAL(10,7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4) legal_pages — مطابق لاستدعاء seedLegalPages() في FirebaseContext.tsx
CREATE TABLE IF NOT EXISTS public.legal_pages (
    id TEXT PRIMARY KEY,  -- 'privacy' | 'terms' | 'shipping' | 'returns'
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5) home_sections — مطابق لواجهة HomeSection في types.ts
CREATE TABLE IF NOT EXISTS public.home_sections (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    "isVisible" BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6) promotions — مطابق لواجهة Promotion في types.ts
CREATE TABLE IF NOT EXISTS public.promotions (
    id SERIAL PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    image TEXT,
    type TEXT DEFAULT 'banner',
    "isActive" BOOLEAN DEFAULT true,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7) ads — مطابق لواجهة Ad في types.ts (نظام الإعلانات المدفوعة للعملاء)
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    image TEXT NOT NULL,
    link TEXT,
    "customerEmail" TEXT NOT NULL,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8) archived_orders — نفس بنية جدول orders تماماً + عمود أرشفة،
--    يُستخدم بواسطة orderArchiveService.ts لنقل الطلبات القديمة
--    (توفير أداء استعلامات جدول orders الحي بعد مرور 90 يوماً مثلاً)
CREATE TABLE IF NOT EXISTS public.archived_orders (
    id UUID PRIMARY KEY,
    order_number INTEGER,
    user_id UUID,
    branch_id UUID,
    status VARCHAR(50),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    subtotal DECIMAL(12, 2),
    tax DECIMAL(12, 2),
    delivery_fee DECIMAL(12, 2),
    discount DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    coupon_used TEXT,
    shipping_address TEXT,
    delivery_lat DECIMAL(10, 7),
    delivery_lng DECIMAL(10, 7),
    driver_id UUID,
    notes TEXT,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ── Indexes for the new tables (query performance) ──────────
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_home_sections_order ON public.home_sections("order");
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON public.delivery_agents(status);
CREATE INDEX IF NOT EXISTS idx_archived_orders_created_at ON public.archived_orders(created_at);

-- ── Row Level Security (matches the policy style used in 05_roles_permissions.sql) ──
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_orders ENABLE ROW LEVEL SECURITY;

-- Public read access for storefront-facing tables (categories, units, legal
-- pages, home sections, promotions, ads) — matches how the rest of the
-- storefront catalog tables (products, branches) are already configured.
CREATE POLICY IF NOT EXISTS "Public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.units FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.legal_pages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.home_sections FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.promotions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON public.ads FOR SELECT USING (true);

-- delivery_agents & archived_orders are internal/admin-only data — no public
-- SELECT policy is created for them on purpose; access them via the
-- service-role key from server-side code only (server.ts / Netlify functions).

-- ── Seed the 4 legal pages so /legal_pages calls stop 404-ing immediately ──
INSERT INTO public.legal_pages (id, title_ar, title_en, content_ar, content_en) VALUES
('privacy', 'سياسة الخصوصية', 'Privacy Policy',
 'نلتزم بحماية بياناتك الشخصية وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية.',
 'We are committed to protecting your personal data in accordance with Saudi PDPL.'),
('terms', 'الشروط والأحكام', 'Terms & Conditions',
 'باستخدام متجر نجوم دلتا، فإنك توافق على الالتزام بشروط الاستخدام الموضحة هنا.',
 'By using Delta Stars store, you agree to the terms of use described here.'),
('shipping', 'سياسة التوصيل', 'Shipping Policy',
 'نوصل لجميع مناطق المملكة، التوصيل مجاني للطلبات فوق 200 ريال.',
 'We deliver across the Kingdom; free delivery on orders over 200 SAR.'),
('returns', 'سياسة الإرجاع', 'Returns Policy',
 'يحق للعميل طلب إرجاع أو استبدال أي صنف خلال 14 يوماً من الاستلام.',
 'Customers may request a return or exchange within 14 days of delivery.')
ON CONFLICT (id) DO NOTHING;

-- ── Seed default units so /units stops 404-ing ──────────────
INSERT INTO public.units (id, name_ar, name_en, abbreviation) VALUES
('kg', 'كيلوجرام', 'Kilogram', 'كجم'),
('g500', 'نصف كيلو', 'Half Kilo', '500جم'),
('box', 'صندوق', 'Box', 'صندوق'),
('piece', 'حبة', 'Piece', 'حبة'),
('carton', 'كرتون', 'Carton', 'كرتون')
ON CONFLICT (id) DO NOTHING;
