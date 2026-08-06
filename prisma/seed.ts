import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productsCount = await prisma.product.count();
  if (productsCount > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  let products = [];
  try {
    const fs = require('fs');
    const path = require('path');
    const productsData = fs.readFileSync(path.join(process.cwd(), 'processed_products.json'), 'utf8');
    products = JSON.parse(productsData);
    console.log(`Loaded ${products.length} products from processed_products.json`);
  } catch (error) {
    console.error('Failed to load products from processed_products.json, using fallback:', error);
    products = [
      {
        name_ar: "فطر شميجي بني تايلندي",
        name_en: "Brown Shmegey Mushroom Thailand",
        category: "vegetables",
        price: 48.0,
        image: "https://i.ibb.co/F41772NQ/Brown-shmegey-Mushroom.jpg",
        unit_ar: "كيلو",
        unit_en: "Kg",
        description_ar: "فطر شميجي بني طازج مستورد من تايلاند مثالي للوصفات الآسيوية، يتميز بنكهة ترابية غنية وقوام متماسك.",
        description_en: "Fresh brown shimeji mushrooms from Thailand perfect for Asian recipes, featuring a rich earthy flavor and firm texture.",
        origin_ar: "تايلاند",
        origin_en: "Thailand",
        features_ar: "طازج يومياً، غني بالفيتامينات، مثالي للطهي السريع",
        features_en: "Fresh daily, rich in vitamins, perfect for stir-fry",
        benefits_ar: "يعزز المناعة، مصدر ممتاز للبروتين النباتي، قليل السعرات الحرارية",
        benefits_en: "Boosts immunity, excellent source of plant protein, low in calories",
        stock_quantity: 500
      }
    ];
  }

  for (const product of products) {
    try {
      await prisma.product.create({
        data: product
      });
    } catch (e) {
      console.warn(`Failed to seed product ${product.name_ar}:`, e);
    }
  }

  const branchesCount = await prisma.branch.count();
  if (branchesCount === 0) {
    console.log('Seeding branches...');
    const branches = [
      { name_ar: 'الفرع الرئيسي - جدة', city: 'جدة' },
      { name_ar: 'فرع مكة المكرمة', city: 'مكة المكرمة' },
      { name_ar: 'فرع المدينة المنورة', city: 'المدينة المنورة' },
      { name_ar: 'فرع الرياض', city: 'الرياض' },
      { name_ar: 'فرع الدمام', city: 'الدمام' },
      { name_ar: 'فرع أبها', city: 'أبها' }
    ];

    for (const branch of branches) {
      await prisma.branch.create({
        data: branch
      }); 
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
