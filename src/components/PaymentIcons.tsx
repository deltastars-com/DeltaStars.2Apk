import React from 'react';

// Pristine vector mada logo (Saudi Domestic Scheme) - Highly Enhanced and Authentic
export const MadaLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <svg viewBox="0 0 60 20" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="20" rx="5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
    <g transform="translate(4, 2)">
      {/* Sophisticated interlocking rings with precise official mada color gradients */}
      <defs>
        <linearGradient id="madaGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00b050" />
          <stop offset="100%" stopColor="#008030" />
        </linearGradient>
        <linearGradient id="madaBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066cc" />
          <stop offset="100%" stopColor="#003399" />
        </linearGradient>
      </defs>
      
      {/* Left green loop */}
      <path d="M8 3 C11 1, 14 2, 15.5 4 C17 6, 17 10, 15.5 12 C14 14, 11 15, 8 13 C5 11, 5 5, 8 3 Z" fill="url(#madaGreen)" />
      {/* Right blue loop overlapping */}
      <path d="M12.5 3 C15.5 1, 18.5 2, 20 4 C21.5 6, 21.5 10, 20 12 C18.5 14, 15.5 15, 12.5 13 C9.5 11, 9.5 5, 12.5 3 Z" fill="url(#madaBlue)" opacity="0.92" />
      
      {/* Interlock bridge dots */}
      <circle cx="11.5" cy="8" r="1.5" fill="#ffffff" />
      <circle cx="16.5" cy="8" r="1.5" fill="#ffffff" />
      
      {/* Bilingual Text Logos styled beautifully with extreme precision */}
      <text x="26.5" y="12.5" fill="#1b2850" fontSize="9.5" fontWeight="900" fontFamily="'Inter', system-ui, sans-serif" letterSpacing="-0.04em">mada</text>
      <text x="27.5" y="6.5" fill="#008030" fontSize="6.5" fontWeight="900" fontFamily="'Tajawal', sans-serif">مدى</text>
    </g>
  </svg>
);

// High-fidelity Visa Logo
export const VisaLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg viewBox="0 0 30 10" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.134 9.28L12.44 1.01H15.82L14.514 9.28H11.134ZM19.263 1.32C18.665 1.09 17.729 0.87 16.634 0.87C13.254 0.87 10.875 2.47 10.854 4.74C10.835 6.44 12.54 7.38 13.849 7.95C15.19 8.53 15.644 8.91 15.638 9.45C15.627 10.28 14.538 10.65 13.593 10.65C12.164 10.65 11.378 10.28 10.72 9.96L10.228 11.98C10.838 12.23 11.968 12.45 13.125 12.45C16.685 12.45 19.004 10.87 19.034 8.45C19.054 6.58 17.766 5.64 15.534 4.69C14.195 4.13 13.518 3.79 13.526 3.25C13.526 2.77 14.125 2.25 15.429 2.25C16.516 2.25 17.433 2.51 18.035 2.74L18.528 0.72C18.125 0.56 18.618 0.76 19.263 1.32ZM23.491 1.01H20.311C19.336 1.01 18.784 1.55 18.394 2.39L13.535 12.28H17.065L17.771 10.48H22.091L22.497 12.28H25.614L23.491 1.01ZM18.749 8.05L20.932 2.48L21.56 5.32L20.932 8.05H18.749ZM5.645 1.01L2.345 8.68L1.989 1.42C1.94 1.19 1.745 1.01 1.488 1.01H0.038L0 1.23C0.841 1.42 1.583 1.69 2.089 2.01L5.051 12.28H8.567L13.829 1.01H5.645Z" fill="#1A1F71" transform="scale(1, 0.7)" />
  </svg>
);

// High-fidelity Mastercard Logo
export const MastercardLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" fill="#EB001B" />
    <circle cx="16" cy="8" r="7" fill="#F79E1B" fillOpacity="0.85" />
  </svg>
);

// High-fidelity Apple Pay Logo
export const ApplePayLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 36 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="16" rx="3.5" fill="#000000" />
    <g transform="translate(4, 1.5)">
      {/* Apple Icon */}
      <path d="M10.2 7.5 C10.2 6.1 11.3 5.4 11.4 5.3 C10.7 4.4 9.7 4.3 9.4 4.2 C8.6 4.1 7.8 4.7 7.4 4.7 C7.0 4.7 6.3 4.2 5.7 4.2 C4.8 4.2 4.0 4.7 3.6 5.5 C2.6 7.1 3.4 9.5 4.3 10.9 C4.8 11.5 5.3 12.2 5.9 12.2 C6.5 12.2 6.7 11.8 7.4 11.8 C8.1 11.8 8.3 12.2 8.9 12.2 C9.5 12.2 10.0 11.5 10.4 10.9 C10.9 10.2 11.1 9.6 11.1 9.5 C11.1 9.5 10.2 9.1 10.2 7.5 Z" fill="#ffffff" transform="translate(-2, -2) scale(0.9)" />
      <path d="M8.8 3.1 C9.2 2.6 9.5 1.9 9.4 1.2 C8.8 1.2 8.0 1.6 7.6 2.1 C7.2 2.6 6.9 3.3 7.0 4.0 C7.7 4.1 8.4 3.7 8.8 3.1 Z" fill="#ffffff" transform="translate(-2, -2) scale(0.9)" />
      {/* Pay text */}
      <text x="14" y="9.5" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">Pay</text>
    </g>
  </svg>
);

// High-fidelity Google Pay Logo
export const GooglePayLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 36 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="16" rx="3.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
    <text x="18" y="11" textAnchor="middle" fill="#5F6368" fontSize="8.5" fontWeight="bold" fontFamily="system-ui, sans-serif">G Pay</text>
  </svg>
);

// High-fidelity Tabby Logo (Official Brand Colorway)
export const TabbyLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 45 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="45" height="16" rx="3" fill="#3ef2be" />
    <text x="22.5" y="11.5" textAnchor="middle" fill="#050505" fontSize="9.5" fontWeight="900" letterSpacing="-0.02em" fontFamily="system-ui, sans-serif">tabby</text>
  </svg>
);

// High-fidelity Tamara Logo (Official Brand Colorway)
export const TamaraLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 45 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="45" height="16" rx="3" fill="#fbf0e8" stroke="#f6d3b4" strokeWidth="0.5" />
    <text x="20.5" y="11" textAnchor="middle" fill="#1c1c1c" fontSize="8.5" fontWeight="900" letterSpacing="0.02em" fontFamily="system-ui, sans-serif">tamara</text>
    <circle cx="36" cy="8" r="1.5" fill="#ff6433" />
  </svg>
);

// High-fidelity PayPal Logo
export const PayPalLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 45 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="45" height="16" rx="3" fill="#003087" />
    <text x="22.5" y="11" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">PayPal</text>
  </svg>
);

// STC Pay Logo (Saudi Digital Payment Scheme)
export const StcPayLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg viewBox="0 0 45 16" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="45" height="16" rx="3" fill="#4f145b" />
    <text x="22.5" y="10.5" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">stc pay</text>
  </svg>
);

// Arab National Bank Logo (البنك العربي الوطني) - Beautiful High-Fidelity Icon representing ANB
export const AnbLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <svg viewBox="0 0 120 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="32" rx="6" fill="#f8fafc" stroke="#1e293b" strokeWidth="1" />
    <g transform="translate(6, 4)">
      {/* Abstract elegant green-gold logo symbol for ANB */}
      <circle cx="12" cy="12" r="10" fill="#006a4e" />
      <polygon points="12,4 15,10 21,12 15,14 12,20 9,14 3,12 9,10" fill="#ca8a04" />
      
      {/* ANB text logo */}
      <text x="28" y="12" fill="#0f172a" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">anb العربي</text>
      <text x="28" y="21" fill="#006a4e" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">البنك العربي الوطني</text>
    </g>
  </svg>
);

// Al Rajhi Bank Logo (مصرف الراجحي) - Beautiful High-Fidelity Icon representing Al Rajhi
export const AlRajhiLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <svg viewBox="0 0 120 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="32" rx="6" fill="#f8fafc" stroke="#1d4ed8" strokeWidth="1" />
    <g transform="translate(6, 4)">
      {/* Iconic Al Rajhi Blue & Yellow design */}
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0054a6" />
      <circle cx="12" cy="12" r="6" fill="#f59e0b" />
      
      <text x="28" y="12" fill="#0f172a" fontSize="8" fontWeight="900" fontFamily="sans-serif">al rajhi bank</text>
      <text x="28" y="21" fill="#0054a6" fontSize="6" fontWeight="bold" fontFamily="sans-serif">مصرف الراجحي</text>
    </g>
  </svg>
);

// Saudi National Bank (SNB / AlAhli) Logo (البنك الأهلي السعودي)
export const SnbLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <svg viewBox="0 0 120 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="32" rx="6" fill="#f8fafc" stroke="#047857" strokeWidth="1" />
    <g transform="translate(6, 4)">
      {/* Iconic SNB Green & Gold Emblem */}
      <circle cx="12" cy="12" r="10" fill="#005e3a" />
      <path d="M8 12 L12 8 L16 12 L12 16 Z" fill="#d97706" />
      
      <text x="28" y="12" fill="#0f172a" fontSize="8" fontWeight="900" fontFamily="sans-serif">SNB الأهلي</text>
      <text x="28" y="21" fill="#005e3a" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">البنك الأهلي السعودي</text>
    </g>
  </svg>
);

// Riyad Bank Logo (بنك الرياض)
export const RiyadBankLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <svg viewBox="0 0 120 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="32" rx="6" fill="#f8fafc" stroke="#ca8a04" strokeWidth="1" />
    <g transform="translate(6, 4)">
      {/* Riyad Bank Gold emblem */}
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#ca8a04" />
      <text x="12" y="15" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">R</text>
      
      <text x="28" y="12" fill="#0f172a" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">riyad bank</text>
      <text x="28" y="21" fill="#ca8a04" fontSize="6" fontWeight="bold" fontFamily="sans-serif">بنك الرياض</text>
    </g>
  </svg>
);

// High-fidelity Moyasar Payment Gateway Logo (بوابة ميسر المالية)
export const MoyasarLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <svg viewBox="0 0 110 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="110" height="32" rx="6" fill="#0c1a30" stroke="#102a43" strokeWidth="1" />
    <g transform="translate(8, 4)">
      {/* Beautiful shield & wave for secure payment gateway icon */}
      <path d="M4 12 C4 6, 8 3, 12 3 C16 3, 20 6, 20 12 C20 17, 16 21, 12 21 C8 21, 4 17, 4 12 Z" fill="#00cfc7" opacity="0.15" />
      <path d="M12 5 L18 8 L18 13 C18 17.5, 14.5 20, 12 21 C9.5 20, 6 17.5, 6 13 L6 8 Z" fill="none" stroke="#00cfc7" strokeWidth="1.8" />
      <path d="M9 11 L11 13 L15 9" fill="none" stroke="#00cfc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Arabic and English Brand name */}
      <text x="28" y="12" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.05em">Moyasar</text>
      <text x="28" y="21" fill="#00cfc7" fontSize="8" fontWeight="bold" fontFamily="'Tajawal', sans-serif">ميسر للتحصيل</text>
    </g>
  </svg>
);

// Moyasar & Arab National Bank (ANB) Secure Integration Badge
export const MoyasarAnbSecureBadge: React.FC<{ className?: string; lang?: 'ar' | 'en' }> = ({ className = "w-full", lang = "ar" }) => {
  const isAr = lang === 'ar';
  return (
    <div className={`p-4 bg-gradient-to-br from-emerald-950/50 to-slate-900/50 border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      <div className="flex items-center gap-3 shrink-0">
        <MoyasarLogo className="h-10" />
        <div className="h-8 w-[1px] bg-emerald-500/20 hidden sm:block" />
        <AnbLogo className="h-10" />
      </div>
      <div className="flex-1 text-center sm:text-right">
        <h4 className="text-xs font-black text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          {isAr ? "ربط مالي آمن ومباشر" : "Secure Direct Financial Integration"}
        </h4>
        <p className="text-[10px] text-slate-300 font-medium mt-1 leading-relaxed">
          {isAr 
            ? "بوابة ميسر المالية هي البوابة الوسيطة والرئيسية للتكامل بين المتجر وبطاقات الائتمان والبنوك السعودية كاملاً لشركة نجوم دلتا للتجارة. يتم استلام المبالغ وتدقيقها بأعلى معايير الأمان (PCI DSS) وتحويلها مباشرة إلى حساب الشركة الرسمي لدى البنك العربي الوطني (anb)."
            : "Moyasar Financial Gateway is the official intermediate portal integrating Delta Stars with credit cards and Saudi banks. Transactions are processed securely in compliance with PCI DSS and deposited directly into the company's official corporate account at Arab National Bank (anb)."}
        </p>
      </div>
    </div>
  );
};
