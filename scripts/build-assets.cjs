const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Precise DS Logo SVG matching Page 5 of PDF
const dsLogoSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4AD235" />
      <stop offset="50%" stop-color="#1DAE22" />
      <stop offset="100%" stop-color="#086518" />
    </linearGradient>
    <linearGradient id="darkGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#117220" />
      <stop offset="100%" stop-color="#043A0C" />
    </linearGradient>
  </defs>

  <!-- Clean White Background -->
  <rect width="1024" height="1024" fill="#FFFFFF" />

  <g transform="translate(512, 420)">
    <!-- Top Leaf Arch -->
    <path d="M-120,-160 C-60,-240 60,-240 120,-160 C90,-130 -90,-130 -120,-160 Z" fill="url(#greenGrad)" />
    
    <!-- Pair of leaves on top of arch -->
    <path d="M-30,-220 C-60,-280 0,-300 0,-230 C0,-300 60,-280 30,-220 Z" fill="url(#greenGrad)" />

    <!-- Letter 'D' with leaf inside -->
    <path d="M-220,-80 L-100,-80 C-10,-80 40,-20 30,70 C20,150 -60,180 -150,180 L-220,180 Z M-170,-30 L-170,130 L-120,130 C-60,130 -20,100 -15,50 C-10,0 -50,-30 -110,-30 Z" fill="url(#darkGreenGrad)" />
    <!-- Leaf inside D -->
    <path d="M-150,10 C-90,-20 -50,60 -110,80 C-150,80 -160,30 -150,10 Z" fill="url(#greenGrad)" />
    <path d="M-150,10 Q-100,50 -110,80" stroke="#FFFFFF" stroke-width="4" fill="none" />

    <!-- Letter 'S' with leaf shapes -->
    <path d="M180,-70 C80,-90 50,0 120,40 C190,80 180,180 50,170 C0,165 -30,130 -20,100 C10,100 40,130 80,125 C120,120 130,70 70,40 C10,10 20,-120 150,-120 C200,-120 230,-90 220,-60 Z" fill="url(#darkGreenGrad)" />
    <!-- Leaf on S tip -->
    <path d="M170,130 C230,100 240,170 180,180 C130,180 140,140 170,130 Z" fill="url(#greenGrad)" />

    <!-- Additional side leaves -->
    <path d="M-280,30 C-340,0 -320,80 -250,70 C-240,40 -260,20 -280,30 Z" fill="url(#greenGrad)" />
  </g>

  <!-- Stars Line with 3 Green Stars -->
  <g transform="translate(512, 720)">
    <path d="M-420,-30 Q0,10 420,-30" fill="none" stroke="url(#darkGreenGrad)" stroke-width="6" />
    <!-- Center Star -->
    <polygon points="0,-45 8,-20 32,-20 12,-5 20,20 0,5 -20,20 -12,-5 -32,-20 -8,-20" fill="url(#darkGreenGrad)" />
    <!-- Left Star -->
    <polygon points="-360,-45 -353,-25 -330,-25 -347,-12 -341,8 -360,-4 -379,8 -373,-12 -390,-25 -367,-25" fill="url(#darkGreenGrad)" />
    <!-- Right Star -->
    <polygon points="360,-45 367,-25 390,-25 373,-12 379,8 360,-4 341,8 347,-12 330,-25 353,-25" fill="url(#darkGreenGrad)" />
  </g>

  <!-- Text DELTA STARS -->
  <text x="512" y="880" font-family="'Arial Black', 'Impact', sans-serif" font-size="118" font-weight="900" fill="#086518" text-anchor="middle" letter-spacing="6">DELTA STARS</text>
</svg>`;

// 2. Page 2 Luxury Official Splash Poster SVG matching Page 2 of PDF
const splashPosterSvg = `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#032612" />
      <stop offset="30%" stop-color="#084223" />
      <stop offset="70%" stop-color="#0B532C" />
      <stop offset="100%" stop-color="#02180B" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE58F" />
      <stop offset="35%" stop-color="#F59E0B" />
      <stop offset="70%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>
    <linearGradient id="goldBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#92400E" />
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064E3B" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)" />

  <!-- Geometric Islamic Arch Background Lines -->
  <path d="M100,500 C100,200 300,80 540,80 C780,80 980,200 980,500 L980,1840 L100,1840 Z" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.5" />
  <path d="M120,510 C120,220 310,100 540,100 C770,100 960,220 960,510 L960,1820 L120,1820 Z" fill="none" stroke="#34D399" stroke-width="2" opacity="0.3" />

  <!-- Top Stars Arch Header -->
  <g transform="translate(540, 160)" filter="url(#shadow)">
    <polygon points="0,-50 15,-15 50,-15 20,8 30,45 0,22 -30,45 -20,8 -50,-15 -15,-15" fill="url(#goldGrad)" />
    <polygon points="-140,-20 -128,5 -100,5 -122,22 -114,50 -140,32 -166,50 -158,22 -180,5 -152,5" fill="url(#goldGrad)" opacity="0.9" />
    <polygon points="140,-20 152,5 180,5 158,22 166,50 140,32 114,50 122,22 100,5 128,5" fill="url(#goldGrad)" opacity="0.9" />
    <polygon points="-270,20 -260,40 -238,40 -255,54 -248,76 -270,61 -292,76 -285,54 -302,40 -280,40" fill="url(#goldGrad)" opacity="0.8" />
    <polygon points="270,20 280,40 302,40 285,54 292,76 270,61 248,76 255,54 238,40 260,40" fill="url(#goldGrad)" opacity="0.8" />
  </g>

  <!-- Hanging Lanterns -->
  <g transform="translate(140, 380)" filter="url(#shadow)">
    <line x1="0" y1="-200" x2="0" y2="0" stroke="url(#goldGrad)" stroke-width="3" />
    <path d="M-25,0 L25,0 L35,50 L0,90 L-35,50 Z" fill="url(#goldBevel)" />
    <circle cx="0" cy="45" r="15" fill="#FFFBEB" filter="url(#glow)" />
  </g>
  <g transform="translate(940, 380)" filter="url(#shadow)">
    <line x1="0" y1="-200" x2="0" y2="0" stroke="url(#goldGrad)" stroke-width="3" />
    <path d="M-25,0 L25,0 L35,50 L0,90 L-35,50 Z" fill="url(#goldBevel)" />
    <circle cx="0" cy="45" r="15" fill="#FFFBEB" filter="url(#glow)" />
  </g>

  <!-- Fresh Fruits, Veggies & Dates Basket Illustration Artwork -->
  <g transform="translate(540, 360)" filter="url(#shadow)">
    <ellipse cx="0" cy="120" rx="280" ry="70" fill="#042913" opacity="0.8" />
    <!-- Broccoli / Greens -->
    <circle cx="-180" cy="20" r="65" fill="#15803D" />
    <circle cx="-130" cy="-10" r="75" fill="#22C55E" />
    <!-- Carrots -->
    <polygon points="-80,40 -40,-60 -10,-50 -60,60" fill="#F97316" />
    <polygon points="-50,50 -10,-50 20,-40 -30,70" fill="#FB923C" />
    <!-- Peppers & Apples -->
    <circle cx="20" cy="0" r="55" fill="#EF4444" />
    <circle cx="90" cy="10" r="60" fill="#EAB308" />
    <circle cx="160" cy="30" r="50" fill="#84CC16" />
    <!-- Grapes -->
    <circle cx="210" cy="70" r="25" fill="#A855F7" />
    <circle cx="235" cy="90" r="22" fill="#9333EA" />
    <circle cx="190" cy="100" r="24" fill="#7E22CE" />
    <circle cx="220" cy="120" r="20" fill="#6B21A8" />
    <!-- Saudi Dates Heap -->
    <ellipse cx="-30" cy="90" rx="35" ry="22" fill="#78350F" transform="rotate(-15 -30 90)" />
    <ellipse cx="30" cy="95" rx="36" ry="22" fill="#92400E" transform="rotate(10 30 95)" />
    <ellipse cx="-80" cy="100" rx="34" ry="20" fill="#B45309" transform="rotate(-25 -80 100)" />
    <ellipse cx="80" cy="105" rx="35" ry="21" fill="#78350F" transform="rotate(20 80 105)" />
    <ellipse cx="0" cy="110" rx="38" ry="23" fill="#451A03" />
  </g>

  <!-- 3D Gold & Emerald DELTA STARS Title -->
  <g transform="translate(540, 680)" filter="url(#shadow)">
    <text x="0" y="0" font-family="'Arial Black', 'Impact', sans-serif" font-size="115" font-weight="900" fill="#02180B" text-anchor="middle" letter-spacing="4">DELTA</text>
    <text x="0" y="-6" font-family="'Arial Black', 'Impact', sans-serif" font-size="115" font-weight="900" fill="url(#goldBevel)" text-anchor="middle" letter-spacing="4">DELTA</text>

    <text x="0" y="120" font-family="'Arial Black', 'Impact', sans-serif" font-size="115" font-weight="900" fill="#02180B" text-anchor="middle" letter-spacing="4">STARS</text>
    <text x="0" y="114" font-family="'Arial Black', 'Impact', sans-serif" font-size="115" font-weight="900" fill="url(#goldBevel)" text-anchor="middle" letter-spacing="4">STARS</text>
  </g>

  <!-- Gold Ribbon with Arabic Calligraphy -->
  <g transform="translate(540, 940)" filter="url(#shadow)">
    <path d="M-420,-20 L420,-20 C450,-20 460,30 430,60 L380,100 L430,140 C460,170 450,200 420,200 L-420,200 C-450,200 -460,170 -430,140 L-380,100 L-430,60 C-460,30 -450,-20 -420,-20 Z" fill="url(#ribbonGrad)" stroke="url(#goldGrad)" stroke-width="6" />
    <text x="0" y="125" font-family="'Tajawal', 'Traditional Arabic', sans-serif" font-size="76" font-weight="900" fill="#FFE58F" text-anchor="middle">شركة نجوم دلتا للتجارة</text>
  </g>

  <!-- Marble Texture Container for Saudi Branches -->
  <g transform="translate(540, 1420)" filter="url(#shadow)">
    <rect x="-380" y="-220" width="760" height="440" rx="30" fill="#E2E8F0" stroke="url(#goldGrad)" stroke-width="6" opacity="0.95" />
    <rect x="-360" y="-200" width="720" height="400" rx="20" fill="none" stroke="#0B532C" stroke-width="3" opacity="0.4" />

    <text x="0" y="-110" font-family="'Tajawal', 'Arial', sans-serif" font-size="56" font-weight="900" fill="#78350F" text-anchor="middle">Jeddah  |  Riyadh</text>
    <line x1="-260" y1="-60" x2="260" y2="-60" stroke="#B45309" stroke-width="3" opacity="0.5" />

    <text x="0" y="10" font-family="'Tajawal', 'Arial', sans-serif" font-size="56" font-weight="900" fill="#78350F" text-anchor="middle">Madinah  |  Makkah</text>
    <line x1="-260" y1="60" x2="260" y2="60" stroke="#B45309" stroke-width="3" opacity="0.5" />

    <text x="0" y="130" font-family="'Tajawal', 'Arial', sans-serif" font-size="56" font-weight="900" fill="#78350F" text-anchor="middle">Abha  |  Dammam</text>
  </g>

  <!-- Quality Tagline -->
  <text x="540" y="1820" font-family="'Tajawal', 'Arial', sans-serif" font-size="36" font-weight="800" fill="#34D399" text-anchor="middle">شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة</text>
</svg>`;

async function buildOfficialAssets() {
  const publicDir = path.join(process.cwd(), 'public');

  // Generate PNGs
  await sharp(Buffer.from(dsLogoSvg)).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(Buffer.from(dsLogoSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(Buffer.from(dsLogoSvg)).resize(1024, 1024).png().toFile(path.join(publicDir, 'icon-1024.png'));
  await sharp(Buffer.from(dsLogoSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512-maskable.png'));
  await sharp(Buffer.from(dsLogoSvg)).resize(1024, 1024).png().toFile(path.join(publicDir, 'icon-1024-polished.png'));
  await sharp(Buffer.from(dsLogoSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'logo.png'));
  await sharp(Buffer.from(dsLogoSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'official_logo.png'));

  // Generate JPGs for Splash Banners matching PDF Page 2
  await sharp(Buffer.from(splashPosterSvg)).resize(1080, 1920).jpeg({ quality: 95 }).toFile(path.join(publicDir, 'splash_official_banner.jpg'));
  await sharp(Buffer.from(splashPosterSvg)).resize(1080, 1920).jpeg({ quality: 95 }).toFile(path.join(publicDir, 'official_splash.jpg'));
  await sharp(Buffer.from(splashPosterSvg)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 92 }).toFile(path.join(publicDir, 'opengraph.jpg'));

  console.log('✅ ALL OFFICIAL BRAND ASSETS SUCCESSFULLY GENERATED AND SAVED!');
}

buildOfficialAssets().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
