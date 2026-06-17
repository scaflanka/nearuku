import { translations } from './translations';

export type Language = 'en' | 'ar';

// Helper to normalize keys for fallback match
const normalizeKey = (key: string): string => {
  return key.trim().toLowerCase().replace(/[\s\n\t]+/g, ' ');
};

// Pre-compute normalized lookup for Arabic translations to speed up fallback matches
const normalizedArTranslations: Record<string, string> = {};
Object.entries(translations.ar).forEach(([key, val]) => {
  normalizedArTranslations[normalizeKey(key)] = val;
});

let currentLanguage: Language = 'en';

export const setI18nLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const translate = (key: string, language: Language): string => {
  if (language === 'en') {
    return key;
  }

  // 1. Exact match
  if (translations.ar[key as keyof typeof translations.ar]) {
    return translations.ar[key as keyof typeof translations.ar];
  }

  // 2. Normalized match (lowercase, trimmed, collapsed whitespace)
  const norm = normalizeKey(key);
  if (normalizedArTranslations[norm]) {
    return normalizedArTranslations[norm];
  }

  // 3. Fallback to key itself
  return key;
};

export const t = (key: string): string => {
  return translate(key, currentLanguage);
};
