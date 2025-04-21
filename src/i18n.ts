import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './assets/translation/en.json';
import cs from './assets/translation/cs.json';
import nl from './assets/translation/nl.json';
import zh from './assets/translation/zh.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
    nl: { translation: nl },
    zh: { translation: zh },
  },
  lng: 'cs',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;