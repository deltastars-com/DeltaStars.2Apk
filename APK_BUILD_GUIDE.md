# 📱 دليل بناء تطبيق نجوم دلتا

## Android APK/AAB

### المتطلبات
- Android Studio Flamingo أو أحدث
- JDK 17+
- Node.js 20+

### خطوات البناء

```bash
# 1. بناء الويب
npm run build:netlify

# 2. مزامنة مع Capacitor
npx cap sync android

# 3. فتح Android Studio
npx cap open android
```

### في Android Studio:
1. **Build → Generate Signed Bundle/APK**
2. اختر **Android App Bundle (AAB)** لـ Google Play
3. أو **APK** للتوزيع المباشر

### إنشاء Keystore (مرة واحدة فقط)
```bash
keytool -genkey -v \
  -keystore deltastars-release.jks \
  -alias deltastars \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### متطلبات Google Play
| الملف | الوصف |
|-------|-------|
| AAB | حجم max 150MB |
| App Icon | 512×512 PNG |
| Screenshots | 2+ لكل جهاز |
| Privacy Policy | https://deltastars.store/privacy |

---

## iOS IPA

### المتطلبات
- Mac مع Xcode 15+
- Apple Developer Account ($99/year)

```bash
# 1. بناء الويب
npm run build:netlify

# 2. مزامنة مع Capacitor
npx cap sync ios

# 3. فتح Xcode
npx cap open ios
```

### في Xcode:
1. **Product → Archive**
2. **Distribute App → App Store Connect**
3. اتبع الخطوات

---

## معرفات التطبيق
| | |
|--|--|
| **App ID (Android)** | `com.deltastars.store` |
| **Bundle ID (iOS)** | `com.deltastars.store` |
| **App Name** | نجوم دلتا |
| **Version** | 1.0.0 |
