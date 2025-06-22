
import React from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { MathType } from "@/lib/mathUtils";
import { Shuffle } from 'lucide-react';

type PracticeTypeSelectorProps = {
  currentType: MathType;
  onTypeChange: (type: MathType) => void;
};

export default function PracticeTypeSelector({ currentType, onTypeChange }: PracticeTypeSelectorProps) {
  console.log("Rendering: PracticeTypeSelector");
  
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <div className="text-base sm:text-lg text-blueKid font-bold mb-3">{t('choose_practice_type')}</div>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 bg-white/60 rounded-2xl p-3 sm:p-2 shadow">
        <button
          className={`py-2 px-4 sm:px-7 rounded-xl font-bold text-lg sm:text-xl shadow transition hover:scale-110 focus:outline-pinkKid ${
            currentType === "addition" ? "bg-greenKid text-blue-900" : "bg-yellowKid text-blue-800"
          }`}
          onClick={() => onTypeChange("addition")}
        >
          {t('addition')}
        </button>
        <button
          className={`py-2 px-4 sm:px-7 rounded-xl font-bold text-lg sm:text-xl shadow transition hover:scale-110 focus:outline-pinkKid ${
            currentType === "subtraction" ? "bg-greenKid text-blue-900" : "bg-yellowKid text-blue-800"
          }`}
          onClick={() => onTypeChange("subtraction")}
        >
          {t('subtraction')}
        </button>
        <button
          className={`py-2 px-4 sm:px-7 rounded-xl font-bold text-lg sm:text-xl shadow transition hover:scale-110 focus:outline-pinkKid ${
            currentType === "multiplication" ? "bg-greenKid text-blue-900" : "bg-yellowKid text-blue-800"
          }`}
          onClick={() => onTypeChange("multiplication")}
        >
          {t('multiplication_up_to_10')}
        </button>
        <button
          className={`py-2 px-4 sm:px-7 rounded-xl font-bold text-lg sm:text-xl shadow transition hover:scale-110 focus:outline-pinkKid ${
            currentType === "division" ? "bg-greenKid text-blue-900" : "bg-yellowKid text-blue-800"
          }`}
          onClick={() => onTypeChange("division")}
        >
          {t('division')}
        </button>
        
        {/* New Mixed Exercises Button */}
        <button
          className={`py-2 px-4 sm:px-7 rounded-xl font-bold text-lg sm:text-xl shadow transition hover:scale-110 focus:outline-pinkKid flex items-center justify-center gap-2 ${
            currentType === "mixed" 
              ? "bg-gradient-to-r from-pinkKid to-turquoiseKid text-white" 
              : "bg-gradient-to-r from-orangeKid to-yellowKid text-blue-800 hover:from-pinkKid hover:to-turquoiseKid hover:text-white"
          }`}
          onClick={() => onTypeChange("mixed")}
        >
          <Shuffle className="w-5 h-5" />
          מיקס תרגילים
        </button>
      </div>
    </div>
  );
}
