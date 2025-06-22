
import React, { useState, useEffect, useRef, useCallback } from "react";
import OptimizedPracticeQuestion from "@/components/OptimizedPracticeQuestion";
import { useAuth } from "@/hooks/useAuth";
import { MathType } from "@/lib/mathUtils";
import { useNavigate, useLocation } from "react-router-dom";
import ChampionsTable from "@/components/ChampionsTable";
import DailyTip from "@/components/DailyTip";
import TipsRepository from "@/components/TipsRepository";
import MyCoins from "@/components/MyCoins";
import ContactDialog from "@/components/ContactDialog";
import { useTranslation } from "@/hooks/useTranslation";
import PracticeHeader from "@/components/PracticeHeader";
import ProfileHeader from "@/components/ProfileHeader";
import PracticeTypeSelector from "@/components/PracticeTypeSelector";
import MilestoneCongrats from "@/components/MilestoneCongrats";
import LoadingSpinner from "@/components/LoadingSpinner";
import RefreshPrompt from "@/components/RefreshPrompt";
import { useProgressData } from "@/hooks/useProgressData";
import { useAnimationControl } from "@/hooks/useAnimationControl";
import { useMemoryMonitor } from "@/hooks/useMemoryMonitor";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";
import { toast } from "sonner";

export default function Practice() {
  const { user, selectedProfile, signOut, loading, selectProfile } = useAuth();
  const [type, setType] = useState<MathType>("addition");
  const [showChampionsTable, setShowChampionsTable] = useState(false);
  const [showTipsRepository, setShowTipsRepository] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [showMyCoins, setShowMyCoins] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showMilestoneCongrats, setShowMilestoneCongrats] = useState(false);
  const milestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Custom hooks for performance monitoring
  const { progress, sessionCorrectAnswers, loading: progressLoading, updateProgress, incrementSessionCorrectAnswers } = useProgressData(selectedProfile?.id || null);
  const { startAnimation, stopAnimation, stopAllAnimations } = useAnimationControl();
  const { cleanupMemory } = useMemoryMonitor();
  const { showRefreshPrompt, handleRefresh, dismissPrompt } = useActivityMonitor();

  useEffect(() => {
    if (!loading && !user) {
      nav("/auth", { replace: true });
    }
    if (!loading && user && !selectedProfile) {
      nav("/profile-selection", { replace: true });
    }
  }, [user, selectedProfile, loading, nav]);

  useEffect(() => {
    if (location.state?.showTip) {
      setShowDailyTip(true);
      nav(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, nav]);

  const handleSignOut = useCallback(async () => {
    stopAllAnimations();
    cleanupMemory();
    await signOut();
    nav("/auth");
  }, [signOut, nav, stopAllAnimations, cleanupMemory]);

  const handleSwitchProfile = useCallback(() => {
    if (selectProfile) {
      selectProfile(null);
    }
    nav("/profile-selection");
  }, [selectProfile, nav]);

  const handleAwardTrophy = useCallback(() => {
    const newTrophies = progress.trophies + 1;
    const correctAnswersForMilestone = newTrophies * 12;

    if (correctAnswersForMilestone > 0 && correctAnswersForMilestone % 12 === 0) {
      startAnimation('milestone', 2000);
      setShowMilestoneCongrats(true);
      milestoneTimeoutRef.current = setTimeout(() => {
        stopAnimation('milestone');
        nav("/games");
      }, 1000);
    }
  }, [progress.trophies, startAnimation, stopAnimation, nav]);

  const handleDone = useCallback((stats: {correct: number, total: number, trophies: number}) => {
    updateProgress({
      correct: stats.correct,
      total: stats.total,
      trophies: stats.trophies,
      coins: progress.coins,
      free_games: progress.free_games,
    });
  }, [updateProgress, progress.coins, progress.free_games]);

  const handleCorrectAnswer = useCallback(() => {
    const newSessionCorrect = sessionCorrectAnswers + 1;
    incrementSessionCorrectAnswers();

    if (newSessionCorrect === 12) {
      // Award coin and navigate to games
      const newCoins = progress.coins + 1;
      updateProgress({
        correct: progress.correct + 1,
        total: progress.total + 1,
        trophies: progress.trophies,
        coins: newCoins,
        free_games: progress.free_games,
      });

      toast.success("מזל טוב! קיבלת מטבע!", {
        description: `השגת 12 תשובות נכונות רצופות! עכשיו יש לך ${newCoins} מטבעות`,
        icon: '🪙',
      });

      // Navigate to games page
      setTimeout(() => {
        nav("/games");
      }, 2000);
    }
  }, [sessionCorrectAnswers, incrementSessionCorrectAnswers, progress, updateProgress, nav]);

  const handleShowContact = useCallback(() => setShowContactDialog(true), []);
  const handleShowMyCoins = useCallback(() => setShowMyCoins(true), []);
  const handleShowTipsRepository = useCallback(() => setShowTipsRepository(true), []);
  const handleShowChampionsTable = useCallback(() => setShowChampionsTable(true), []);

  const handleCloseChampionsTable = useCallback(() => setShowChampionsTable(false), []);
  const handleCloseTipsRepository = useCallback(() => setShowTipsRepository(false), []);
  const handleCloseMyCoins = useCallback(() => setShowMyCoins(false), []);
  const handleCloseContactDialog = useCallback(() => setShowContactDialog(false), []);
  const handleCloseDailyTip = useCallback(() => setShowDailyTip(false), []);

  useEffect(() => {
    return () => {
      if (milestoneTimeoutRef.current) {
        clearTimeout(milestoneTimeoutRef.current);
        milestoneTimeoutRef.current = null;
      }
      stopAllAnimations();
    };
  }, [stopAllAnimations]);

  if (showDailyTip) {
    return <DailyTip onClose={handleCloseDailyTip} />;
  }
  
  if (loading || !user || !selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela px-4">
        <LoadingSpinner message={t('loading')} size="lg" />
      </div>
    );
  }

  if (progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela px-4">
        <LoadingSpinner message="טוען נתונים..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-start items-center pt-4 bg-kidGradient font-varela px-4">
        <PracticeHeader onShowContact={handleShowContact} />

        <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-6">
          <ProfileHeader
            profile={selectedProfile}
            onShowMyCoins={handleShowMyCoins}
            onShowTipsRepository={handleShowTipsRepository}
            onShowChampionsTable={handleShowChampionsTable}
            onSwitchProfile={handleSwitchProfile}
            onSignOut={handleSignOut}
          />

          <PracticeTypeSelector currentType={type} onTypeChange={setType} />
          
          {/* Add Online Competition Button */}
          <div className="text-center mb-4">
            <button
              onClick={() => nav("/online-competition")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-200 hover:shadow-xl"
            >
              🏆 תחרות אונליין
            </button>
          </div>
          
          <div className="my-4 sm:my-6 text-center">
            <p className="text-lg sm:text-xl font-bold text-blue-900 bg-white/50 rounded-full px-6 py-2 inline-block shadow-md animate-pulse mb-2">
                {t('solve_and_win_promo')}
            </p>
            {/* Show session progress below the main text */}
            <div className="text-sm text-blue-800 bg-white/30 rounded-full px-4 py-1 inline-block">
              תשובות נכונות רצופות: {sessionCorrectAnswers}/12
            </div>
          </div>
        </div>

        <OptimizedPracticeQuestion
          key={`${selectedProfile.id}-${type}`}
          user={user}
          profile={selectedProfile}
          type={type}
          onAwardTrophy={handleAwardTrophy}
          onDone={handleDone}
          sessionCorrectAnswers={sessionCorrectAnswers}
          onCorrectAnswer={handleCorrectAnswer}
        />
        {showMilestoneCongrats && <MilestoneCongrats />}
         <div className="mt-auto text-center text-gray-600 text-xs py-4">{t('copyright')}</div>
      </div>
      <ChampionsTable isOpen={showChampionsTable} onClose={handleCloseChampionsTable} />
      <TipsRepository isOpen={showTipsRepository} onClose={handleCloseTipsRepository} />
      <MyCoins isOpen={showMyCoins} onClose={handleCloseMyCoins} user={user} />
      <ContactDialog isOpen={showContactDialog} onClose={handleCloseContactDialog} />
      {showRefreshPrompt && <RefreshPrompt onRefresh={handleRefresh} onDismiss={dismissPrompt} />}
    </>
  );
}
