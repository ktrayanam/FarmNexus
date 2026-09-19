import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../translations/en";
import te from "../translations/te";
import hi from "../translations/hi";

const translations = { en, te, hi };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("farmnexus_lang") || "te"; // Default to Telugu as per farmer focus
  });

  useEffect(() => {
    localStorage.setItem("farmnexus_lang", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
