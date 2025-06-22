import React from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

type PracticeHeaderProps = {
  onShowContact: () => void;
};

export default function PracticeHeader({ onShowContact }: PracticeHeaderProps) {
  console.log("Rendering: PracticeHeader");
  
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguage();

  return (
    <div className="w-full max-w-4xl flex justify-between items-center mb-4">
      <div className="text-gray-600 font-bold">{t('bsd')}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setLanguage(language === 'he' ? 'en' : 'he')} className="bg-white/80 text-blue-800 px-3 py-1 rounded-lg shadow hover:scale-105 transition font-semibold text-xs">
          {language === 'he' ? 'English' : 'עברית'}
        </button>
        <button
          onClick={onShowContact}
          className="bg-white/80 text-blue-800 px-3 py-1 rounded-lg shadow hover:scale-105 transition font-semibold text-xs"
        >
          {t('contact_us')}
        </button>
      </div>
    </div>
  );
}
