import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { en } from '../locales/en';
import { es } from '../locales/es';
import { fr } from '../locales/fr';

// Allow generic string for broader language support in the UI, even if we only have 3 translation files
type Language = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  en,
  es,
  fr
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Defaulting to English as requested
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
     // Check if Google Translate was already set by user previously via cookies
     const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
     if (match) {
         const code = match[2].split('/')[2];
         if (code) {
             setLanguageState(code);
         }
     }
  }, []);

  const setLanguage = (langCode: Language) => {
    setLanguageState(langCode);

    // Update real-time auto translate via Google Translate script
    const googleTranslateCombo = document.querySelector('select.goog-te-combo') as HTMLSelectElement | null;
    if (googleTranslateCombo) {
      googleTranslateCombo.value = langCode;
      googleTranslateCombo.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        // Force the cookie and reload/re-render if the element isn't there yet
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
        // Ensure iframe knows as well
        const iframe = document.querySelector('iframe.goog-te-menu-frame');
        if (!iframe) {
           setTimeout(() => {
               const combo = document.querySelector('select.goog-te-combo') as HTMLSelectElement;
               if(combo) { combo.value = langCode; combo.dispatchEvent(new Event('change', { bubbles: true })); }
           }, 1000);
        }
    }
  };

  const t = (key: string): string => {
    const translation = translations[language]?.[key];
    if (translation) {
      return translation;
    }
    
    // Fallback to English
    const fallbackTranslation = translations.en?.[key];
    if (fallbackTranslation) {
      return fallbackTranslation;
    }
    
    // Final fallback - return the key itself
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};