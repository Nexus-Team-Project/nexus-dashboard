import { createContext, useContext, useState, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { translations } from './translations';
import type { Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Reads a valid language value from the dashboard callback URL.
 * Input: current browser location search params.
 * Output: language code or null when no supported value exists.
 */
const getUrlLanguage = (): Language | null => {
  if (typeof window === 'undefined') return null;
  const lang = new URLSearchParams(window.location.search).get('lang');
  return lang === 'he' || lang === 'en' ? lang : null;
};

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'he';
  const urlLanguage = getUrlLanguage();
  if (urlLanguage) return urlLanguage;
  const saved = localStorage.getItem('language');
  if (saved === 'he' || saved === 'en') return saved;
  const browser = (navigator.language || 'he').toLowerCase();
  return browser.startsWith('he') ? 'he' : 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(detectInitialLanguage);

  const isRTL = language === 'he';

  useLayoutEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
