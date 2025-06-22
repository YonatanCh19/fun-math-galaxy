
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, Trophy, Users, Crown, Gift } from 'lucide-react';
import { renderAvatarByType, AvatarCharacter } from '@/components/AvatarSelector';
import OptimizedPracticeQuestion from '@/components/OptimizedPracticeQuestion';
import { awardFreeGame } from '@/lib/progressUtils';
import ConfettiAnimation from '@/components/ConfettiAnimation';

type Competition = {
  id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  status: string;
  winner_id?: string;
  started_at?: string;
  ended_at?: string;
  player1_profile?: {
    id: string;
    name: string;
    avatar_character?: string;
  };
  player2_profile?: {
    id: string;
    name: string;
    avatar_character?: string;
  };
};

const WINNING_SCORE = 15;

export default function OnlineGame() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const { user, selectedProfile } = useAuth();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const channelRef = useRef<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const fetchCompetition = useCallback(async () => {
    if (!competitionId) {
      console.error('No competition ID provided');
      navigate('/online-competition');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(competitionId)) {
      console.error('Invalid competition ID format:', competitionId);
      toast.error('מזהה תחרות לא תקין');
      navigate('/online-competition');
      return;
    }

    try {
      console.log('Fetching competition:', competitionId);
      
      const { data, error } = await supabase
        .from('online_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (error) {
        console.error('Error fetching competition:', error);
        toast.error('שגיאה בטעינת התחרות');
        navigate('/online-competition');
        return;
      }

      if (!data) {
        console.error('Competition not found');
        toast.error('התחרות לא נמצאה');
        navigate('/online-competition');
        return;
      }

      console.log('Competition data fetched:', data);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_character')
        .in('id', [data.player1_id, data.player2_id]);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const competitionWithProfiles = {
        ...data,
        player1_profile: profiles?.find(p => p.id === data.player1_id),
        player2_profile: profiles?.find(p => p.id === data.player2_id),
      } as Competition;

      console.log('Competition with profiles:', competitionWithProfiles);
      setCompetition(competitionWithProfiles);

      if (data.status === 'completed' || data.winner_id) {
        setGameEnded(true);
        if (selectedProfile && data.winner_id === selectedProfile.id) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }

    } catch (error) {
      console.error('Error in fetchCompetition:', error);
      toast.error('שגיאה בטעינת התחרות');
      navigate('/online-competition');
    } finally {
      setLoading(false);
    }
  }, [competitionId, navigate, selectedProfile]);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      try {
        console.log('Cleaning up competition channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      } catch (error) {
        console.error('Error cleaning up competition channel:', error);
      }
    }
  }, []);

  const subscribeToCompetition = useCallback(() => {
    if (!competitionId || isSubscribed || channelRef.current) {
      console.log('Skipping subscription - already subscribed or missing ID');
      return;
    }

    const uniqueChannelName = `game-${competitionId}-${Date.now()}`;
    console.log('Subscribing to competition updates:', uniqueChannelName);

    try {
      channelRef.current = supabase
        .channel(uniqueChannelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'online_competitions',
            filter: `id=eq.${competitionId}`
          },
          (payload) => {
            console.log('Competition update received:', payload);
            if (payload.new && payload.eventType === 'UPDATE') {
              const updatedData = payload.new as Competition;
              console.log('Updating competition state with:', updatedData);
              setCompetition(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  player1_score: updatedData.player1_score,
                  player2_score: updatedData.player2_score,
                  status: updatedData.status,
                  winner_id: updatedData.winner_id,
                  ended_at: updatedData.ended_at
                };
              });
              
              if (updatedData.status === 'completed' || updatedData.winner_id) {
                setGameEnded(true);
                if (selectedProfile && updatedData.winner_id === selectedProfile.id) {
                  setShowConfetti(true);
                  setTimeout(() => setShowConfetti(false), 5000);
                }
              }
            }
            fetchCompetition();
          }
        )
        .subscribe((status) => {
          console.log('Competition channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Competition channel subscription error');
            setIsSubscribed(false);
          }
        });
    } catch (error) {
      console.error('Error creating competition channel:', error);
    }
  }, [competitionId, fetchCompetition, selectedProfile, isSubscribed]);

  useEffect(() => {
    if (!user || !selectedProfile) {
      navigate('/practice');
      return;
    }

    const savedCompetitionId = localStorage.getItem('currentCompetitionId');
    if (savedCompetitionId && savedCompetitionId === competitionId) {
      console.log('Restoring competition from localStorage');
    }

    if (competitionId) {
      localStorage.setItem('currentCompetitionId', competitionId);
    }

    console.log('Starting game setup for competition:', competitionId);
    fetchCompetition();
    subscribeToCompetition();

    return () => {
      console.log('Cleaning up OnlineGame component');
      cleanupChannel();
    };
  }, [user, selectedProfile, competitionId, fetchCompetition, subscribeToCompetition, cleanupChannel]);

  const handleCorrectAnswer = useCallback(async () => {
    if (!competition || !selectedProfile || gameEnded) {
      console.log('Cannot handle answer - missing data or game ended');
      return;
    }

    try {
      const isPlayer1 = competition.player1_id === selectedProfile.id;
      const currentScore = isPlayer1 ? competition.player1_score : competition.player2_score;
      const newScore = currentScore + 1;

      console.log(`Player ${selectedProfile.name} (${isPlayer1 ? 'Player1' : 'Player2'}) scored! New score: ${newScore}`);

      const updateData: Partial<Competition> = {
        ...(isPlayer1 ? { player1_score: newScore } : { player2_score: newScore })
      };

      // Check for win condition (15 points)
      if (newScore >= WINNING_SCORE) {
        updateData.status = 'completed';
        updateData.winner_id = selectedProfile.id;
        updateData.ended_at = new Date().toISOString();
        
        console.log('Game ended! Winner:', selectedProfile.id);
        setGameEnded(true);
        setShowConfetti(true);
        
        const success = await awardFreeGame(selectedProfile.id);
        if (success) {
          toast.success('🎉 ניצחת והרווחת משחק חינם!', {
            description: 'המשחק החינם נוסף לחשבונך ב"המטבעות שלי"',
            icon: '🎮',
            duration: 5000,
          });
        }
        
        localStorage.removeItem('currentCompetitionId');
        
        setTimeout(() => {
          setShowConfetti(false);
          navigate('/online-competition');
        }, 5000);
      }

      console.log('Updating competition with data:', updateData);

      const { error } = await supabase
        .from('online_competitions')
        .update(updateData)
        .eq('id', competition.id);

      if (error) {
        console.error('Error updating score:', error);
        toast.error('שגיאה בעדכון הניקוד');
      } else {
        console.log('Score updated successfully in database');
        
        setCompetition(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...updateData
          };
        });
      }

    } catch (error) {
      console.error('Error handling correct answer:', error);
      toast.error('שגיאה בעדכון הניקוד');
    }
  }, [competition, selectedProfile, gameEnded, navigate]);

  if (!user || !selectedProfile) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
        <LoadingSpinner message="טוען משחק..." size="lg" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela p-4">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">שגיאה בטעינת המשחק</p>
          <button
            onClick={() => navigate('/online-competition')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold"
          >
            חזרה לתחרות אונליין
          </button>
        </div>
      </div>
    );
  }

  const isPlayer1 = competition.player1_id === selectedProfile.id;
  const currentPlayerScore = isPlayer1 ? competition.player1_score : competition.player2_score;
  const opponentScore = isPlayer1 ? competition.player2_score : competition.player1_score;
  const opponentProfile = isPlayer1 ? competition.player2_profile : competition.player1_profile;

  return (
    <>
      {showConfetti && <ConfettiAnimation onComplete={() => setShowConfetti(false)} />}
      <div className="min-h-screen bg-kidGradient font-varela p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                localStorage.removeItem('currentCompetitionId');
                navigate('/online-competition');
              }}
              className="flex items-center gap-2 bg-white/80 text-blue-800 px-4 py-2 rounded-lg shadow hover:scale-105 transition"
            >
              <ArrowLeft size={20} />
              חזרה לתחרויות
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-pinkKid flex items-center gap-2">
              <Trophy size={28} />
              משחק תחרותי
            </h1>
          </div>

          {/* Score Board */}
          <div className="bg-white/90 rounded-xl p-4 md:p-6 mb-6 shadow-lg">
            <div className="grid grid-cols-3 items-center gap-4">
              {/* Current Player */}
              <div className="text-center">
                <div className="flex flex-col items-center gap-2">
                  {renderAvatarByType(selectedProfile.avatar_character as AvatarCharacter, 'md')}
                  <div>
                    <p className="font-bold text-blue-900 text-sm md:text-base">{selectedProfile.name}</p>
                    <p className="text-xs md:text-sm text-green-600">אתה</p>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-900 bg-blue-100 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                    {currentPlayerScore}
                  </div>
                </div>
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-gray-600">VS</div>
                <div className="text-xs md:text-sm text-gray-500">עד {WINNING_SCORE} נקודות</div>
                {gameEnded && competition.winner_id && (
                  <div className="mt-2">
                    {competition.winner_id === selectedProfile.id ? (
                      <div className="text-green-600 font-bold flex items-center justify-center gap-2 text-sm md:text-base">
                        <Crown size={20} />
                        ניצחת!
                      </div>
                    ) : (
                      <div className="text-red-600 font-bold text-sm md:text-base">הפסדת</div>
                    )}
                  </div>
                )}
              </div>

              {/* Opponent */}
              <div className="text-center">
                <div className="flex flex-col items-center gap-2">
                  {opponentProfile && renderAvatarByType(opponentProfile.avatar_character as AvatarCharacter, 'md')}
                  <div>
                    <p className="font-bold text-blue-900 text-sm md:text-base">{opponentProfile?.name || 'יריב'}</p>
                    <p className="text-xs md:text-sm text-red-600">יריב</p>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-red-900 bg-red-100 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                    {opponentScore}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Status */}
          {gameEnded ? (
            <div className="bg-white/90 rounded-xl p-4 md:p-6 shadow-lg text-center">
              <div className="text-xl md:text-2xl font-bold mb-4">
                {competition.winner_id === selectedProfile.id ? (
                  <div className="text-green-600 flex items-center justify-center gap-2">
                    <Crown size={32} />
                    <Gift size={32} />
                    מזל טוב! ניצחת והרווחת משחק חינם!
                  </div>
                ) : (
                  <div className="text-red-600">המשחק הסתיים - הפסדת</div>
                )}
              </div>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                {competition.winner_id === selectedProfile.id 
                  ? 'המשחק החינם נוסף לחשבונך. בדוק ב"המטבעות שלי"'
                  : 'בפעם הבאה תצליח יותר!'
                }
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('currentCompetitionId');
                  navigate('/online-competition');
                }}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition"
              >
                חזרה לתחרויות
              </button>
            </div>
          ) : (
            <>
              {/* Game Instructions */}
              <div className="bg-blue-100 rounded-xl p-4 mb-6 border-2 border-blue-300">
                <p className="text-blue-900 font-bold text-center text-sm md:text-base">
                  📝 פתור תרגילי מיקס נכון כדי לקבל נקודות • המגיע ראשון ל-{WINNING_SCORE} נקודות מנצח!
                </p>
              </div>

              {/* Practice Question */}
              <div className="bg-white/90 rounded-xl p-4 md:p-6 shadow-lg">
                <OptimizedPracticeQuestion
                  key={`online-${selectedProfile.id}-${competition.id}`}
                  user={user}
                  profile={selectedProfile}
                  type="mixed"
                  onAwardTrophy={() => {}}
                  onDone={() => {}}
                  sessionCorrectAnswers={0}
                  onCorrectAnswer={handleCorrectAnswer}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
