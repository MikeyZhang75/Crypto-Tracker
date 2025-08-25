"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { enUS } from "@/i18n/translations/en-US";
import { zhCN } from "@/i18n/translations/zh-CN";

export type Language = "en-US" | "zh-CN";
export type Translations = typeof enUS;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const translations: Record<Language, Translations> = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "preferred-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en-US");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Update document language attribute for accessibility
    document.documentElement.lang = lang;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  // Prevent hydration mismatch by rendering with default language on server
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{ language: "en-US", setLanguage, t: enUS }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
