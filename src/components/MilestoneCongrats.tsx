import React from 'react';
import { useTranslation } from "@/hooks/useTranslation";

export default function MilestoneCongrats() {
    console.log("Rendering: MilestoneCongrats");
    
    const { t } = useTranslation();
    return (
        <div className="fixed bottom-4 sm:bottom-10 left-4 right-4 sm:left-0 sm:right-0 mx-auto w-fit bg-gradient-to-l from-pinkKid to-yellowKid text-white px-6 sm:px-8 py-3 sm:py-4 rounded-3xl shadow-2xl text-lg sm:text-2xl font-bold animate-bounce z-40 text-center">
            {t('congrats_games')}
        </div>
    );
}
