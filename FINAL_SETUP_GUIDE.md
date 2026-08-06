# Delta Stars - Final Setup & Deployment Guide 🚀

This guide provides the final steps to make your "Delta Stars" store fully operational on your direct Supabase instance and build the APK/iOS apps.

## 1. Supabase Core Setup 🛠️

Ensure your Supabase project is configured with the following:

### Database Schema
Run the migration script found in `/supabase/migrations/20250405_initial_schema.sql` inside the **Supabase SQL Editor**.

### Enable Real-time (CRITICAL for Tracking)
Run this SQL command in your Supabase SQL Editor:
```sql
-- Enable Realtime for key tables
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.drivers;
alter publication supabase_realtime add table public.shipments;
```

### Environment Variables
Update your local `.env` file and your hosting provider (e.g., Netlify/Vercel) with:
- `VITE_SUPABASE_URL`: `https://rgusisancfcdabfnfwoy.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: (Your Project Anon Key)
- `VITE_GEMINI_KEY`: (Your Gemini AI Key)
- `VITE_MOYASAR_PUBLISHABLE_KEY`: (Your Moyasar Test/Live Key)

## 2. Supabase Edge Functions 🌩️

Deploy the edge functions located in `/supabase/functions/` using the Supabase CLI:
```bash
supabase functions deploy payment-webhook
supabase functions deploy create-order
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy update-driver-location
```
*Note: Ensure you set the `SUPABASE_SERVICE_ROLE_KEY` and `MOYASAR_SECRET_KEY` in your Supabase project settings.*

## 3. Mobile App Build (APK/IPA) 📱

Your project is already configured with **Capacitor**. To build the native apps:

### Android (APK)
1. Run `npm run cap:build` to build the web assets and sync with Android.
2. Open the project in Android Studio: `npm run cap:open:android`.
3. **CRITICAL**: Download your `google-services.json` from your Firebase project and place it in `{project_root}/android/app/`.
4. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

### iOS
1. Run `npm run cap:sync`.
2. Open in Xcode: `npm run cap:open:ios`.
3. Configure your Signing & Capabilities.
4. Build and Archive for App Store.

## 4. Smart Assistant "Oday" 🤖
The assistant is now fully integrated with the **Gemini 1.5 Flash** model and uses **RAG (Retrieval-Augmented Generation)** to fetch real-time product prices from your Supabase database.

## 5. Branch Management
You can manage the 6 main branches (Riyadh, Jeddah, Makkah, Medina, Abha, Dammam) directly from the **Admin Dashboard** under the "Branches" section.

---
**Delta Stars Trading Co.**
*Your partner for high-quality fruits and vegetables in KSA.*
