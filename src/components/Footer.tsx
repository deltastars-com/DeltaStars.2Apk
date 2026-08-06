import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { COMPANY_INFO, SOCIAL_LINKS, SYSTEM_CONFIG } from '../constants';
import { DeltaStarsLogo } from './DeltaStarsLogo';
import { useI18n } from './lib/contexts/I18nContext';
import { MadaLogo, VisaLogo, MastercardLogo, ApplePayLogo, TabbyLogo, TamaraLogo, StcPayLogo, MoyasarLogo } from './PaymentIcons';

/* ── icons ────────────────────────────────────────────────── */
const GlobeIcon = ({ className = '' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);
const PhoneIcon = ({ className = '' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);
const ArrowUpIcon = ({ className = '' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
  </svg>
);
const ShieldCheckIcon = ({ className = '' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const WA = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 3.488"/></svg>;
const IG = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>;
const TG = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
const FB = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const SC = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 14.737c-.065.2-.334.338-.653.338h-.02c-.267 0-.577-.083-.875-.175-.462-.143-.941-.29-1.43-.098-.16.062-.318.16-.47.253-.46.276-.932.562-1.614.562s-1.154-.286-1.614-.562c-.152-.093-.31-.191-.47-.253-.49-.193-.968-.045-1.43.098-.298.092-.608.175-.875.175h-.02c-.319 0-.588-.138-.653-.338-.078-.237.084-.477.376-.566.045-.013.087-.026.129-.038.52-.153 1.018-.299 1.162-.824.019-.069.027-.14.024-.21-.011-.261-.076-.515-.14-.757C8.49 11.61 8.4 11.258 8.4 10.8c0-1.987 1.612-3.6 3.6-3.6s3.6 1.613 3.6 3.6c0 .458-.09.81-.165 1.108-.064.242-.129.496-.14.757-.003.07.005.141.024.21.144.525.642.671 1.162.824.042.012.084.025.129.038.292.089.454.329.376.566-.065.2-.334.338-.653.338z"/></svg>;
const TK = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.22 8.22 0 0 0 4.81 1.54V7.04a4.85 4.85 0 0 1-1.04-.35z"/></svg>;



/* ── MAIN FOOTER ────────────────────────────────────────────── */
interface FooterProps { 
  onNavigate: (page: string) => void; 
  logoPath?: string;
}

export function Footer({ onNavigate, logoPath }: FooterProps) {
  const { language } = useI18n();
  const ar = language === 'ar';

  const socialLinks = [
    { id: 'whatsapp',  Icon: WA, href: SOCIAL_LINKS?.WHATSAPP_COMMUNITY || `https://wa.me/${SYSTEM_CONFIG?.CONTACT?.WHATSAPP}`,  color: '#25D366', label: 'WhatsApp' },
    { id: 'instagram', Icon: IG, href: SOCIAL_LINKS?.INSTAGRAM || 'https://www.instagram.com/delta__stars', color: '#E4405F', label: 'Instagram' },
    { id: 'telegram',  Icon: TG, href: SOCIAL_LINKS?.TELEGRAM  || 'https://t.me/deltastars1',                color: '#0088cc', label: 'Telegram'  },
    { id: 'facebook',  Icon: FB, href: SOCIAL_LINKS?.FACEBOOK || 'https://www.facebook.com/profile.php?id=61578647072161', color: '#1877F2', label: 'Facebook'  },
    { id: 'snapchat',  Icon: SC, href: SOCIAL_LINKS?.SNAPCHAT  || '#',                                        color: '#FFFC00', label: 'Snapchat'  },
    { id: 'tiktok',    Icon: TK, href: SOCIAL_LINKS?.TIKTOK    || '#',                                        color: '#000000', label: 'TikTok'   },
    { id: 'linktree',  Icon: GlobeIcon, href: 'https://linktr.ee/deltastar6',                                color: '#43E1AD', label: 'Linktree'  },
  ];

  const paymentMethods = ['مدى', 'Visa', 'Mastercard', 'Apple Pay', 'STC Pay', 'Tamara', 'Tabby', 'Moyasar'];

  const policyLinks = [
    { label: ar ? 'الشروط والأحكام'          : 'Terms & Conditions',    page: 'terms'   },
    { label: ar ? 'سياسة الخصوصية'           : 'Privacy Policy',        page: 'privacy' },
    { label: ar ? 'سياسة الاستبدال والإرجاع' : 'Refund & Return Policy', page: 'returns' },
    { label: ar ? 'سياسة الشحن والتوصيل'    : 'Shipping Policy',        page: 'shipping'},
  ];

  const quickLinks = [
    { label: ar ? 'الرئيسية'    : 'Home',      page: 'home'      },
    { label: ar ? 'صالة العرض'  : 'Showroom',  page: 'showroom'  },
    { label: ar ? 'العروض'      : 'Offers',    page: 'showroom'  },
    { label: ar ? 'تتبع الطلب'  : 'Track Order',page: 'track_order'},
    { label: ar ? 'تواصل معنا'  : 'Contact Us', page: 'contact'  },
    { label: ar ? 'من نحن'      : 'About Us',   page: 'about'    },
  ];

  const bankInfo = {
    name:   ar ? 'البنك العربي الوطني (ANB)' : 'Arab National Bank (ANB)',
    holder: ar ? 'شركة نجوم دلتا للتجارة'   : 'Delta Stars Trading Co.',
    account: '0108095516770029',
    iban:    'SA4730400108095516770029',
    branch:  ar ? 'فرع الرحاب - جدة'         : 'Al Rehab Branch - Jeddah',
  };

  return (
    <>
      <footer
        className="bg-primary-dark text-white pt-16 pb-44 lg:pb-8 border-t-4 border-yellow-600 relative overflow-hidden"
        dir={ar ? 'rtl' : 'ltr'}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-900/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* ── Col 1: Brand + Social + Payment ── */}
            <div className="lg:col-span-1">
              {/* Logo */}
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-3 mb-6 group"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden ring-2 ring-amber-400/90 shadow-2xl flex-shrink-0 flex items-center justify-center bg-white p-0.5 transition-all duration-300 group-hover:scale-105 group-hover:ring-amber-300">
                  <DeltaStarsLogo
                    logoUrl={logoPath || '/official_logo.png?v=2026'}
                    fitMode="cover"
                    className="w-full h-full rounded-xl group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className={ar ? 'text-right' : 'text-left'}>
                  <h3 className="text-xl font-black text-white">
                    {ar ? 'نجوم دلتا' : 'DELTA'} <span className="text-yellow-400">{ar ? '' : 'STARS'}</span>
                  </h3>
                  <p className="text-[10px] text-yellow-500/80 tracking-widest font-semibold uppercase">
                    {ar ? 'للتجارة' : 'Trading Co.'}
                  </p>
                </div>
              </button>

              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                {ar
                  ? 'شريكك الأمثل للخضروات والفواكه والتمور عالية الجودة في المملكة العربية السعودية.'
                  : 'Your premier partner for high-quality vegetables, fruits, and dates in Saudi Arabia.'}
              </p>

              {/* Social icons */}
              <div className="mb-6">
                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3 font-bold">
                  {ar ? 'تابعنا' : 'Follow Us'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(({ id, Icon, href, color, label }) => {
                    let hoverStyles = "hover:bg-white/10 hover:border-white/30";
                    let iconColor = "group-hover:text-white";
                    if (id === 'whatsapp') {
                      hoverStyles = "hover:bg-[#25D366]/10 hover:border-[#25D366] hover:shadow-[0_0_15px_rgba(37,211,102,0.3)]";
                      iconColor = "group-hover:text-[#25D366]";
                    } else if (id === 'instagram') {
                      hoverStyles = "hover:bg-pink-600/10 hover:border-[#E4405F] hover:shadow-[0_0_15px_rgba(228,64,95,0.3)]";
                      iconColor = "group-hover:text-[#E4405F]";
                    } else if (id === 'telegram') {
                      hoverStyles = "hover:bg-[#0088cc]/10 hover:border-[#0088cc] hover:shadow-[0_0_15px_rgba(0,136,204,0.3)]";
                      iconColor = "group-hover:text-[#0088cc]";
                    } else if (id === 'facebook') {
                      hoverStyles = "hover:bg-[#1877F2]/10 hover:border-[#1877F2] hover:shadow-[0_0_15px_rgba(24,119,242,0.3)]";
                      iconColor = "group-hover:text-[#1877F2]";
                    } else if (id === 'snapchat') {
                      hoverStyles = "hover:bg-[#FFFC00]/10 hover:border-[#FFFC00] hover:shadow-[0_0_15px_rgba(255,252,0,0.3)]";
                      iconColor = "group-hover:text-[#FFFC00]";
                    } else if (id === 'tiktok') {
                      hoverStyles = "hover:bg-white/10 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]";
                      iconColor = "group-hover:text-white";
                    } else if (id === 'linktree') {
                      hoverStyles = "hover:bg-[#43E1AD]/10 hover:border-[#43E1AD] hover:shadow-[0_0_15px_rgba(67,225,173,0.3)]";
                      iconColor = "group-hover:text-[#43E1AD]";
                    }
                    return (
                      <a
                        key={id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className={`w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl transition-all duration-300 hover:scale-110 group ${hoverStyles}`}
                      >
                        <Icon className={`w-5 h-5 text-gray-400 transition-colors duration-300 ${iconColor}`} />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Payment methods */}
              <div>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3 font-bold">
                  {ar ? 'طرق الدفع الآمنة' : 'Secure Payment Methods'}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Moyasar Gateway">
                    <MoyasarLogo className="h-5 w-full !bg-transparent" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Mada">
                    <MadaLogo className="h-4 w-full" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Visa">
                    <VisaLogo className="h-3 w-full" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Mastercard">
                    <MastercardLogo className="h-4.5 w-full" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Apple Pay">
                    <ApplePayLogo className="h-4.5 w-full" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="STC Pay">
                    <StcPayLogo className="h-4 w-full" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Tamara">
                    <TamaraLogo className="h-4.5 w-full" />
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm h-7 w-12" title="Tabby">
                    <TabbyLogo className="h-4.5 w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Col 2: Quick Links ── */}
            <div>
              <h4 className={`text-sm font-black text-yellow-400 uppercase tracking-widest mb-5 pb-2 border-b border-white/10 ${ar ? 'border-r-2 border-r-yellow-600 pr-3' : 'border-l-2 border-l-yellow-600 pl-3'}`}>
                {ar ? 'روابط سريعة' : 'Quick Links'}
              </h4>
              <ul className="space-y-2.5">
                {quickLinks.map(({ label, page }) => (
                  <li key={`${page}-${label}`}>
                    <button
                      onClick={() => onNavigate(page)}
                      className="text-gray-300 hover:text-yellow-400 text-sm transition-colors hover:underline underline-offset-4 decoration-yellow-600/40 font-medium"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Col 3: Policies ── */}
            <div>
              <h4 className={`text-sm font-black text-yellow-400 uppercase tracking-widest mb-5 pb-2 border-b border-white/10 ${ar ? 'border-r-2 border-r-yellow-600 pr-3' : 'border-l-2 border-l-yellow-600 pl-3'}`}>
                {ar ? 'سياسات المتجر' : 'Store Policies'}
              </h4>
              <ul className="space-y-2.5">
                {policyLinks.map(({ label, page }) => (
                  <li key={page}>
                    <button
                      onClick={() => onNavigate(page)}
                      className="text-gray-300 hover:text-yellow-400 text-sm transition-colors hover:underline underline-offset-4 decoration-yellow-600/40 font-medium"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Legal badges */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{ar ? 'سجل تجاري: 4030440665' : 'CR: 4030440665'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{ar ? 'رقم ضريبي: 311594686700003' : 'VAT: 311594686700003'}</span>
                </div>
              </div>
            </div>

            {/* ── Col 4: Contact + Bank ── */}
            <div>
              <h4 className={`text-sm font-black text-yellow-400 uppercase tracking-widest mb-5 pb-2 border-b border-white/10 ${ar ? 'border-r-2 border-r-yellow-600 pr-3' : 'border-l-2 border-l-yellow-600 pl-3'}`}>
                {ar ? 'تواصل معنا' : 'Contact Us'}
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href={`tel:${SYSTEM_CONFIG?.CONTACT?.PHONE || '920023204'}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors group">
                    <PhoneIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span dir="ltr">{SYSTEM_CONFIG?.CONTACT?.PHONE || '920023204'}</span>
                  </a>
                </li>
                <li>
                  <a href={`https://wa.me/${SYSTEM_CONFIG?.CONTACT?.WHATSAPP || '966558828009'}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors">
                    <WA className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span dir="ltr">{SYSTEM_CONFIG?.CONTACT?.WHATSAPP || '966558828009'}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${SYSTEM_CONFIG?.CONTACT?.EMAIL || 'marketing@deltastars-ksa.com'}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors break-all">
                    <GlobeIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">{SYSTEM_CONFIG?.CONTACT?.EMAIL || 'marketing@deltastars-ksa.com'}</span>
                  </a>
                </li>
                <li className="flex items-start gap-2 text-gray-400 text-xs">
                  <GlobeIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{ar ? 'جدة، المملكة العربية السعودية' : 'Jeddah, Saudi Arabia'}</span>
                </li>
              </ul>

              {/* Bank info */}
              <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-3">
                  {ar ? 'للتحويل البنكي' : 'Bank Transfer'}
                </p>
                <div className="space-y-1.5 text-xs text-gray-300">
                  <p><span className="text-gray-300">{ar ? "البنك:" : "Bank:"}</span> {bankInfo.name}</p>
                  <p><span className="text-gray-300">{ar ? 'الاسم:' : 'Name:'}</span> {bankInfo.holder}</p>
                  <p dir="ltr" className="font-mono text-emerald-300 text-[10px]">IBAN: {bankInfo.iban}</p>
                  <p><span className="text-gray-300">{ar ? 'الفرع:' : 'Branch:'}</span> {bankInfo.branch}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              <p>
                © {new Date().getFullYear()}{' '}
                <button onClick={() => onNavigate('home')} className="text-yellow-400 hover:underline font-semibold">
                  {ar ? 'شركة نجوم دلتا للتجارة' : 'Delta Stars Trading Co.'}
                </button>
                {' '}{ar ? '— جميع الحقوق محفوظة' : '— All Rights Reserved'}
              </p>
              <div className="flex items-center gap-4">
                <a href="https://deltastars.store" className="hover:text-yellow-400 transition-colors">deltastars.store</a>
                <a href="https://deltastars-ksa.com" className="hover:text-yellow-400 transition-colors">deltastars-ksa.com</a>
                <span className="text-gray-300 font-mono">v2.1.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
