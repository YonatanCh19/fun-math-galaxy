
import React from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { Profile } from "@/hooks/useAuth";
import { renderAvatarByType, AvatarCharacter } from './AvatarSelector';

type ProfileHeaderProps = {
  profile: Profile;
  onShowMyCoins: () => void;
  onShowTipsRepository: () => void;
  onShowChampionsTable: () => void;
  onSwitchProfile: () => void;
  onSignOut: () => void;
};

export default function ProfileHeader({
  profile,
  onShowMyCoins,
  onShowTipsRepository,
  onShowChampionsTable,
  onSwitchProfile,
  onSignOut,
}: ProfileHeaderProps) {
  console.log("Rendering: ProfileHeader");
  
  const { t } = useTranslation();

  return (
    <div className="flex flex-col text-center sm:text-left sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
      <div className="flex items-center gap-3">
        <div className="transform hover:scale-110 transition-transform duration-200">
          {renderAvatarByType(profile.avatar_character as AvatarCharacter, 'md')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-pinkKid">{t('welcome_name', { name: profile.name })}</h1>
      </div>
      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-center">
         <button
          onClick={onShowMyCoins}
          className="bg-yellowKid text-blue-800 px-3 sm:px-4 py-2 rounded-xl shadow hover:scale-105 transition font-semibold text-sm sm:text-base"
        >
          {t('my_coins')}
        </button>
         <button
          onClick={onShowTipsRepository}
          className="bg-yellowKid text-blue-800 px-3 sm:px-4 py-2 rounded-xl shadow hover:scale-105 transition font-semibold text-sm sm:text-base"
        >
          {t('tips_repository')}
        </button>
         <button
          onClick={onShowChampionsTable}
          className="bg-yellowKid text-blue-800 px-3 sm:px-4 py-2 rounded-xl shadow hover:scale-105 transition font-semibold text-sm sm:text-base"
        >
          {t('champions_table')}
        </button>
        <button
          onClick={onSwitchProfile}
          className="bg-turquoiseKid text-blue-800 px-3 sm:px-4 py-2 rounded-xl shadow hover:scale-105 transition font-semibold text-sm sm:text-base"
        >
          {t('switch_profile')}
        </button>
        <button
          onClick={onSignOut}
          className="bg-pink-400 text-white px-3 sm:px-4 py-2 rounded-xl shadow hover:scale-105 transition font-semibold text-sm sm:text-base"
        >
          {t('sign_out')}
        </button>
      </div>
    </div>
  );
}
