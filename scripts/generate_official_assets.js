import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. Pristine Square Logo SVG (1024x1024)
const squareLogoSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="50%" stop-color="#16a34a" />
      <stop offset="100%" stop-color="#0e5e26" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0e5e26" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Pure White Card Background -->
  <rect width="1024" height="1024" rx="48" fill="#ffffff"/>

  <!-- Outer Frame subtle gold line -->
  <rect x="24" y="24" width="976" height="976" rx="36" fill="none" stroke="#facc15" stroke-width="4" opacity="0.3"/>

  <g filter="url(#shadow)">
    <!-- Bag Handle Arc -->
    <path d="M 384 370 C 384 240, 640 240, 640 370" stroke="url(#greenGrad)" stroke-width="36" stroke-linecap="round" fill="none"/>
    
    <!-- Sprout leaves on handle -->
    <path d="M 512 245 C 475 210, 465 165, 512 145 C 559 165, 549 210, 512 245 Z" fill="#22c55e"/>
    <path d="M 512 245 C 549 210, 559 165, 512 145 C 465 165, 475 210, 512 245 Z" fill="#15803d"/>
    <circle cx="512" cy="245" r="16" fill="url(#goldGrad)"/>

    <!-- Monogram "D" -->
    <g transform="translate(30, 0)">
      <path d="M 380 390 L 380 620 C 380 665, 435 675, 475 640 C 515 605, 535 540, 535 490 C 535 430, 490 380, 420 380 Z" stroke="url(#greenGrad)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 405 585 C 405 470, 495 450, 505 515 C 505 565, 435 605, 405 585 Z" fill="#22c55e"/>
      <path d="M 360 480 C 310 480, 290 530, 330 560 C 370 590, 370 520, 360 480 Z" fill="#15803d"/>
    </g>

    <!-- Monogram "S" -->
    <g transform="translate(110, 0)">
      <path d="M 585 400 C 535 400, 525 460, 565 480 C 605 500, 605 565, 565 585 C 525 605, 515 555, 515 555" stroke="url(#greenGrad)" stroke-width="40" stroke-linecap="round" fill="none"/>
      <path d="M 585 400 C 625 390, 645 425, 625 460 C 605 490, 575 440, 585 400 Z" fill="#22c55e"/>
      <path d="M 515 555 C 475 565, 455 600, 495 620 C 535 640, 530 585, 515 555 Z" fill="#15803d"/>
    </g>

    <!-- Stars Arc Line -->
    <path d="M 200 685 Q 512 645 824 685" stroke="url(#greenGrad)" stroke-width="14" stroke-linecap="round" fill="none"/>
    
    <!-- Center Star -->
    <polygon points="512,610 523,634 548,634 528,650 536,674 512,658 488,674 496,650 476,634 501,634" fill="url(#goldGrad)"/>
    <!-- Left Star -->
    <polygon points="210,665 218,683 238,683 222,695 228,713 210,701 192,713 198,695 182,683 202,683" fill="url(#goldGrad)"/>
    <!-- Right Star -->
    <polygon points="814,665 822,683 842,683 826,695 832,713 814,701 796,713 802,695 786,683 806,683" fill="url(#goldGrad)"/>

    <!-- Text DELTA STARS -->
    <text x="512" y="795" text-anchor="middle" fill="#0e5e26" font-size="92" font-weight="900" font-family="'Tajawal', 'Inter', 'Segoe UI', sans-serif" letter-spacing="8">DELTA STARS</text>

    <!-- Text Arabic -->
    <text x="512" y="875" text-anchor="middle" fill="#16a34a" font-size="54" font-weight="800" font-family="'Tajawal', 'Segoe UI', sans-serif">شركة نجوم دلتا للتجارة</text>
  </g>
</svg>
`;

// 2. Official Splash Portrait Banner SVG (1080x1920)
const splashBannerSvg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#072b12" />
      <stop offset="40%" stop-color="#0e5e26" />
      <stop offset="80%" stop-color="#063815" />
      <stop offset="100%" stop-color="#021708" />
    </linearGradient>
    <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ca8a04" />
      <stop offset="30%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#facc15" />
      <stop offset="70%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" opacity="0.12" />
      <stop offset="100%" stop-color="#ffffff" opacity="0.04" />
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bgBg)" />

  <!-- Islamic Lattice Watermark -->
  <g opacity="0.08" stroke="#facc15" stroke-width="2" fill="none">
    <pattern id="lattice" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 120 60 L 60 120 L 0 60 Z" />
      <circle cx="60" cy="60" r="30" />
    </pattern>
    <rect width="1080" height="1920" fill="url(#lattice)" />
  </g>

  <!-- Golden Stars Sky -->
  <g fill="url(#goldRibbon)" filter="url(#goldGlow)">
    <polygon points="540,160 555,200 595,200 562,225 575,265 540,240 505,265 518,225 485,200 525,200" />
    <polygon points="320,240 330,270 360,270 335,288 345,318 320,300 295,318 305,288 280,270 310,270" opacity="0.8" />
    <polygon points="760,240 770,270 800,270 775,288 785,318 760,300 735,318 745,288 720,270 750,270" opacity="0.8" />
    <polygon points="200,340 208,362 230,362 212,376 218,398 200,384 182,398 188,376 170,362 192,362" opacity="0.6" />
    <polygon points="880,340 888,362 910,362 892,376 898,398 880,384 862,398 868,376 850,362 872,362" opacity="0.6" />
  </g>

  <!-- Produce Garland Illustration Placeholder Circle -->
  <g transform="translate(540, 520)">
    <!-- White Card Base for Logo -->
    <rect x="-240" y="-240" width="480" height="480" rx="40" fill="#ffffff" stroke="url(#goldRibbon)" stroke-width="8" filter="url(#goldGlow)" />
    
    <!-- Embedded Logo Content inside Card -->
    <g transform="scale(0.42) translate(-512, -512)">
      <!-- Bag Handle -->
      <path d="M 384 370 C 384 240, 640 240, 640 370" stroke="#16a34a" stroke-width="36" stroke-linecap="round" fill="none"/>
      <path d="M 512 245 C 475 210, 465 165, 512 145 C 559 165, 549 210, 512 245 Z" fill="#22c55e"/>
      <circle cx="512" cy="245" r="16" fill="#facc15"/>
      <!-- Monogram D -->
      <path d="M 410 390 L 410 620 C 410 665, 465 675, 505 640 C 545 605, 565 540, 565 490 C 565 430, 520 380, 450 380 Z" stroke="#0e5e26" stroke-width="40" stroke-linecap="round" fill="none"/>
      <path d="M 435 585 C 435 470, 525 450, 535 515 C 535 565, 465 605, 435 585 Z" fill="#22c55e"/>
      <!-- Monogram S -->
      <path d="M 695 400 C 645 400, 635 460, 675 480 C 715 500, 715 565, 675 585 C 635 605, 625 555, 625 555" stroke="#0e5e26" stroke-width="40" stroke-linecap="round" fill="none"/>
      <!-- Stars Arc -->
      <path d="M 200 685 Q 512 645 824 685" stroke="#16a34a" stroke-width="14" stroke-linecap="round" fill="none"/>
      <polygon points="512,610 523,634 548,634 528,650 536,674 512,658 488,674 496,650 476,634 501,634" fill="#facc15"/>
    </g>
  </g>

  <!-- Title DELTA STARS -->
  <text x="540" y="880" text-anchor="middle" fill="url(#goldRibbon)" font-size="108" font-weight="900" font-family="'Tajawal', sans-serif" letter-spacing="10" filter="url(#goldGlow)">DELTA STARS</text>

  <!-- Banner Gold Ribbon with Arabic Name -->
  <g transform="translate(540, 1010)">
    <path d="M -420 -60 L 420 -60 L 450 0 L 420 60 L -420 60 L -450 0 Z" fill="url(#goldRibbon)" />
    <text x="0" y="18" text-anchor="middle" fill="#072b12" font-size="52" font-weight="900" font-family="'Tajawal', sans-serif">شركة نجوم دلتا للتجارة</text>
  </g>

  <!-- Slogan Card -->
  <rect x="120" y="1130" width="840" height="180" rx="32" fill="url(#cardGrad)" stroke="url(#goldRibbon)" stroke-width="2" />
  <text x="540" y="1200" text-anchor="middle" fill="#ffffff" font-size="38" font-weight="bold" font-family="'Tajawal', sans-serif">شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة</text>
  <text x="540" y="1260" text-anchor="middle" fill="#fef08a" font-size="30" font-weight="bold" font-family="'Tajawal', sans-serif">فخورون بخدمتكم في كافة أنحاء المملكة العربية السعودية</text>

  <!-- Branches Card -->
  <rect x="120" y="1350" width="840" height="420" rx="36" fill="#041f0d" stroke="#facc15" stroke-width="3" opacity="0.9" />
  <text x="540" y="1420" text-anchor="middle" fill="url(#goldRibbon)" font-size="38" font-weight="900" font-family="'Tajawal', sans-serif">فروعنا الستة بالمملكة</text>

  <!-- Branch Pills -->
  <g font-size="32" font-weight="bold" font-family="'Tajawal', sans-serif" text-anchor="middle">
    <!-- Row 1 -->
    <rect x="180" y="1470" width="320" height="90" rx="24" fill="#0d5c22" stroke="#22c55e" stroke-width="2"/>
    <text x="340" y="1528" fill="#ffffff">جدة  |  Riyadh</text>

    <rect x="580" y="1470" width="320" height="90" rx="24" fill="#0d5c22" stroke="#22c55e" stroke-width="2"/>
    <text x="740" y="1528" fill="#ffffff">الرياض  |  Jeddah</text>

    <!-- Row 2 -->
    <rect x="180" y="1590" width="320" height="90" rx="24" fill="#0d5c22" stroke="#22c55e" stroke-width="2"/>
    <text x="340" y="1648" fill="#ffffff">مكة المكرمة  |  Makkah</text>

    <rect x="580" y="1590" width="320" height="90" rx="24" fill="#0d5c22" stroke="#22c55e" stroke-width="2"/>
    <text x="740" y="1648" fill="#ffffff">المدينة المنورة  |  Madinah</text>

    <!-- Row 3 -->
    <rect x="180" y="1710" width="320" height="40" rx="16" fill="none"/>
    <text x="340" y="1738" fill="#fef08a" font-size="28">أبها  |  Abha</text>

    <rect x="580" y="1710" width="320" height="40" rx="16" fill="none"/>
    <text x="740" y="1738" fill="#fef08a" font-size="28">الدمام  |  Dammam</text>
  </g>
</svg>
`;

async function main() {
  console.log('🚀 Starting generation of official pristine Delta Stars image assets...');

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Save Favicon SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), squareLogoSvg);

  // 2. Generate Square Logo Images (1024, 512, 192)
  const sqBuffer = Buffer.from(squareLogoSvg);

  await sharp(sqBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.join(publicDir, 'official_logo.png'));
  await sharp(sqBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.join(publicDir, 'logo.png'));
  await sharp(sqBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.join(publicDir, 'icon-1024.png'));
  await sharp(sqBuffer).resize(1024, 1024).png({ quality: 100 }).toFile(path.join(publicDir, 'icon-1024-polished.png'));

  await sharp(sqBuffer).resize(512, 512).png({ quality: 100 }).toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(sqBuffer).resize(512, 512).png({ quality: 100 }).toFile(path.join(publicDir, 'icon-512-maskable.png'));

  await sharp(sqBuffer).resize(192, 192).png({ quality: 100 }).toFile(path.join(publicDir, 'icon-192.png'));

  console.log('✅ Generated all square logo PNGs (official_logo.png, logo.png, icon-1024, icon-512, icon-192)');

  // 3. Generate Banners & Splash JPGs (1080x1920)
  const spBuffer = Buffer.from(splashBannerSvg);

  await sharp(spBuffer).resize(1080, 1920).jpeg({ quality: 95 }).toFile(path.join(publicDir, 'splash_official_banner.jpg'));
  await sharp(spBuffer).resize(1080, 1920).jpeg({ quality: 95 }).toFile(path.join(publicDir, 'official_splash.jpg'));

  // 4. Generate OpenGraph Banner (1200x630)
  await sharp(sqBuffer)
    .resize(1200, 630, { fit: 'contain', background: { r: 13, g: 92, b: 38, alpha: 1 } })
    .jpeg({ quality: 95 })
    .toFile(path.join(publicDir, 'opengraph.jpg'));

  console.log('✅ Generated splash, banners, and opengraph images!');
}

main().catch(err => {
  console.error('❌ Error generating assets:', err);
  process.exit(1);
});
