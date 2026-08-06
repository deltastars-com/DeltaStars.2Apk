# دليل إعداد وتشغيل قاعدة بيانات نجوم دلتا على Supabase
# Delta Stars Database Setup & Deployment Guide for Supabase

يرحب بكم فريق تطوير نجوم دلتا المطور. يحتوي هذا الدليل على الخطوات المرتبة والواضحة لرفع وتشغيل كافة جداول وأنظمة المتجر وقاعدة البيانات على منصة Supabase بكفاءة واحترافية مطلقة وبدون أي أخطاء.

This guide provides step-by-step instructions to configure, deploy, and seed your Delta Stars premium store database and tracking systems on Supabase.

---

## 📂 هيكلة الملفات (File Structure)

تم ترقيم وترتيب الملفات لتسهيل عملية التنفيذ بالترتيب الصحيح:
The SQL script files are organized and numbered sequentially for quick, error-free setup:

1. **`01_schema_tables.sql`**: إنشاء الجداول الأساسية والقيود والمؤشرات (Table Schemas & Indexes). ويحتوي على جداول بوابة الشركات والتعاقدات والفواتير المتوافقة مع متطلبات الزكاة والدخل والمحاسبة المعزولة بالكامل.
2. **`02_triggers_and_functions.sql`**: تفعيل أنظمة الأتمتة الذكية، تحديث المخزون تلقائياً عند قبول الطلب، وإطلاق الإشعارات الفورية لكل حالة طلب، بالإضافة لاحتساب الكاش باك والقيود المحاسبية للشركات تلقائياً (Triggers, stock automated deduction, and live status notifications).
3. **`03_initial_seed_branches_and_categories.sql`**: إدخال الفروع الستة في جدة والكوبونات الافتراضية (Seeding the 6 Jeddah branches and system configurations).
4. **`04_initial_seed_products.sql`**: إدخال كافة المنتجات الـ 237 بدقة تامة ومطابقة 100% للواجهة الأمامية (Seeding all 237 products with images, descriptions, categories, and prices).
5. **`05_roles_permissions.sql`**: تفعيل جدار الحماية (RLS) وتأمين قواعد البيانات والصلاحيات والعزل التام لحسابات الشركات وكبار العملاء (Role-Based Access Control, Row-Level Security, and isolated corporate gateways).

---

## 🚀 خطوات التنفيذ (Deployment Steps)

### الخطوة 1: إنشاء مشروع على Supabase
1. اذهب إلى [Supabase Console](https://supabase.com/) وسجل الدخول.
2. أنشئ مشروعاً جديداً باسم `Delta Stars` واحمِ كلمة مرور قاعدة البيانات.
3. انتظر بضع ثوانٍ لحين تجهيز الخادم بالكامل.

### الخطوة 2: تشغيل الأكواد البرمجية (SQL Editor)
1. افتح مشروعك على Supabase ثم اذهب إلى قسم **SQL Editor** من القائمة الجانبية اليسرى.
2. أنشئ استعلاماً جديداً (New Query).
3. افتح الملفات بالترتيب وانسخ محتواها والصقه في محرر الاستعلامات ثم اضغط **Run**:
   - أولاً: محتوى الملف `01_schema_tables.sql`
   - ثانياً: محتوى الملف `02_triggers_and_functions.sql`
   - ثالثاً: محتوى الملف `03_initial_seed_branches_and_categories.sql`
   - رابعاً: محتوى الملف `04_initial_seed_products.sql`
   - خامساً: محتوى الملف `05_roles_permissions.sql`

---

## 🔐 ربط المتجر بقاعدة البيانات (Connection & Integration)

بعد الانتهاء من إعداد قاعدة البيانات بنجاح، يرجى تزويد المتجر بالمتغيرات البيئية التالية في ملف البيئة الخاص بك `.env`:
After completing the DB setup, update your `.env` with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

### مميزات الربط الحقيقي (Premium Architecture Benefits):
* **تتبع مباشر وحي (Real-time Live GPS Tracking)**: تتبع مباشر لمندوبي التوصيل باستخدام نظام الاشتراك الحقيقي (Real-time PostgreSQL Changes).
* **إشعارات فورية (Automated Notifications)**: تصل العملاء والسائقين والمدراء إشعارات فورية عند تحديث حالة الطلبات تلقائياً من قاعدة البيانات.
* **إدارة متكاملة للأجهزة الذكية**: دعم البناء لخدمات Android و iOS مع المزامنة السحابية الفورية.
* **عزل تام للشركات (B2B Gateway Isolation)**: تأمين وسرية العمليات المحاسبية للشركات المميزة عن العملاء الاعتياديين.

---
**فريق تطوير Delta Stars — جودة وموثوقية واحترافية تلبي تطلعاتكم.**
