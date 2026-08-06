import { mockProducts } from '../src/components/lib/vip/products';
import * as fs from 'fs';
import * as path from 'path';

function escapeSQL(str: string | undefined | null): string {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function run() {
  const products = mockProducts;
  console.log(`Generating SQL seed for ${products.length} products...`);

  let sql = `-- Delta Stars Sovereign Product Seed File\n`;
  sql += `-- Auto-generated from frontend source for 100% data fidelity\n`;
  sql += `-- Total Products: ${products.length}\n\n`;
  sql += `INSERT INTO public.products (\n`;
  sql += `  id, name_ar, name_en, category, price, unit_ar, unit_en, origin_ar, origin_en,\n`;
  sql += `  images, description_ar, description_en,\n`;
  sql += `  rating, reviews, calories, stock, step, min_weight\n`;
  sql += `) VALUES\n`;

  const rows = products.map((p) => {
    const imagesArray = `ARRAY[${(p.gallery || [p.image]).map(img => `'${img}'`).join(', ')}]::TEXT[]`;
    return `  (${p.id},\n` +
           `   ${escapeSQL(p.name_ar)},\n` +
           `   ${escapeSQL(p.name_en)},\n` +
           `   ${escapeSQL(p.category)},\n` +
           `   ${p.price || 0.0},\n` +
           `   ${escapeSQL(p.unit_ar || 'حبة')},\n` +
           `   ${escapeSQL(p.unit_en || 'piece')},\n` +
           `   ${escapeSQL(p.origin_ar || 'إنتاج وطني')},\n` +
           `   ${escapeSQL(p.origin_en || 'Local')},\n` +
           `   ${imagesArray},\n` +
           `   ${escapeSQL(p.description_ar || '')},\n` +
           `   ${escapeSQL(p.description_en || '')},\n` +
           `   4.8,\n` +
           `   12,\n` +
           `   0,\n` +
           `   ${p.stock_quantity || 100},\n` +
           `   1,\n` +
           `   0.5)` ;
  });

  sql += rows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET\n' +
         '  name_ar = EXCLUDED.name_ar,\n' +
         '  name_en = EXCLUDED.name_en,\n' +
         '  category = EXCLUDED.category,\n' +
         '  price = EXCLUDED.price,\n' +
         '  unit_ar = EXCLUDED.unit_ar,\n' +
         '  unit_en = EXCLUDED.unit_en,\n' +
         '  origin_ar = EXCLUDED.origin_ar,\n' +
         '  origin_en = EXCLUDED.origin_en,\n' +
         '  images = EXCLUDED.images,\n' +
         '  description_ar = EXCLUDED.description_ar,\n' +
         '  description_en = EXCLUDED.description_en,\n' +
         '  stock = EXCLUDED.stock;\n';

  const outputDir = path.join(process.cwd(), 'الباك اند');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, '04_initial_seed_products.sql'), sql, 'utf8');
  console.log(`Successfully generated SQL seed file at: الباك اند/04_initial_seed_products.sql`);
}

run();
