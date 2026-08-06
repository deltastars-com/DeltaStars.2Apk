-- ==========================================================
-- 05_roles_permissions.sql
-- Delta Stars Security & Role-Based Access Control (RBAC)
-- Target: PostgreSQL 15+ (Supabase)
-- Description: Secures database access using Row Level Security (RLS) policies.
-- ==========================================================

-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoices ENABLE ROW LEVEL SECURITY;


-- 2. PRODUCTS RLS POLICIES (Public Read, Admin Write)
CREATE POLICY "Allow public select on products"
    ON public.products FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Allow admin write on products"
    ON public.products FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));


-- 3. BRANCHES RLS POLICIES (Public Read, Admin Write)
CREATE POLICY "Allow public select on branches"
    ON public.branches FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Allow admin write on branches"
    ON public.branches FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));


-- 4. USERS/PROFILES RLS POLICIES (Self Read/Write, Admin All)
CREATE POLICY "Allow self select profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Allow self update profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow admin all profiles"
    ON public.users FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));


-- 5. ORDERS RLS POLICIES (Self Orders, Admin/Drivers assigned orders)
CREATE POLICY "Allow customer read self orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow customer insert self orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow driver read assigned orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = driver_id);

CREATE POLICY "Allow driver update assigned order status"
    ON public.orders FOR UPDATE
    USING (auth.uid() = driver_id);

CREATE POLICY "Allow admin/developer/warehouse all orders"
    ON public.orders FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer', 'warehouse')
    ));


-- 6. ORDER ITEMS RLS POLICIES
CREATE POLICY "Allow self order items select"
    ON public.order_items FOR SELECT
    USING (order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid() OR driver_id = auth.uid()
    ));

CREATE POLICY "Allow customer insert self order items"
    ON public.order_items FOR INSERT
    WITH CHECK (order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid()
    ));

CREATE POLICY "Allow admin write all order items"
    ON public.order_items FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer', 'warehouse')
    ));


-- 7. NOTIFICATIONS RLS POLICIES (Self notifications)
CREATE POLICY "Allow user read self notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow user update self notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow admin insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (TRUE);


-- 8. LIVE TRACKING LOGS RLS POLICIES (Assigned drivers, related customers)
CREATE POLICY "Allow users read related order tracking"
    ON public.live_tracking_logs FOR SELECT
    USING (order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid() OR driver_id = auth.uid()
    ));

CREATE POLICY "Allow driver insert tracking"
    ON public.live_tracking_logs FOR INSERT
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Allow admin read all tracking"
    ON public.live_tracking_logs FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));


-- 9. CORPORATE CHANNELS RLS POLICIES (Strict Isolation)
-- Ensures corporate details, agreements, ledgers, and ZATCA invoices are absolutely restricted to the specific corporate user & admin!
CREATE POLICY "Allow corporate read self contracts"
    ON public.corporate_contracts FOR SELECT
    USING (auth.uid() = company_id);

CREATE POLICY "Allow admin managed corporate contracts"
    ON public.corporate_contracts FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));

CREATE POLICY "Allow corporate read self financial ledger"
    ON public.corporate_ledger FOR SELECT
    USING (auth.uid() = company_id);

CREATE POLICY "Allow admin full ledger visibility"
    ON public.corporate_ledger FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));

CREATE POLICY "Allow corporate read self invoices"
    ON public.corporate_invoices FOR SELECT
    USING (auth.uid() = company_id);

CREATE POLICY "Allow admin manage corporate invoices"
    ON public.corporate_invoices FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('admin', 'developer')
    ));
