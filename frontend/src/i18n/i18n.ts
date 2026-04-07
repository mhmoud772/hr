import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import arTranslations from "./locales/ar.json";
import enTranslations from "./locales/en.json";
import { normalizeStringsDeep } from "../shared/lib/text-normalize";

type TranslationDict = Record<string, unknown>;

const resources = {
  en: { translation: normalizeStringsDeep({ ...(enTranslations as TranslationDict) }) as typeof enTranslations },
  ar: { translation: normalizeStringsDeep({ ...(arTranslations as TranslationDict) }) as typeof arTranslations },
};

const storedLng =
  (typeof window !== "undefined" && window.localStorage?.getItem("i18nextLng")) ||
  undefined;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Prefer persisted language to prevent flicker; defer to detector otherwise.
    lng: storedLng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      // Prioritise persisted choice to prevent automatic reversion to navigator/html tag.
      order: ["localStorage", "cookie", "querystring", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
      // Do not override stored choice with navigator/htmlTag once it exists.
      lookupLocalStorage: "i18nextLng",
      convertDetectedLanguage: (lng) => lng?.toLowerCase(),
    },
  });

export default i18n;
