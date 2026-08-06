import { createClient } from '@supabase/supabase-js';
import { Blobs } from '@netlify/blobs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NETLIFY_BLOBS_TOKEN = process.env.NETLIFY_BLOBS_TOKEN;
const SITE_URL = process.env.SITE_URL;

async function backup() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !NETLIFY_BLOBS_TOKEN || !SITE_URL) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  // 1. جلب المنتجات من Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('🔄 Fetching products from Supabase...');
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Fetched ${products.length} products`);

  // 2. إضافة معلومات النسخة الاحتياطية
  const backupData = {
    products,
    backupTimestamp: new Date().toISOString(),
    source: 'Supabase',
    version: '1.0'
  };

  // 3. تخزين في Netlify Blobs
  try {
    const blobs = new Blobs({
      siteURL: SITE_URL,
      token: NETLIFY_BLOBS_TOKEN
    });
    await blobs.set('products_backup', JSON.stringify(backupData, null, 2));
    console.log('✅ Backup stored successfully in Netlify Blobs');
  } catch (err) {
    console.error('❌ Netlify Blobs error:', err.message);
    process.exit(1);
  }

  // 4. (اختياري) تخزين نسخة إضافية في ملف GitHub Artifact (كضمان إضافي)
  console.log('📦 Saving backup as artifact...');
  const fs = await import('fs');
  fs.writeFileSync('backup.json', JSON.stringify(backupData, null, 2));
}

backup().catch(console.error);