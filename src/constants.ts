// @ts-nocheck
/**
 * Delta Stars Sovereign Constants v76.0
 * المركز الرئيسي لجميع ثوابت النظام لضمان التزامن الكامل.
 */

// Category cards render at ~81x81 CSS px — requesting the full original
// Google Drive image (often 1MB+ each) for that was the single biggest
// cause of the low PageSpeed score (10MB+ of unnecessarily large images,
// 21s LCP). Google's own lh3.googleusercontent.com CDN supports an
// on-the-fly resize suffix (=w{px}-h{px}), so we ask for a 2x-retina
// 200x200 thumbnail instead — same visual quality, ~98% smaller download.
const getThumb = (id: string, size: number = 200) =>
  `https://lh3.googleusercontent.com/d/${id}=w${size}-h${size}`;

export const SYSTEM_CONFIG = {
  BRAND_NAME: "نجوم دلتا للتجارة",
  BRAND_NAME_EN: "Delta Stars Trading",
  SLOGAN: "شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة",
  SLOGAN_EN: "Your Ideal Partner for High Quality Vegetables, Fruits and Dates",
  PRIMARY_COLOR: "#0e5e26",
  PRIMARY_LIGHT: "#1fa247",
  PRIMARY_DARK: "#073f18",
  SECONDARY_COLOR: "#ca8a04", // Gold
  SECONDARY_DARK: "#a16207",
  DARK_BLACK: "#0a4a1d",
  APP_BG: "#f8fafc", // slate-50
  BANNER_URL: "/splash_official_banner.jpg?v=2026", // Premium Official Produce Banner
  BANNER_ALT_1: "/official_splash.jpg?v=2026",
  BANNER_ALT_2: "/splash_official_banner.jpg?v=2026",
  CONTACT: {
    PHONE: "920023204",
    WHATSAPP: "0558828009",
    EMAIL: "marketing@deltastars-ksa.com",
    ADMIN_EMAIL: "marketing@deltastars-ksa.com",
    DEV_EMAIL: "marketing@deltastars-ksa.com",
    MARKETING_EMAIL: "marketing@deltastars-ksa.com"
  },
  BANK: {
    NAME: "البنك العربي الوطني",
    NAME_EN: "Arab National Bank",
    BRANCH: "فرع الرحاب - جدة",
    BRANCH_EN: "Al Rehab Branch - Jeddah",
    ACCOUNT_NAME: "شركة نجوم دلتا للتجارة",
    ACCOUNT_NAME_EN: "Delta Stars Trading Co.",
    ID: "4030457293",
    ACCOUNT_NUMBER: "0108095516770029",
    IBAN: "SA4730400108095516770029"
  },
  BRANCHES: [
    { id: 'jeddah', name: 'جدة - المقر الرئيسي', name_en: 'Jeddah - HQ' },
    { id: 'makkah', name: 'مكة المكرمة', name_en: 'Makkah' },
    { id: 'madinah', name: 'المدينة المنورة', name_en: 'Madinah' },
    { id: 'riyadh', name: 'الرياض', name_en: 'Riyadh' },
    { id: 'dammam', name: 'الدمام', name_en: 'Dammam' },
    { id: 'abha', name: 'أبها', name_en: 'Abha' }
  ],
  SOCIAL: {
    FACEBOOK: "https://www.facebook.com/profile.php?id=61578647072161",
    INSTAGRAM: "https://www.instagram.com/delta__stars?igsh=MWN5dGZob2FjanpwZQ%3D%3D&utm_source=qr",
    TELEGRAM: "https://t.me/deltastars1",
    YOUTUBE: "https://youtube.com/@deltastarss?si=CO_5DfI1FooYJpg_",
    SNAPCHAT: "https://snapchat.com/t/9Ki86jVW",
    TIKTOK: "https://www.tiktok.com/@dlta5?_r=1&_t=ZS-95eObglIwS4",
    WHATSAPP_COMMUNITY: "https://chat.whatsapp.com/J1mZCFjYprmFHveSyTjpMw?mode=ems_wa_t",
    CORPORATE_SITE: "https://deltastars-ksa.com/ar/",
    MAP: "https://maps.app.goo.gl/ED98cFHGW5UJYxjx7"
  }
};

export const COMPANY_INFO = {
    name: SYSTEM_CONFIG.BRAND_NAME,
    name_en: SYSTEM_CONFIG.BRAND_NAME_EN,
    slogan: SYSTEM_CONFIG.SLOGAN,
    slogan_en: SYSTEM_CONFIG.SLOGAN_EN,
    phone: SYSTEM_CONFIG.CONTACT.PHONE,
    whatsapp: SYSTEM_CONFIG.CONTACT.WHATSAPP,
    email: SYSTEM_CONFIG.CONTACT.EMAIL,
    website: "https://deltastars.store",
    corporate_site: SYSTEM_CONFIG.SOCIAL.CORPORATE_SITE,
    admin_email: SYSTEM_CONFIG.CONTACT.ADMIN_EMAIL,
    marketing_email: SYSTEM_CONFIG.CONTACT.MARKETING_EMAIL,
    developer_email: SYSTEM_CONFIG.CONTACT.DEV_EMAIL,
    address: "المملكة العربية السعودية - جده - حي المنار",
    map_url: SYSTEM_CONFIG.SOCIAL.MAP,
    logo_url: "/official_logo.png?v=2026", 
    wide_banner_url: SYSTEM_CONFIG.BANNER_URL,
    partners_url: getThumb("1CRZwMRmKNFx9GtNhWYYGxmRkZ8dZPXJk"),
    bank: {
        name: SYSTEM_CONFIG.BANK.NAME,
        account_name: SYSTEM_CONFIG.BANK.ACCOUNT_NAME,
        account_number: SYSTEM_CONFIG.BANK.ACCOUNT_NUMBER,
        iban: SYSTEM_CONFIG.BANK.IBAN,
        branch: SYSTEM_CONFIG.BANK.BRANCH,
        id_number: SYSTEM_CONFIG.BANK.ID
    }
};

export const SOCIAL_LINKS = SYSTEM_CONFIG.SOCIAL;

export const CATEGORY_ICONS = {
    vegetables: getThumb("1X7Dx44sE2u9sg6Y7JRiF-Lysde0Po3aw"),
    fruits: getThumb("1Z6Z9j4LDb-AO7Oht434f51OdtSd-Pr7C"),
    herbs: getThumb("1L1xtlAZBq1zAoeMCvPciBHWn1iq-XmK7"),
    dates: getThumb("1ybK8hgqbsTa3nEeABVMPu_CghlR4LlCq"),
    qassim: getThumb("1ygHtcN_IZZn9h5bWxkcgUYFx2NKBwV8O"),
    packages: getThumb("1TMRsT2A59Cf2R-DMiQKSdbHpjGTywlO5"),
    seasonal: getThumb("1cltZrcmcrfoSujfLxttvbw_WGOhokH1s"),
    nuts: getThumb("198nfibYeKNTz3q1ndTdnOh0uw8etRn12"),
    flowers: getThumb("1hOA1amN2-KnX24zrAj09Ldt8gnf563k0"),
    imported: getThumb("1X7Dx44sE2u9sg6Y7JRiF-Lysde0Po3aw"),
    wholesale: getThumb("1TMRsT2A59Cf2R-DMiQKSdbHpjGTywlO5"),
    custom: getThumb("1ybK8hgqbsTa3nEeABVMPu_CghlR4LlCq")
};

export const INSTITUTIONAL_VERIFICATION = [
    { title_ar: "رقم الفرع", title_en: "Branch No", number: "0202", icon: getThumb("1U7xsX4hQ0S9Zm3ufKZboOUtK0_yUeiQI") },
    { title_ar: "رقم الهوية", title_en: "ID No", number: "4030457293", icon: getThumb("1qcymBEeKErTZTCejW_A2EvaOoc0-XPx8") },
    { title_ar: "رقم الحساب", title_en: "Account No", number: "0108095516770029", icon: getThumb("1lJTkTukmIvpmGFgu9m6JCNwfSgztLGbW") },
    { title_ar: "رقم الآيبان", title_en: "IBAN", number: "SA4730400108095516770029", icon: getThumb("1BtHReESbyrDpZyrGswslwGVRJp0ywDc-") }
];

export const PRODUCT_UNITS = [
    { code: 'G', name_ar: 'جرام', name_en: 'Gram', base_factor: 1 },
    { code: 'KG', name_ar: 'كيلو', name_en: 'Kilogram', base_factor: 1000 },
    { code: '500G', name_ar: '500 جرام', name_en: '500 Grams', base_factor: 500 },
    { code: 'BUNCH', name_ar: 'حزمة', name_en: 'Bunch', base_factor: 250 },
    { code: 'PACK', name_ar: 'باكت', name_en: 'Pack', base_factor: 1000 }
];

export const COMPANY_DOCS = [
    { id: 'doc1', title_ar: 'السجل التجاري', title_en: 'Commercial Register', drive_id: '1ZhiuIawZC6SPEf91tXR2lfZM4jo10JDY', icon_url: 'https://cdn-icons-png.flaticon.com/512/3503/3503827.png' },
    { id: 'doc2', title_ar: 'شهادة ضريبية', title_en: 'VAT Certificate', drive_id: '12mBYsWHZuQgHLu0DF6ddQnK4Tkwm60ON', icon_url: 'https://cdn-icons-png.flaticon.com/512/3503/3503827.png' }
];

export const BRANCH_LOCATIONS = [
    { id: 1, name_ar: "فرع جدة الرئيسي", name_en: "Jeddah Main Branch", lat: 21.5678, lng: 39.2238, address_ar: "حي المنار، جدة", address_en: "Al Manar, Jeddah" },
    { id: 2, name_ar: "فرع الرياض", name_en: "Riyadh Branch", lat: 24.7136, lng: 46.6753, address_ar: "طريق الملك فهد، الرياض", address_en: "King Fahd Rd, Riyadh" },
    { id: 3, name_ar: "فرع مكة المكرمة", name_en: "Makkah Branch", lat: 21.3891, lng: 39.8579, address_ar: "حي العزيزية، مكة", address_en: "Al Aziziyah, Makkah" },
    { id: 4, name_ar: "فرع المدينة المنورة", name_en: "Madinah Branch", lat: 24.4672, lng: 39.6068, address_ar: "المدينة المنورة", address_en: "Madinah" },
    { id: 5, name_ar: "فرع الدمام", name_en: "Dammam Branch", lat: 26.4207, lng: 50.0888, address_ar: "الدمام", address_en: "Dammam" },
    { id: 6, name_ar: "فرع أبها", name_en: "Abha Branch", lat: 18.2164, lng: 42.5053, address_ar: "أبها", address_en: "Abha" }
];

export function sanitizeEmailForDisplay(email?: string): string {
  if (!email) return '';
  const adminEmails = [
    'deltastars90@gmail.com',
    'deltastars777@gmail.com',
    'marketing@deltastars-ksa.com',
    'info@deltastars-ksa.com',
    'developer@deltastars-ksa.com',
    'deltastars@zoho.mail.com',
    'vipservicesyemen@outlook.sa'
  ];
  if (adminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
    return 'marketing@deltastars-ksa.com';
  }
  return email;
}

