-- ==========================================================
-- 01_schema_tables.sql
-- Delta Stars Sovereign Database Schema v55.0
-- Target: PostgreSQL 15+ (Compatible with Supabase)
-- Description: Creates all core relational tables with constraints, indexes, and primary keys.
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users & Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    email TEXT,
    role VARCHAR(30) NOT NULL DEFAULT 'customer', -- customer, vip, admin, driver, warehouse, delegate, developer
    status VARCHAR(30) DEFAULT 'active', -- active, suspended
    credit_limit DECIMAL(12, 2) DEFAULT 0.00, -- for corporate/VIP clients
    current_balance DECIMAL(12, 2) DEFAULT 0.00, -- cashback or prepaid wallet
    password_hash TEXT, -- fallback password
    phone_verified BOOLEAN DEFAULT FALSE,
    biometrics_enrolled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id INT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit_ar TEXT NOT NULL,
    unit_en TEXT NOT NULL,
    origin_ar TEXT NOT NULL,
    origin_en TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    description_ar TEXT,
    description_en TEXT,
    rating DECIMAL(3, 2) DEFAULT 4.8,
    reviews INT DEFAULT 12,
    calories INT DEFAULT 0,
    stock INT DEFAULT 1000,
    step DECIMAL(10, 2) DEFAULT 1.0,
    min_weight DECIMAL(10, 2) DEFAULT 0.5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Branches Table (The Six Jeddah Districts)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    city_ar TEXT DEFAULT 'جدة',
    city_en TEXT DEFAULT 'Jeddah',
    district_ar TEXT NOT NULL,
    district_en TEXT NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Coupons & Offers Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    max_discount_amount DECIMAL(10, 2),
    min_order_amount DECIMAL(10, 2) DEFAULT 50.00,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL UNIQUE, -- Human readable serial
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, processing, ready, shipping, delivered, cancelled
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cod', -- cod, mada, visa, mastercard, apple_pay, google_pay, tamara, tabby
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, paid, refunded, failed
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL,
    delivery_fee DECIMAL(12, 2) DEFAULT 0.00,
    discount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    coupon_used TEXT,
    shipping_address TEXT NOT NULL,
    delivery_lat DECIMAL(10, 7),
    delivery_lng DECIMAL(10, 7),
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    invoice_url TEXT, -- Link to Saudi compliant PDF invoice
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity DECIMAL(10, 2) NOT NULL, -- supporting fractional weights (e.g., 1.5kg)
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. OTP requests (Sovereign Verification Engine)
CREATE TABLE IF NOT EXISTS public.otp_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'login', -- login, checkout, password_reset
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Notifications Hub (System, Customer, Drivers, Delegates)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    message_en TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- order, system, driver, marketing
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. GPS Live Driver Tracking Logs
CREATE TABLE IF NOT EXISTS public.live_tracking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    speed DECIMAL(5, 2), -- in km/h
    heading DECIMAL(5, 2), -- angle of movement 0-360
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Audit Logs Table (Developer Controls and Security Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- INDEXES FOR HIGH-PERFORMANCE READS/WRITES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_otp_requests_phone ON public.otp_requests(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON public.live_tracking_logs(order_id);


-- ==========================================================
-- 11. CORPORATE & B2B GATEWAY (ISOLATED SECURE CHANNELS)
-- ==========================================================

-- Corporate Contracts / Electronic Agreements
CREATE TABLE IF NOT EXISTS public.corporate_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, terminated
    credit_limit DECIMAL(12, 2) NOT NULL DEFAULT 50000.00,
    grace_period_days INT DEFAULT 30, -- invoice payment grace period
    terms_ar TEXT,
    terms_en TEXT,
    signature_base64 TEXT, -- Digital electronic signature
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Corporate Financial Ledger & Accounting Transactions (Fully Isolated)
CREATE TABLE IF NOT EXISTS public.corporate_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.corporate_contracts(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(30) NOT NULL, -- charge (order purchase), credit (payment deposit)
    amount DECIMAL(12, 2) NOT NULL,
    running_balance DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Corporate Invoices & Compliant Statements (ZATCA Simplified Tax Invoice simulation)
CREATE TABLE IF NOT EXISTS public.corporate_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    qr_code_base64 TEXT, -- Saudi ZATCA electronic compliant base64 QR
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, partially_paid, overdue
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL, -- 15% VAT standard
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for the corporate isolated gateway
CREATE INDEX IF NOT EXISTS idx_corp_contracts_company ON public.corporate_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_corp_ledger_company ON public.corporate_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_corp_invoices_company ON public.corporate_invoices(company_id);

