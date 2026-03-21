import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import cs from './assets/translation/cs.json';
import nl from './assets/translation/nl.json';
import zh from './assets/translation/zh.json';
import en from './assets/translation/en.json';
import de from './assets/translation/de.json';
import es from './assets/translation/es.json';
import fr from './assets/translation/fr.json';

const resources = {
  cs: { translation: cs },
  nl: { translation: nl },
  zh: { translation: zh },
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'cs', // Výchozí jazyk aplikace
    fallbackLng: 'en',
    returnEmptyString: false,
    debug: true, // Pomáhá ladit chybějící překlady v konzoli
    interpolation: {
      escapeValue: false // React už escapuje sám
    },
    parseMissingKeyHandler: (key) => key // Pokud překlad chybí, zobrazí klíč
  });

export default i18n;