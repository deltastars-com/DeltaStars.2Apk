
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../../../translations';

type Language = 'ar' | 'en';
export type Currency = 'sar' | 'usd';

const CONVERSION_RATES: Record<Currency, number> = { sar: 1, usd: 0.27 };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => any;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (price: number) => string;
  getHijriDate: () => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use explicit fallback to 'ar' if localStorage fails
  const [language, setLanguageState] = useState<Language>(() => {
      try {
          const saved = localStorage.getItem('delta-lang');
          return (saved as Language) || 'ar';
      } catch (e) {
          return 'ar';
      }
  });
  
  const [currency, setCurrencyState] = useState<Currency>(() => {
      try {
          const saved = localStorage.getItem('delta-currency');
          return (saved as Currency) || 'sar';
      } catch (e) {
          return 'sar';
      }
  });

  useEffect(() => {
    try {
        localStorage.setItem('delta-lang', language);
    } catch (e) {}
    
    // CRITICAL: Update document properties for full UI transformation
    document.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: any): any => {
    const keys = key.split('.');
    let translation: any = translations[language];
    for (const k of keys) {
        if (translation && translation[k]) translation = translation[k];
        else {
            // Robust fallback to EN if AR key is missing or vice versa
            const fallbackLang = language === 'ar' ? 'en' : 'ar';
            translation = translations[fallbackLang];
            for (const fk of keys) { 
              if(translation && translation[fk]) translation = translation[fk]; 
              else { translation = key; break; }
            }
            break;
        }
    }
    if (typeof translation === 'string' && options) {
        return translation.replace(/\{\{(\w+)\}\}/g, (_, subKey) => String(options[subKey] || `{{${subKey}}}`));
    }
    return translation;
  }, [language]);

  const getHijriDate = () => {
      try {
          return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
          }).format(new Date());
      } catch (e) {
          return "";
      }
  };

  const formatCurrency = (price: number) => {
    const converted = price * CONVERSION_RATES[currency];
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency', currency: currency.toUpperCase()
    }).format(converted);
  };

  return (
    <I18nContext.Provider value={{ 
        language, setLanguage, t, currency, setCurrency: setCurrencyState, 
        formatCurrency, getHijriDate
    }}>
      <div className={language === 'en' ? 'font-sans' : 'font-cairo'}>
        {children}
      </div>
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};

