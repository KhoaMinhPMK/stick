import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });

export default i18n;

// Handle class changes for language specific styling (like line-heights for Vietnamese)
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('lang', lng);
  if (lng.startsWith('vi')) {
    document.documentElement.classList.add('lang-vi');
  } else {
    document.documentElement.classList.remove('lang-vi');
  }
});

// Init call to set initial class
if (i18n.language && i18n.language.startsWith('vi')) {
  document.documentElement.classList.add('lang-vi');
}
