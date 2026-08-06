import { LegalPage } from '../types';

export const DEFAULT_LEGAL_PAGES: LegalPage[] = [
  {
    id: 'privacy',
    title_ar: 'سياسة الخصوصية',
    title_en: 'Privacy Policy',
    content_ar: `نحن في شركة نجوم دلتا للتجارة نولي أهمية قصوى لخصوصية بياناتكم. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتكم الشخصية.
    
1. المعلومات التي نجمعها:
- نجمع المعلومات التي تقدمونها عند التسجيل أو إتمام الطلب (الاسم، رقم الجوال، العنوان).
- نجمع بيانات تقنية مثل عنوان الـ IP ونوع الجهاز لتحسين تجربة المستخدم.

2. كيف نستخدم معلوماتكم:
- لمعالجة وتوصيل طلباتكم بدقة.
- لإرسال تحديثات الطلب والعروض الترويجية (يمكنكم إلغاء الاشتراك في أي وقت).
- لتحسين خدماتنا ومنع الاحتيال.

3. حماية البيانات:
- نستخدم تقنيات تشفير متقدمة (SSL) لحماية بياناتكم أثناء النقل.
- لا نقوم ببيع أو مشاركة بياناتكم مع أطراف ثالثة لأغراض تسويقية.

4. حقوقكم:
- يحق لكم الوصول إلى بياناتكم الشخصية وتصحيحها أو طلب حذفها.`,
    content_en: `At Delta Stars Trading, we prioritize your data privacy. This policy explains how we collect, use, and protect your personal information.

1. Information We Collect:
- We collect information you provide when registering or completing an order (name, phone number, address).
- We collect technical data such as IP address and device type to improve user experience.

2. How We Use Your Information:
- To process and deliver your orders accurately.
- To send order updates and promotional offers (you can unsubscribe at any time).
- To improve our services and prevent fraud.

3. Data Protection:
- We use advanced encryption technologies (SSL) to protect your data during transmission.
- We do not sell or share your data with third parties for marketing purposes.

4. Your Rights:
- You have the right to access, correct, or request the deletion of your personal data.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'terms',
    title_ar: 'الشروط والأحكام',
    title_en: 'Terms & Conditions',
    content_ar: `باستخدامك لمتجر نجوم دلتا، فإنك توافق على الالتزام بالشروط والأحكام التالية:

1. أهلية الاستخدام:
- يجب أن تكون كامل الأهلية القانونية لإبرام العقود.

2. الطلبات والأسعار:
- جميع الأسعار تشمل ضريبة القيمة المضافة ما لم يذكر خلاف ذلك.
- نحتفظ بالحق في رفض أو إلغاء أي طلب في حال وجود خطأ في التسعير أو توفر المنتج.

3. الدفع:
- نوفر طرق دفع آمنة (مدى، فيزا، ماستر كارد، أبل باي).
- للعملاء VIP، تتوفر خيارات الدفع الآجل وفقاً للاتفاقيات المبرمة.

4. الملكية الفكرية:
- جميع المحتويات والعلامات التجارية في المتجر هي ملك لشركة نجوم دلتا للتجارة.`,
    content_en: `By using the Delta Stars store, you agree to comply with the following terms and conditions:

1. Eligibility:
- You must have full legal capacity to enter into contracts.

2. Orders and Pricing:
- All prices include VAT unless otherwise stated.
- We reserve the right to refuse or cancel any order in case of pricing errors or product unavailability.

3. Payment:
- We provide secure payment methods (Mada, Visa, MasterCard, Apple Pay).
- For VIP customers, credit payment options are available according to signed agreements.

4. Intellectual Property:
- All content and trademarks in the store are the property of Delta Stars Trading.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'shipping',
    title_ar: 'سياسة الشحن والتوصيل واللوجستيات',
    title_en: 'Shipping, Delivery & Logistics Policy',
    content_ar: `نحن في شركة نجوم دلتا للتجارة نلتزم بأعلى معايير الجودة والسرعة، حيث نعتمد على نظام لوجستي متكامل (Command & Control) لضمان وصول نخب المنتجات إليكم.

1. دورة حياة الطلب والجاهزية:
- الاستقبال: يتم استقبال الطلبات فوراً ومعالجتها عبر أقرب فرع لموقعكم.
- التجهيز والفرز: تخضع المنتجات لفرز دقيق للتأكد من مطابقتها لأعلى معايير الجودة.
- التعبئة والتغليف: نستخدم تغليفاً خاصاً مبرداً يحافظ على نضارة الخضروات والتمور.
- التوزيع الذكي: بمجرد الجاهزية، يتم إشعار أقرب مندوب متاح جغرافياً لموقع العميل لضمان التوصيل القياسي.

2. وقت استلام وتوصيل الطلب:
- يستغرق التجهيز الفني (الفرز والتغليف) ما بين 1 إلى 3 ساعات.
- نسعى لإيصال الطلب للعميل في وقت قياسي يتراوح بين 4 إلى 8 ساعات داخل المدن الرئيسية.
- يتم إشعار العميل وشركة الشحن والمناديب لحظياً في غضون ثوانٍ من خروج الشحنة.

3. التتبع والتحقق اللحظي:
- يمكن للعميل تتبع حركة المندوب عبر الخارطة التفاعلية في المتجر.
- يتم توثيق كافة العمليات بالنظام المحاسبي المتكامل لضمان دقة الفوترة والتحصيل.`,
    content_en: `At Delta Stars, we are committed to the highest standards of quality and speed. We rely on an integrated logistics system (Command & Control) to ensure our premium products reach you perfectly.

1. Order Lifecycle & Readiness:
- Reception: Orders are received instantly and processed via the nearest branch.
- Preparation & Sorting: Products undergo rigorous sorting to meet premium quality standards.
- Packaging: We use specialized refrigerated packaging to maintain freshness.
- Smart Distribution: Once ready, the geographically closest available driver is notified for record-time delivery.

2. Delivery Times:
- Technical preparation (sorting & packaging) takes 1 to 3 hours.
- We strive for record delivery times (4 to 8 hours) within major cities.
- Real-time notifications are sent to customers, shipping companies, and drivers within seconds of dispatch.

3. Monitoring & Documentation:
- Customers can track their delivery live via the interactive store map.
- All operations are documented in our integrated accounting system for accurate invoicing.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'returns',
    title_ar: 'سياسة الاستبدال والاسترجاع',
    title_en: 'Returns & Exchange Policy',
    content_ar: `نظراً لطبيعة المنتجات الطازجة (خضروات، فواكه، ورقيات)، فإننا نتبع سياسة صارمة لضمان سلامتكم:

1. المنتجات الطازجة:
- يتم الاسترجاع أو الاستبدال فوراً عند الاستلام في حال وجود تلف أو عدم مطابقة للمواصفات.
- لا يمكن استرجاع المنتجات الطازجة بعد مغادرة مندوب التوصيل لموقع العميل لأسباب تتعلق بالسلامة الغذائية.

2. التمور والمنتجات المغلفة:
- يمكن استبدالها أو استرجاعها خلال 3 أيام من تاريخ الاستلام بشرط أن تكون في حالتها الأصلية وبتغليفها الأصلية.

3. طريقة الاسترجاع:
- يتم التواصل مع خدمة العملاء عبر الواتساب أو الرقم الموحد.
- يتم إعادة المبلغ لنفس وسيلة الدفع المستخدمة خلال 7-14 يوم عمل.`,
    content_en: `Due to the nature of fresh products (vegetables, fruits, herbs), we follow a strict policy to ensure your safety:

1. Fresh Products:
- Returns or exchanges are handled immediately upon receipt in case of damage or non-conformity.
- Fresh products cannot be returned after the delivery representative leaves the customer's location for food safety reasons.

2. Dates and Packaged Products:
- Can be exchanged or returned within 3 days of receipt, provided they are in their original condition and packaging.

3. Return Process:
- Contact customer service via WhatsApp or the unified number.
- Refunds are processed to the original payment method within 7-14 business days.`,
    updatedAt: new Date().toISOString()
  }
];
