# 📘 ملف الإدارة والتشغيل — التوقيع والتوثيق والملكية والإصدارات

**نجوم دلتا للتجارة (Delta Stars Trading Co.)** — دليل التنفيذ الدقيق للتوقيع والرفع للمتاجر والإدارة التشغيلية.

> ⚠️ **قاعدة ذهبية:** مفتاح التوقيع (Keystore) والمفاتيح السرية **لا تُرفع أبداً إلى المستودع** — تُحفظ في المتغيرات السرية لـ GitHub Actions وCodemagic فقط، مع نسخة احتياطية في مكان آمن (مدير كلمات مرور أو خزنة مشفرة).

---

## 1. 🏷️ الهوية والملكية الموحدة

| العنصر | القيمة |
|:---|:---|
| اسم التطبيق | نجوم دلتا — Delta Stars |
| معرّف حزمة Android | `com.deltastars.store` |
| Bundle ID iOS | `com.deltastars.store` |
| الإصدار الحالي | `1.0.0` (versionCode 1) |
| الشركة | شركة نجوم دلتا للتجارة |
| المطوّر / المالك | علي الدحان (Ali Al-Dahan) |
| البريد الرسمي | `INFO@DELTASTARS-KSA.COM` |
| الموقع | `https://deltastars.store` |
| رابط سياسة الخصوصية | `https://deltastars.store/privacy-policy` |

---

## 2. 🤖 التوقيع على أندرويد (Keystore)

### 2.1 إنشاء المفتاح (مرة واحدة)

```bash
keytool -genkey -v \
  -keystore deltastars-release.jks \
  -alias deltastars \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

عند الطلب أدخل: الاسم `Delta Stars Trading Co.`، التنظيم، المدينة `Jeddah`، الدولة `SA`، ثم **كلمتي مرور قويتين** (كلمة المستودع `storePassword` وكلمة المفتاح `keyPassword` — يُفضّل جعلهما متطابقتين لتبسيط الإدارة، لكن ليس إجبارياً).

### 2.2 تجهيز المفتاح للرفع إلى السيرفرات السرية

```bash
# تحويل المفتاح إلى base64 (يُرفع نصياً في المتغيرات السرية)
base64 -w 0 deltastars-release.jks > deltastars-release.jks.b64
```

### 2.3 مكان تخزين المفاتيح

| النظام | المتغيرات المطلوبة |
|:---|:---|
| **GitHub Actions** (إعدادات المستودع → Secrets and variables → Actions) | `KEYSTORE_BASE64` (نص base64)، `KEYSTORE_PASSWORD`، `KEY_ALIAS` (= `deltastars`)، `KEY_PASSWORD` |
| **Codemagic** (إعدادات التطبيق → Environment variables → مجموعة `deltastars_android`) | `CM_KEYSTORE` (نص base64)، `CM_KEYSTORE_PASSWORD`، `CM_KEY_ALIAS`، `CM_KEY_PASSWORD` |
| **Google Play Upload** (Codemagic) | `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (JSON كامل لحساب الخدمة) |

كيفية الربط في `build.gradle` (مطبّقة بالفعل): يقرأ البناء `KEYSTORE_PATH / KEYSTORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD` كـ Gradle properties تُمرَّر من CI:

```bash
./gradlew assembleRelease \
  -PKEYSTORE_PATH=/path/keystore.jks \
  -PKEYSTORE_PASSWORD="..." \
  -PKEY_ALIAS=deltastars \
  -PKEY_PASSWORD="..."
```

### 2.4 🔑 تغيير كلمة مرور التوقيع (بدقة، خطوة بخطوة)

> مطلوب فقط إذا نسيت كلمة المرور أو قررت تغييرها. لا يمكن تغيير كلمة مرور مفتاح موجود — الأسلوب المعتمد: **إنشاء مفتاح جديد بنفس الاسم المستعار** ثم تحديث المتغيرات السرية.

1. **أنشئ مفتاحاً جديداً** (بنفس `-alias deltastars` حتى لا يتغير شيء في الكود):
   ```bash
   keytool -genkey -v \
     -keystore deltastars-release-v2.jks \
     -alias deltastars \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **ألغِ المفتاح القديم** (اختياري) عبر:
   ```bash
   keytool -delete -alias deltastars -keystore deltastars-release.jks
   ```
3. **حدّث السر في GitHub Actions**:
   - Settings → Secrets and variables → Actions → عدّل `KEYSTORE_BASE64` بقيمة `base64 -w 0 deltastars-release-v2.jks` الجديدة، وعدّل `KEYSTORE_PASSWORD` و`KEY_PASSWORD` بكلمتي المرور الجديدتين.
4. **حدّث السر في Codemagic**:
   - التطبيق → Environment variables → مجموعة `deltastars_android` → عدّل `CM_KEYSTORE` / `CM_KEYSTORE_PASSWORD` / `CM_KEY_PASSWORD`.
5. **احفظ النسخة الاحتياطية الجديدة** في مكان آمن خارج المستودع، وامسح الملفات المؤقتة من جهازك بعد التحديث.
6. **جرّب البناء**: ارفع tag جديد (`v1.0.1`) أو شغّل سير العمل يدوياً (`Actions → Release APK / AAB → Run workflow`) وتأكد من نجاح خطوة التوقيع.

> ℹ️ **Google Play App Signing:** عند الرفع الأول يستخدم جوجل مفتاح "upload key" لتوقيع الأصلي. إذا فُقد مفتاح الرفع يمكنك طلب إعادة تعيينه من **Play Console → Setup → App signing** دون فقدان التطبيق. المفتاح المفقود يُستبدل، لكن احتفظ بالمفتاح الأصلي دائماً.

---

## 3. 🍎 التوقيع على iOS (Apple)

### 3.1 مفتاح API للتكامل الآلي مع App Store Connect

1. افتح [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access → Integrations → App Store Connect API**.
2. أنشئ مفتاحاً جديداً (اختر دور **App Manager**) وحمّل ملف `AuthKey_XXXXXXXXXX.p8`.
3. سجّل القيم الثلاث في Codemagic مجموعة `deltastars_ios`:
   - `APP_STORE_CONNECT_ISSUER_ID` (من صفحة API نفسها)
   - `APP_STORE_CONNECT_KEY_IDENTIFIER` (المعرّف `XXXXXXXXXX`)
   - `APP_STORE_CONNECT_PRIVATE_KEY` (نص ملف `.p8` كاملاً)

### 3.2 الشهادات وملفات التعريف

- سير عمل Codemagic يستخدم `app-store-connect fetch-signing-files` لجلب الشهادات تلقائياً، أو يمكنك في Xcode: **Signing & Capabilities → اختيار فريق المطوّرين** (يتطلب حساب Apple Developer مدفوع).
- `NSFaceIDUsageDescription` مضافة مسبقاً في `Info.plist` (مطلوبة لتفعيل Face ID).

### 3.3 الرفع اليدوي

```bash
npx cap sync ios
npx cap open ios   # ثم Product → Archive → Distribute App → App Store Connect (TestFlight)
```

---

## 4. 🛒 خطوات الرفع إلى Google Play Console

1. **إنشاء التطبيق**: Play Console → Create app → الاسم `نجوم دلتا` + الحزمة `com.deltastars.store`.
2. **إعداد التطبيق**: املأ نموذج البيانات (Data Safety) كما في `store/playstore-listing.md`، وسياسة الخصوصية = `https://deltastars.store/privacy-policy`.
3. **إصدار الاختبار**: Production → Create new release → ارفع `app-release.aab` (من GitHub Release أو Codemagic).
4. **خدمة الحساب للرفع الآلي** (اختياري): Play Console → Setup → API access → Create service account → حمّل JSON في `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`.

---

## 5. 🛍️ خطوات الرفع إلى App Store Connect

1. App Store Connect → My Apps → + → New App → الحزمة `com.deltastars.store`.
2. **App Information**: حدد الفئة (Food & Drink) + سياسة الخصوصية URL.
3. ارفع الـ IPA عبر Codemagic (TestFlight ثم Production)، واملأ بيانات النموذج في `store/appstore-listing.md`.

---

## 6. 📦 إدارة الإصدارات (Versioning) والتحميل المباشر من المستودع

- **زيادة الإصدار قبل كل رفع**:
  ```bash
  npm run version:patch   # 1.0.0 → 1.0.1 (يحدّث package.json وversion.json)
  npm run version:minor
  npm run version:major
  ```
- **وضع علامة (Tag) لإنشاء Release تلقائي** يحتوي APK + AAB جاهزين للتحميل المباشر:
  ```bash
  git tag v1.0.1 && git push origin v1.0.1
  ```
  سيشغّل سير العمل `.github/workflows/release-apk.yml` وينشئ إصداراً في GitHub يحتوي الملفات الجاهزة.
- ملاحظة أندرويد: `versionCode` الحالي `1` في `android/app/build.gradle` — **يجب زيادته يدوياً** عند كل رفع لاحق (أو أضِفه لنفس السكربت).

---

## 7. 🔄 التحديثات التلقائية والاستقرار

| الآلية | الملف | الوصف |
|:---|:---|:---|
| تحديث تلقائي للتبعيات | `.github/dependabot.yml` | أسبوعياً لـ npm + GitHub Actions + Gradle |
| تحديث تلقائي للتطبيق | `src/utils/UpdateManager.ts` | يفحص `version.json` كل 120 ثانية ويعيد تحميل أحدث نسخة |
| استرداد تلقائي من الأخطاء | `index.html` + `ErrorBoundary.tsx` | كشف الأخطاء ومسح الكاش وإعادة الإقلاع |
| فحص صحة الأنظمة | `/api/health/system` + `systemHealth.ts` | حالة بوابات الدفع والرسائل والذكاء الاصطناعي |

---

## 8. 🛡️ الأمان والحماية

- **CSP صارمة** في `_headers` + `netlify.toml` + `index.html` (احتياطي `<meta>`).
- **HSTS** (`max-age=63072000; preload`) + **X-Frame-Options: DENY** + **nosniff** + **Referrer-Policy**.
- **Permissions-Policy** تقيّد الوصول إلى الكاميرا/الميكروفون/الموقع.
- **التحقق الحيوي**: WebAuthn على الويب + `@aparajita/capacitor-biometric-auth` أصلي في التطبيق (بصمة/وجه حقيقي).
- **كلمات مرور اللوحات**: خزنة SHA-256 + إجبار تغيير كلمة المرور الأولية.
- **الدفع**: بوابة Moyasar بحقول معزولة — لا تُخزَّن بيانات البطاقات.
- الإبلاغ عن الثغرات: `SECURITY.md` + `public/.well-known/security.txt`.

---

## 9. ✅ قائمة الفحص النهائية قبل الرفع

- [ ] التطبيق يُبنى بنجاح (web + APK/AAB + IPA)
- [ ] التوقيع يعمل من المتغيرات السرية (جرّب release build)
- [ ] سياسة الخصوصية منشورة ومربوطة في المتجرين
- [ ] Data Safety في Play Console مكتمل
- [ ] لقطات الشاشة بالمقاسات المطلوبة (انظر `store/screenshots-guide.md`)
- [ ] `versionCode`/`versionName` محدّثان
- [ ] جميع مفاتيح البيئة موجودة في لوحة Freebuff/CI (Supabase, Firebase, Gemini, Moyasar, Authentica, Maps)

---

*© 2026 شركة نجوم دلتا للتجارة — جميع الحقوق محفوظة.*
