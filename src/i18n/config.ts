import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import hi from './hi.json';
import pa from './pa.json';
import ur from './ur.json';
import bn from './bn.json';
import ta from './ta.json';
import pl from './pl.json';
import ro from './ro.json';
import ar from './ar.json';
import tr from './tr.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
  ur: { translation: ur },
  bn: { translation: bn },
  ta: { translation: ta },
  pl: { translation: pl },
  ro: { translation: ro },
  ar: { translation: ar },
  tr: { translation: tr }
};

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

// Log for debugging
console.log('i18n initialized:', i18n.language, 'Resources:', Object.keys(resources));

export default i18n;

