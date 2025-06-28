import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { MathType } from "@/lib/mathUtils";
import PracticeTypeSelector from "@/components/PracticeTypeSelector";
import OptimizedPracticeQuestion from "@/components/OptimizedPracticeQuestion";
import ProfileHeader from "@/components/ProfileHeader";
import PracticeHeader from "@/components/PracticeHeader";
import ContactDialog from "@/components/ContactDialog";
import MyCoins from "@/components/MyCoins";
import TipsRepository from "@/components/TipsRepository";
import ChampionsTable from "@/components/ChampionsTable";
import MilestoneCongrats from "@/components/MilestoneCongrats";
import DailyTip from "@/components/DailyTip";
import { useProgressData } from "@/hooks/useProgressData";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";
import { useMemoryMonitor } from "@/hooks/useMemoryMonitor";
import RefreshPrompt from "@/components/RefreshPrompt";
import { Button } from "@/components/ui/button";
import { Gamepad2, Users } from "lucide-react";

export default function Practice() {
  console.log("Rendering: Practice");
  
  const { user, selectedProfile, signOut, selectProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [practiceType, setPracticeType] = useState<MathType>("addition");
  const [showContact, setShowContact] = useState(false);
  const [showMyCoins, setShowMyCoins] = useState(false);
  const [showTipsRepository, setShowTipsRepository] = useState(false);
  const [showChampionsTable, setShowChampionsTable] = useState(false);
  const [showMilestoneCongrats, setShowMilestoneCongrats] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [trophiesAwarded, setTrophiesAwarded] = useState(0);

  const { 
    progress, 
    sessionCorrectAnswers, 
    loading: progressLoading, 
    incrementSessionCorrectAnswers,
    resetSessionCorrectAnswers 
  } = useProgressData(selectedProfile?.id || null);

  const { showRefreshPrompt, handleRefresh, dismissPrompt } = useActivityMonitor();
  useMemoryMonitor();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !selectedProfile) {
      navigate("/profile-selection");
    }
  }, [user, selectedProfile, loading, navigate]);

  useEffect(() => {
    if (location.state?.showTip && !showDailyTip) {
      setShowDailyTip(true);
    }
  }, [location.state, showDailyTip]);

  useEffect(() => {
    if (sessionCorrectAnswers > 0 && sessionCorrectAnswers % 12 === 0) {
      setShowMilestoneCongrats(true);
      const timer = setTimeout(() => setShowMilestoneCongrats(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [sessionCorrectAnswers]);

  const handleAwardTrophy = useCallback(() => {
    setTrophiesAwarded(prev => prev + 1);
  }, []);

  const handleCorrectAnswer = useCallback(() => {
    incrementSessionCorrectAnswers();
  }, [incrementSessionCorrectAnswers]);

  const handleSwitchProfile = useCallback(() => {
    selectProfile(null);
    resetSessionCorrectAnswers();
    navigate("/profile-selection");
  }, [selectProfile, resetSessionCorrectAnswers, navigate]);

  const handleSignOut = useCallback(async () => {
    resetSessionCorrectAnswers();
    await signOut();
  }, [signOut, resetSessionCorrectAnswers]);

  if (loading || progressLoading || !user || !selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela text-xl text-pinkKid">
        טוען...
      </div>
    );
  }

  return (
    <>
      {showRefreshPrompt && (
        <RefreshPrompt onRefresh={handleRefresh} onDismiss={dismissPrompt} />
      )}
      
      {showDailyTip && <DailyTip onClose={() => setShowDailyTip(false)} />}
      
      <div className="min-h-screen bg-kidGradient font-varela p-4 sm:p-8 flex flex-col items-center" dir="rtl">
        <PracticeHeader onShowContact={() => setShowContact(true)} />
        
        <div className="w-full max-w-4xl">
          <ProfileHeader
            profile={selectedProfile}
            onShowMyCoins={() => setShowMyCoins(true)}
            onShowTipsRepository={() => setShowTipsRepository(true)}
            onShowChampionsTable={() => setShowChampionsTable(true)}
            onSwitchProfile={handleSwitchProfile}
            onSignOut={handleSignOut}
          />

          {/* Online Competition Button */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => navigate('/online-competition')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
            >
              <Users size={24} />
              <Gamepad2 size={24} />
              תחרות אונליין
            </Button>
          </div>

          <PracticeTypeSelector 
            currentType={practiceType} 
            onTypeChange={setPracticeType} 
          />

          <OptimizedPracticeQuestion
            key={`${selectedProfile.id}-${practiceType}`}
            user={user}
            profile={selectedProfile}
            type={practiceType}
            onAwardTrophy={handleAwardTrophy}
            onDone={() => {}}
            sessionCorrectAnswers={sessionCorrectAnswers}
            onCorrectAnswer={handleCorrectAnswer}
          />

          {sessionCorrectAnswers >= 12 && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => navigate("/games")}
                className="bg-greenKid text-white px-8 py-4 text-xl rounded-3xl drop-shadow hover:bg-green-500 font-bold animate-pulse"
              >
                🎮 בואו נשחק! 🎮
              </Button>
            </div>
          )}
        </div>

        {showMilestoneCongrats && <MilestoneCongrats />}
      </div>

      <ContactDialog isOpen={showContact} onClose={() => setShowContact(false)} />
      <MyCoins isOpen={showMyCoins} onClose={() => setShowMyCoins(false)} />
      <TipsRepository isOpen={showTipsRepository} onClose={() => setShowTipsRepository(false)} />
      <ChampionsTable isOpen={showChampionsTable} onClose={() => setShowChampionsTable(false)} />
    </>
  );
}