/**
 * MC Server Localization Context & Provider
 * Supports instantaneous dynamic switching between vi-VN, en-US, ko-KR, and zh-CN.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Language } from '../types';
import { vi } from './locales/vi';
import { en } from './locales/en';
import { ko } from './locales/ko';
import { zh } from './locales/zh';

const translations: Record<Language, any> = {
  'vi-VN': vi,
  'en-US': en,
  'ko-KR': ko,
  'zh-CN': zh,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatDateTime: (date: Date | string | number) => string;
  formatTimeOnly: (date: Date | string | number) => string;
  languages: { code: Language; label: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'vi-VN', label: 'Tiếng Việt', flag: 'VN' },
  { code: 'en-US', label: 'English', flag: 'US' },
  { code: 'ko-KR', label: '한국어', flag: 'KR' },
  { code: 'zh-CN', label: '简体中文', flag: 'CN' },
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mcserver_language');
    if (saved && ['vi-VN', 'en-US', 'ko-KR', 'zh-CN'].includes(saved)) {
      return saved as Language;
    }
    return 'vi-VN'; // Default to Vietnamese per factory brief
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mcserver_language', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language.split('-')[0];
  }, [language]);

  // Nested key resolver
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key missing in current language
        let fallbackVal = translations['en-US'];
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        return (typeof fallbackVal === 'string' ? fallbackVal : fallback) || path;
      }
    }

    return typeof current === 'string' ? current : (fallback || path);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(language, options).format(num);
  };

  const formatDateTime = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  };

  const formatTimeOnly = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    }).format(d);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatNumber,
      formatDateTime,
      formatTimeOnly,
      languages: SUPPORTED_LANGUAGES,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
