"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { id, type TranslationKey } from "./id";
import { en } from "./en";

export type Locale = "id" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  dict: typeof id;
}

const dictionaries = { id, en };

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tcg_locale") as Locale | null;
      if (saved === "id" || saved === "en") {
        setLocaleState(saved);
      }
    } catch {
      // Storage unavailable in sandbox or SSR
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("tcg_locale", l);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "id" ? "en" : "id");
  };

  const dict = dictionaries[locale];
  const t = (key: TranslationKey): string => {
    const val = dict[key];
    return typeof val === "string" ? val : "";
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
