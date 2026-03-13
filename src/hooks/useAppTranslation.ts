// Hello Khata OS - Custom Hooks Index
// হ্যালো খাতা - কাস্টম হুক ইনডেক্স

'use client';

import { useUiStore } from '@/stores/uiStore';
import React from 'react';

// Import translations
import bnTranslations from '@/../public/locales/bn/translation.json';
import enTranslations from '@/../public/locales/en/translation.json';

const translations: Record<string, Record<string, unknown>> = {
  bn: bnTranslations,
  en: enTranslations,
};

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Translation hook with language switching
export function useAppTranslation() {
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);

  const changeLanguage = (lang: 'bn' | 'en') => {
    setLanguage(lang);
  };

  // Translation function that looks up the key in the translation files
  const t = (key: string): string => {
    const translation = getNestedValue(translations[language], key);
    if (translation) {
      return translation;
    }
    // Fallback to English if not found in current language
    const fallback = getNestedValue(translations['en'], key);
    if (fallback) {
      return fallback;
    }
    // Return the key itself if no translation found
    return key;
  };

  return {
    t,
    language,
    changeLanguage,
    isBangla: language === 'bn',
    isEnglish: language === 'en',
  };
}

// Format currency in BDT
export function useCurrency() {
  const { language } = useAppTranslation();

  const formatCurrency = (amount: number): string => {
    const formatter = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `৳${formatter.format(amount)}`;
  };

  const formatNumber = (num: number): string => {
    const formatter = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US');
    return formatter.format(num);
  };

  const formatPercent = (num: number): string => {
    const formatter = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return formatter.format(num / 100);
  };

  return { formatCurrency, formatNumber, formatPercent };
}

// Format date
export function useDateFormat() {
  const { language } = useAppTranslation();

  const formatDate = (date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      short: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    }[format];

    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', options).format(d);
  };

  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  };

  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  };

  return { formatDate, formatTime, formatDateTime };
}

// Local storage hook with type safety
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
