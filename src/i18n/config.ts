import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import hi from './hi.json';
// Additional language files will be added incrementally

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  // TODO: Add more languages (pa, ur, bn, ta, pl, ro, ar, tr)
};

// RTL languages
const rtlLanguages = ['ar', 'ur'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Handle RTL languages
i18n.on('languageChanged', (lng) => {
  const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;

