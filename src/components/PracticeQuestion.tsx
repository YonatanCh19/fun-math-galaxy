
import React, { useState, useEffect, useRef } from "react";
import { getRandomQuestion, MathType } from "@/lib/mathUtils";
import AnimatedTrophy from "./AnimatedTrophy";
import StatsBar from "./StatsBar";
import FullScreenTrophy from "./FullScreenTrophy";
import ConfettiAnimation from "./ConfettiAnimation";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { getUserProgress, updateUserProgress, UserProgress } from "@/lib/progressUtils";
import { Profile } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

const correctSound = new Audio("/sounds/success.mp3");
correctSound.volume = 0.5;

const playSuccessSound = () => {
    try {
        if (!correctSound.paused) {
            correctSound.pause();
            correctSound.currentTime = 0;
        }
        correctSound.play().catch(e => console.error("Error playing sound:", e));
    } catch (e) {
        console.error("Could not play audio:", e);
    }
};

const cleanupMedia = () => {
  try {
    if (!correctSound.paused) {
      correctSound.pause();
      correctSound.currentTime = 0;
    }
  } catch (e) {
    console.error("Error cleaning up audio:", e);
  }
};

export default function PracticeQuestion({
  user,
  profile,
  type,
  onAwardTrophy,
  onDone,
}: {
  user: User | null;
  profile: Profile;
  type: MathType;
  onAwardTrophy: () => void;
  onDone: (stats: {correct: number, total: number, trophies: number}) => void;
}) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<UserProgress>({ correct: 0, total: 0, trophies: 0, coins: 0, free_games: 0 });
  const [q, setQ] = useState(() => getRandomQuestion(type));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showFullScreenTrophy, setShowFullScreenTrophy] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [tip, setTip] = useState("");
  const [solution, setSolution] = useState("");
  const [attempted, setAttempted] = useState(false);
  const nextQuestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const resetForNewQuestion = () => {
    setQ(getRandomQuestion(type));
    setStatus("idle");
    setSelectedAnswer(null);
    setFeedback("");
    setTip("");
    setSolution("");
    setAttempted(false);
    setShowConfetti(false);
  };

  useEffect(() => {
    if (profile) {
      getUserProgress(profile.id).then(p => {
        setProgress(p);
      });
    }
    resetForNewQuestion();

    return () => {
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
        nextQuestionTimeoutRef.current = null;
      }
      cleanupMedia();
    };
  }, [type, profile]);

  function loadNextQuestion() {
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }
    cleanupMedia();
    resetForNewQuestion();
  }

  async function handleAnswerSelect(answer: number) {
    if (status === "correct" || !user || !profile) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === q.answer;

    if (isCorrect) {
      playSuccessSound();
      setShowConfetti(true);
      setStatus("correct");
      setFeedback(t('correct_answer_feedback'));
      setTip(t('tip_prefix') + q.tip);
      setSolution(q.solution);

      const newTotalCorrect = progress.correct + 1;
      const newTotal = !attempted ? progress.total + 1 : progress.total;

      // הגביעים ייתנו כל 12 תשובות נכונות במקום כל 3
      const oldTrophiesFromCorrect = Math.floor(progress.correct / 12);
      const newTrophiesFromCorrect = Math.floor(newTotalCorrect / 12);
      const trophiesGained = newTrophiesFromCorrect - oldTrophiesFromCorrect;
      const newTrophies = progress.trophies + trophiesGained;

      let newCoins = progress.coins;
      if (newTotalCorrect > 0 && newTotalCorrect % 12 === 0) {
          newCoins += 1;
          toast.success(t('coin_win_toast_title'), {
            description: t('coin_win_toast_desc', { count: newCoins }),
            icon: '🪙',
          });
      }

      const newProgress: UserProgress = {
          correct: newTotalCorrect,
          total: newTotal,
          trophies: newTrophies,
          coins: newCoins,
          free_games: progress.free_games,
      };

      await updateUserProgress(profile.id, newProgress);
      setProgress(newProgress);
      onDone({ correct: newProgress.correct, total: newProgress.total, trophies: newProgress.trophies });
      
      setAttempted(true);

      const trophyWon = newProgress.trophies > progress.trophies;

      if (trophyWon) {
        onAwardTrophy();
        setShowFullScreenTrophy(true);
      } else {
        nextQuestionTimeoutRef.current = setTimeout(() => {
            loadNextQuestion();
        }, 2100);
      }
    } else {
      setStatus("wrong");
      setFeedback(t('wrong_answer_feedback'));
      setTip(t('tip_prefix') + q.tip);
      setSolution("");
      if (!attempted) {
        const newProgressData = { total: progress.total + 1 };
        await updateUserProgress(profile.id, newProgressData);
        const newProgressState = { ...progress, ...newProgressData };
        setProgress(newProgressState);
        onDone({ correct: newProgressState.correct, total: newProgressState.total, trophies: newProgressState.trophies });
        setAttempted(true);
      }
    }
  }

  const getTypeLabel = (type: MathType) => {
    if (type === "mixed") {
      return "מיקס תרגילים";
    }
    return t(type);
  };

  return (
    <>
      {showConfetti && <ConfettiAnimation onComplete={() => setShowConfetti(false)} />}
      {showFullScreenTrophy && <FullScreenTrophy onEnd={() => {
        setShowFullScreenTrophy(false);
        loadNextQuestion();
      }} />}
      <div className="w-full max-w-xl mx-auto mt-4 sm:mt-8 flex flex-col items-center bg-white/80 rounded-3xl p-4 sm:p-8 shadow-2xl border-4 border-blueKid">
        <div className="flex flex-col sm:flex-row-reverse justify-between items-center w-full mb-3 gap-2">
          <div className="bg-pinkKid text-white px-4 sm:px-6 py-2 rounded-xl font-bold text-lg sm:text-2xl border-b-4 border-yellowKid shadow text-center">
            {t('practice_title', { type: getTypeLabel(type) })}
          </div>
          <StatsBar correct={progress.correct} total={progress.total} trophies={progress.trophies} />
        </div>
        
        <div className="w-full mt-4 sm:mt-6 flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-4 sm:mb-6 text-center">
            {q.question} = ?
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-md">
            {q.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={status === "correct"}
                className={`
                  py-3 sm:py-4 px-4 sm:px-6 rounded-2xl text-xl sm:text-2xl font-bold shadow-md transition-all duration-200
                  ${status === "idle" 
                    ? "bg-yellowKid text-blue-900 hover:scale-105 hover:shadow-lg active:scale-95" 
                    : selectedAnswer === option
                      ? option === q.answer
                        ? "bg-greenKid text-white scale-105"
                        : "bg-red-400 text-white"
                      : option === q.answer && status === "wrong"
                        ? "bg-greenKid text-white scale-105"
                        : "bg-gray-300 text-gray-500"
                  }
                  ${status === 'correct' ? "cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        {(status === "correct" || status === "wrong") && (
          <div className="w-full mt-4 sm:mt-6 rounded-xl p-3 sm:p-4 pr-2 font-varela text-right animate-fade-in"
            style={{
              background: status === "correct" ? "linear-gradient(90deg, #e6ffcc 0%, #fff1c9 100%)" : "#fff1c9",
              border: status === "correct" ? "2px solid #77e7a6" : "2px solid #ffb4b4",
              color: status === "correct" ? "#25ad65" : "#de3c50"
            }}
          >
            <div className="text-lg sm:text-xl font-bold mb-1">{feedback}</div>
            {solution && <div className="mb-1 text-sm sm:text-base">{t('solution_prefix')}{solution}</div>}
            <div className="text-sm sm:text-md">{tip}</div>
          </div>
        )}
      </div>
    </>
  );
}
