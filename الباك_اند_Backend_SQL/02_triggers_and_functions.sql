-- ==========================================================
-- 02_triggers_and_functions.sql
-- Delta Stars Sovereign Trigger & Automation Layer
-- Target: PostgreSQL 15+ (Supabase)
-- Description: Automates timestamp updating, live tracking logs, and real-time notification dispatches.
-- ==========================================================

-- 1. Function: Update 'updated_at' dynamically
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_column();


-- 2. Function: Auto Generate Push Notification on Order Status Changes
CREATE OR REPLACE FUNCTION public.on_order_status_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    title_ar TEXT;
    title_en TEXT;
    msg_ar TEXT;
    msg_en TEXT;
BEGIN
    -- Only dispatch when status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'accepted' THEN
            title_ar := 'تم قبول طلبك';
            title_en := 'Order Accepted';
            msg_ar := 'الطلب #' || NEW.order_number || ' تم قبوله وبدأ فريق التجهيز بالعمل عليه.';
            msg_en := 'Order #' || NEW.order_number || ' has been accepted and is being prepared.';
        ELSIF NEW.status = 'processing' THEN
            title_ar := 'طلبك قيد التحضير';
            title_en := 'Order Processing';
            msg_ar := 'طلبك #' || NEW.order_number || ' يتم تجهيزه الآن من الفواكه والخضروات الطازجة بعناية فائقة.';
            msg_en := 'Your order #' || NEW.order_number || ' is being prepared with premium select produce.';
        ELSIF NEW.status = 'ready' THEN
            title_ar := 'الطلب جاهز للشحن';
            title_en := 'Order Ready';
            msg_ar := 'تم الانتهاء من تجهيز طلبك #' || NEW.order_number || ' وهو بانتظار سائق التوصيل.';
            msg_en := 'Your order #' || NEW.order_number || ' is fully packed and ready for dispatch.';
        ELSIF NEW.status = 'shipping' THEN
            title_ar := 'طلبك في الطريق إليك';
            title_en := 'Order Out for Delivery';
            msg_ar := 'طلبك #' || NEW.order_number || ' خرج للتوصيل الآن مع المندوب. يمكنك تتبعه عبر الخريطة.';
            msg_en := 'Your order #' || NEW.order_number || ' is out for delivery. Track driver on the map.';
        ELSIF NEW.status = 'delivered' THEN
            title_ar := 'تم توصيل طلبك بنجاح';
            title_en := 'Order Delivered';
            msg_ar := 'تم تسليم الطلب #' || NEW.order_number || ' بنجاح. شكراً لثقتكم بنجوم دلتا!';
            msg_en := 'Order #' || NEW.order_number || ' has been successfully delivered. Thank you for choosing Delta Stars!';
        ELSIF NEW.status = 'cancelled' THEN
            title_ar := 'تم إلغاء الطلب';
            title_en := 'Order Cancelled';
            msg_ar := 'نأسف لإبلاغك بأنه تم إلغاء طلبك #' || NEW.order_number || '.';
            msg_en := 'We regret to inform you that your order #' || NEW.order_number || ' has been cancelled.';
        ELSE
            title_ar := 'تحديث حالة الطلب';
            title_en := 'Order Status Update';
            msg_ar := 'تم تحديث حالة طلبك #' || NEW.order_number || ' إلى ' || NEW.status;
            msg_en := 'Your order #' || NEW.order_number || ' status updated to ' || NEW.status;
        END IF;

        -- Insert notification for the user
        INSERT INTO public.notifications (user_id, title_ar, title_en, message_ar, message_en, type)
        VALUES (NEW.user_id, title_ar, title_en, msg_ar, msg_en, 'order');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger order status notifications
CREATE OR REPLACE TRIGGER trigger_order_status_notification
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.on_order_status_update_notification();


-- 3. Function: Deduct product stock automatically when order is accepted
CREATE OR REPLACE FUNCTION public.deduct_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- Deduct stocks for all items in the order
        UPDATE public.products p
        SET stock = p.stock - oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger stock deduction
CREATE OR REPLACE TRIGGER trigger_deduct_stock
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_product_stock_on_order();


-- 4. Function: Live GPS Driver Logger
CREATE OR REPLACE FUNCTION public.log_driver_gps_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Log driver location update directly to tracking table for history if order is in shipping status
    IF NEW.status = 'shipping' AND NEW.driver_id IS NOT NULL THEN
        -- Simulating tracking insertion or update log
        -- Useful for keeping historical trails of high-value sovereign shipments
        INSERT INTO public.live_tracking_logs (order_id, driver_id, lat, lng, speed, heading)
        VALUES (NEW.id, NEW.driver_id, NEW.delivery_lat, NEW.delivery_lng, 45.00, 180.00);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tracking logger
CREATE OR REPLACE TRIGGER trigger_driver_gps_log
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_driver_gps_tracking();


-- 5. Function: Process Corporate Invoices & Ledger Isolation automatically on Order acceptance
CREATE OR REPLACE FUNCTION public.process_corporate_order_ledger_and_invoice()
RETURNS TRIGGER AS $$
DECLARE
    is_corp_client BOOLEAN;
    corp_contract_id UUID;
    invoice_num VARCHAR(100);
    qr_data TEXT;
    running_bal DECIMAL(12, 2);
BEGIN
    -- Check if user is a company / corporate client with custom limits
    SELECT (role = 'vip' OR role = 'corporate'), id
    INTO is_corp_client, corp_contract_id
    FROM public.users
    WHERE id = NEW.user_id;

    IF is_corp_client IS TRUE AND NEW.status = 'accepted' THEN
        -- Find active contract
        SELECT id INTO corp_contract_id 
        FROM public.corporate_contracts 
        WHERE company_id = NEW.user_id AND status = 'active'
        LIMIT 1;

        -- 1. Create a simplified tax compliant invoice reference (VAT 15% simulation)
        invoice_num := 'INV-CORP-' || NEW.order_number;
        
        -- QR Base64 includes Seller (Delta Stars), VAT Number (311234567800003), Timestamp, Total, Tax
        qr_data := encode(convert_to('Delta Stars | VAT: 311234567800003 | ' || NEW.created_at::text || ' | Total: ' || NEW.total_amount::text || ' | Tax: ' || NEW.tax::text, 'UTF8'), 'base64');

        INSERT INTO public.corporate_invoices (company_id, order_id, invoice_number, qr_code_base64, due_date, subtotal, tax, total_amount, payment_status)
        VALUES (
            NEW.user_id,
            NEW.id,
            invoice_num,
            qr_data,
            now() + INTERVAL '30 days', -- Standard grace period
            NEW.subtotal,
            NEW.tax,
            NEW.total_amount,
            'unpaid'
        );

        -- 2. Post Charge to Isolated Corporate Accounting Ledger
        SELECT COALESCE(running_balance, 0.00) INTO running_bal
        FROM public.corporate_ledger
        WHERE company_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;

        running_bal := COALESCE(running_bal, 0.00) - NEW.total_amount; -- reduce credit pool

        INSERT INTO public.corporate_ledger (company_id, contract_id, order_id, transaction_type, amount, running_balance, notes, reference_number)
        VALUES (
            NEW.user_id,
            corp_contract_id,
            NEW.id,
            'charge',
            NEW.total_amount,
            running_bal,
            'Automatic charge for Order #' || NEW.order_number,
            'TXN-' || NEW.order_number
        );

        -- Update main users table credit limit balance pool
        UPDATE public.users
        SET current_balance = running_bal
        WHERE id = NEW.user_id;
    END IF;

    -- 6. Add Cashback Loyalty reward automatically on order delivery
    IF NEW.status = 'delivered' AND NEW.payment_status = 'paid' THEN
        -- Standard loyalty cashback rate: 2% of total_amount
        UPDATE public.users
        SET current_balance = current_balance + (NEW.total_amount * 0.02)
        WHERE id = NEW.user_id;

        -- Create loyalty notification
        INSERT INTO public.notifications (user_id, title_ar, title_en, message_ar, message_en, type)
        VALUES (
            NEW.user_id,
            'لقد حصلت على كاش باك!',
            'You earned Cashback!',
            'تمت إضافة ' || (NEW.total_amount * 0.02)::numeric(10,2) || ' ريال إلى محفظتك كأرباح ولاء.',
            'Added ' || (NEW.total_amount * 0.02)::numeric(10,2) || ' SAR to your wallet balance as loyalty reward.',
            'system'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger corporate accounting automations
CREATE OR REPLACE TRIGGER trigger_corporate_automation
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.process_corporate_order_ledger_and_invoice();

