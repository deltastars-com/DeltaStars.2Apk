# 🍎 App Store Connect — قائمة المتجر الكاملة

**التطبيق:** نجوم دلتا — Delta Stars
**Bundle ID:** `com.deltastars.store`
**الفئة:** Food & Drink (الفئة الفرعية: Grocery / Fruit & Vegetable)

---

## 1. الاسم (App Name)

- **عربي:** نجوم دلتا
- **إنجليزي:** Delta Stars

## 2. الوصف (App Description)

### عربي
متجر نجوم دلتا — الخيار الأول للخضار والفواكه والتمور الطازجة في المملكة العربية السعودية.

- منتجات طازجة يومياً من المزارع السعودية
- توصيل سريع ومبرد خلال ساعات من الفروع الستة
- تتبع مباشر للطلب على الخريطة لحظة بلحظة
- دفع آمن: Apple Pay، مدى، فيزا، ماستركارد، تمارا، تابي
- توصيل مجاني للطلبات فوق 200 ريال
- مساعد ذكي "عدي" للإجابة عن استفساراتك
- تسجيل دخول آمن ببصمة الوجه (Face ID) أو الإصبع
- أكثر من 250 صنفاً فاخراً بأسعار منافسة

### English
Delta Stars — the perfect partner for premium fresh produce in Saudi Arabia.

- Farm-fresh fruits, vegetables and dates delivered daily
- Fast chilled delivery from 6 branches
- Live GPS order tracking
- Secure payments: Apple Pay, mada, Visa, Mastercard
- Free delivery over SAR 200
- 250+ quality products

## 3. الكلمات المفتاحية (Keywords — 100 حرفاً)

`نجوم دلتا,خضار,فواكه,تمور,توصيل,سعودية,طازج,متجر,بقالة,fruits,vegetables,dates,grocery`

## 4. الروابط المطلوبة

| الحقل | القيمة |
|:---|:---|
| Support URL | `https://deltastars.store/contact` |
| Marketing URL | `https://deltastars.store` |
| Privacy Policy URL | `https://deltastars.store/privacy-policy` |

## 5. إعلان الخصوصية (App Privacy) — أنواع البيانات

- **الموقع (Location):** يُستخدم لتحديد أقرب فرع وحساب رسوم التوصيل وتتبع الطلب — غير مرتبط بالهوية عند الإمكان، ويُحذف عند الطلب.
- **معلومات الاتصال (Contact Info):** الاسم ورقم الجوال والعنوان لمعالجة الطلبات والتوصيل.
- **معرفات المستخدمين (User IDs):** لحفظ الجلسة وسجل الطلبات.
- **البيانات المالية (Financial Info):** لا نجمع بيانات البطاقات — الدفع عبر مزود خارجي معتمد.
- **البيانات الحساسة (Sensitive Info):** لا نجمعها.

## 6. الشاشات المطلوبة (Screenshots)

المقاسات المطلوبة لأجهزة iPhone (انظر `store/screenshots-guide.md`):
- 6.7" (iPhone 15 Pro Max / 14 Pro Max): 1290×2796
- 6.5" (iPhone 15 Plus / 14 Plus): 1242×2688
- 5.5" (iPhone 8 Plus): 1242×2208
- iPad (اختياري): 2048×2732 / 2160×1620

## 7. معلومات الرفع

- **Version:** من `version.json` (يجب أن يتطابق مع `MARKETING_VERSION` في مشروع Xcode)
- **Build Number:** يزيد تلقائياً مع كل رفع (CURRENT_PROJECT_VERSION)
- **App Review Notes (اختياري):** "تطبيق تسوق للخضار والفواكه — يمكن الدخول كضيف وتصفح الكتالوج بدون تسجيل."

## 8. المتطلبات قبل الرفع

- [ ] حساب Apple Developer مفعّل ($99/سنة)
- [ ] مفتاح App Store Connect API في Codemagic (`deltastars_ios`)
- [ ] سياسة الخصوصية منشورة ومرتبطة
- [ ] شاشات بالقياسات أعلاه
