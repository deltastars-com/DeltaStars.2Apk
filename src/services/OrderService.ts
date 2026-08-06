import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const processCheckout = async (cartTotal: number, customer: any, branchId: string) => {
  if (cartTotal < 50) {
    throw new Error('الحد الأدنى لإتمام الطلب هو 50 ريال.');
  }

    // OTP verification must be completed via Authentica Edge Functions before checkout
  if (!customer.isVerified) {
    throw new Error('يجب التحقق من رقم الجوال عبر رمز OTP قبل إتمام الطلب.');
  }

// توزيع الطلب لأقرب مندوب مخزن وسائق من الفروع الستة
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('branch_id', branchId)
    .eq('current_status', 'online')
    .eq('is_active', true)
    .order('last_location_update', { ascending: false })
    .limit(1);

  if (drivers && drivers.length > 0) {
    // إرسال إشعار فوري للسائق، لوحة التحكم، والمخزن
    console.log('Notifying driver:', drivers[0].id);
    // await sendPushNotification(drivers[0].id, 'طلب جديد للتوصيل!');
  }
  
  return true; // الانتقال لبوابة الدفع
};

// Helper for push notifications (to be implemented or integrated with Firebase)
async function sendPushNotification(driverId: string, message: string) {
    console.log(`Push to ${driverId}: ${message}`);
}
