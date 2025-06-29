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
import ChatSystem from "@/components/ChatSystem";
import { useProgressData } from "@/hooks/useProgressData";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";
import { useMemoryMonitor } from "@/hooks/useMemoryMonitor";
import { useChat } from "@/hooks/useChat";
import RefreshPrompt from "@/components/RefreshPrompt";
import { Button } from "@/components/ui/button";
import { Gamepad2, Users, Target, Star, Trophy, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  const [showChat, setShowChat] = useState(false);
  const [trophiesAwarded, setTrophiesAwarded] = useState(0);

  const { 
    progress, 
    sessionCorrectAnswers, 
    loading: progressLoading, 
    incrementSessionCorrectAnswers,
    resetSessionCorrectAnswers 
  } = useProgressData(selectedProfile?.id || null);

  // Only initialize chat if we have a selected profile
  const { unreadCount } = useChat(selectedProfile || null);
  const { showRefreshPrompt, handleRefresh, dismissPrompt } = useActivityMonitor();
  useMemoryMonitor();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !selectedProfile) {
      navigate("/profile-selection");
    }
  }, [user, selectedProfile, loading, navigate]);

  // פונקציה יציבה לסגירת הטיפ היומי
  const handleCloseDailyTip = useCallback(() => {
    setShowDailyTip(false);
  }, []);

  useEffect(() => {
    if (location.state?.showTip && !showDailyTip) {
      setShowDailyTip(true);
      // ניקוי ה-state כדי שהטיפ לא יופיע שוב
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, showDailyTip, navigate, location.pathname]);

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

  // חישוב התקדמות למשחק הבא
  const answersToNextGame = 12;
  const currentProgress = sessionCorrectAnswers % answersToNextGame;
  const answersLeft = answersToNextGame - currentProgress;
  const hasReachedGoal = sessionCorrectAnswers >= answersToNextGame;

  return (
    <>
      {showRefreshPrompt && (
        <RefreshPrompt onRefresh={handleRefresh} onDismiss={dismissPrompt} />
      )}
      
      {showDailyTip && <DailyTip onClose={handleCloseDailyTip} />}
      
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

          {/* הודעה מעניינת על 12 תשובות */}
          {!hasReachedGoal && (
            <Card className="mb-6 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 border-4 border-purple-400 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Star className="text-yellow-500 animate-pulse" size={28} />
                    <Target className="text-purple-600" size={28} />
                    <Trophy className="text-yellow-600 animate-bounce" size={28} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-2">
                    🎯 ענה על 12 תשובות נכונות וכנס לעולם המשחקים! 🎮
                  </h2>
                  <p className="text-base sm:text-lg text-purple-700 font-medium">
                    עוד {answersLeft} תשובות נכונות ותוכל לבחור במשחק הכי כיף! 
                  </p>
                  <div className="mt-3 text-sm text-purple-600">
                    ✨ כל תשובה נכונה מקרבת אותך למטרה ✨
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Button and Online Competition Button */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            {/* Chat Button */}
            <Button
              onClick={() => setShowChat(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3 relative min-h-[44px]"
            >
              <MessageCircle size={24} />
              הצ'אט שלי
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </Button>

            {/* Online Competition Button */}
            <Button
              onClick={() => navigate('/online-competition')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3 min-h-[44px]"
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

          {/* כפתור למשחקים אם הגיע ל-12 */}
          {hasReachedGoal && (
            <div className="mt-8 text-center">
              <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-4 border-green-400 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="text-yellow-500 animate-bounce" size={32} />
                    <Star className="text-yellow-400 animate-pulse" size={28} />
                    <Gamepad2 className="text-blue-500 animate-bounce" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-3">
                    🎉 מדהים! הגעת ל-12 תשובות נכונות! 🎉
                  </h3>
                  <p className="text-lg text-green-700 mb-4">
                    עכשיו אתה יכול להיכנס לעולם המשחקים ולבחור במשחק הכי כיף!
                  </p>
                  <Button
                    onClick={() => navigate("/games")}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 text-xl rounded-3xl drop-shadow font-bold animate-pulse shadow-xl min-h-[44px]"
                  >
                    🎮 בואו נשחק! 🎮
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {showMilestoneCongrats && <MilestoneCongrats />}
      </div>

      <ContactDialog isOpen={showContact} onClose={() => setShowContact(false)} />
      <MyCoins isOpen={showMyCoins} onClose={() => setShowMyCoins(false)} />
      <TipsRepository isOpen={showTipsRepository} onClose={() => setShowTipsRepository(false)} />
      <ChampionsTable isOpen={showChampionsTable} onClose={() => setShowChampionsTable(false)} />
      {selectedProfile && (
        <ChatSystem isOpen={showChat} onClose={() => setShowChat(false)} />
      )}
    </>
  );
}