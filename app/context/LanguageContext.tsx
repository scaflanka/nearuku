import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate, setI18nLanguage, Language } from '../../utils/i18n';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Sync language with global i18n helper
  useEffect(() => {
    setI18nLanguage(language);
  }, [language]);

  // Load saved language on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('appLanguage');
        if (savedLang === 'en' || savedLang === 'ar') {
          setLanguageState(savedLang);
        }
      } catch (error) {
        console.warn('Failed to load app language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (newLang: Language) => {
    try {
      await AsyncStorage.setItem('appLanguage', newLang);
      setLanguageState(newLang);
    } catch (error) {
      console.warn('Failed to save app language:', error);
    }
  };

  const t = useCallback(
    (key: string) => {
      return translate(key, language);
    },
    [language]
  );

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        setLanguage: changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
