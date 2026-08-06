-- ==========================================================
-- 03_initial_seed_branches_and_categories.sql
-- Delta Stars Seed Script - Branches & Configuration
-- Target: PostgreSQL 15+ (Supabase)
-- Description: Seeds branches (the 6 Jeddah districts), initial categories, and coupons.
-- ==========================================================

-- 1. Seed Branches (The 6 Jeddah Districts with Real Coordinate Hubs)
INSERT INTO public.branches (id, name_ar, name_en, district_ar, district_en, lat, lng, is_active) VALUES
('b1111111-1111-1111-1111-111111111111', 'فرع حي الشاطئ (رئيسي)', 'Al-Shati Branch (HQ)', 'حي الشاطئ', 'Al-Shati', 21.5833, 39.1167, TRUE),
('b2222222-2222-2222-2222-222222222222', 'فرع حي السلامة', 'Al-Salama Branch', 'حي السلامة', 'Al-Salama', 21.5744, 39.1500, TRUE),
('b3333333-3333-3333-3333-333333333333', 'فرع حي الروضة', 'Al-Rawdah Branch', 'حي الروضة', 'Al-Rawdah', 21.5594, 39.1558, TRUE),
('b4444444-4444-4444-4444-444444444444', 'فرع حي النسيم', 'Al-Naseem Branch', 'حي النسيم', 'Al-Naseem', 21.5039, 39.2225, TRUE),
('b5555555-5555-5555-5555-555555555555', 'فرع حي المنار', 'Al-Manar Branch', 'حي المنار', 'Al-Manar', 21.5433, 39.2311, TRUE),
('b6666666-6666-6666-6666-666666666666', 'فرع حي الحمدانية', 'Al-Hamdaniya Branch', 'حي الحمدانية', 'Al-Hamdaniya', 21.7333, 39.1500, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  district_ar = EXCLUDED.district_ar,
  district_en = EXCLUDED.district_en,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;

-- 2. Seed Default Active Coupons for testing and launches
INSERT INTO public.coupons (code, discount_percent, max_discount_amount, min_order_amount, expires_at) VALUES
('DELTA10', 10, 50.00, 50.00, now() + INTERVAL '90 days'),
('FREESHIP', 100, 25.00, 200.00, now() + INTERVAL '180 days'),
('FIRSTVIP', 15, 100.00, 100.00, now() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;
