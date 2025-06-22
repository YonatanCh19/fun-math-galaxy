
import { useLanguage } from '@/contexts/LanguageContext';
import en from '@/locales/en.json';
import he from '@/locales/he.json';

const translations = { en, he };

type TranslationKey = keyof typeof he;

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: TranslationKey, replacements: Record<string, string | number> = {}) => {
    let translation = translations[language][key] || key;
    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
    }
    return translation;
  };

  return { t, language };
};
