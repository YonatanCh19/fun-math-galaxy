import React from 'react';
import { Trophy, Coins, Target, Star, Gamepad2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type StatsBarProps = {
  correct: number;
  total: number;
  trophies: number;
  sessionCorrectAnswers?: number;
};

export default function StatsBar({ correct, total, trophies, sessionCorrectAnswers = 0 }: StatsBarProps) {
  console.log("Rendering: StatsBar");
  
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  // חישוב התקדמות למשחק הבא (כל 12 תשובות נכונות)
  const answersToNextGame = 12;
  const currentProgress = sessionCorrectAnswers % answersToNextGame;
  const progressPercentage = (currentProgress / answersToNextGame) * 100;
  const answersLeft = answersToNextGame - currentProgress;
  
  // אם הגיע ל-12, הצג הודעת הצלחה
  const hasReachedGoal = sessionCorrectAnswers >= answersToNextGame;

  return (
    <div className="flex flex-col gap-2 text-xs sm:text-sm">
      {/* מד התקדמות למשחק */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border-2 border-purple-300 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-purple-600" size={16} />
            <span className="font-bold text-purple-800">
              {hasReachedGoal ? "🎉 מוכן למשחק!" : "דרך למשחקים"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-purple-700 font-bold">
            <Target size={14} />
            <span>{currentProgress}/{answersToNextGame}</span>
          </div>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-3 bg-purple-200" 
          indicatorClassName={hasReachedGoal ? "bg-gradient-to-r from-green-500 to-blue-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}
        />
        
        <div className="mt-2 text-center">
          {hasReachedGoal ? (
            <div className="text-green-700 font-bold flex items-center justify-center gap-1 animate-pulse">
              <Star className="text-yellow-500" size={14} />
              <span>כנס לעולם המשחקים!</span>
              <Star className="text-yellow-500" size={14} />
            </div>
          ) : (
            <span className="text-purple-700 font-medium">
              עוד {answersLeft} תשובות נכונות למשחק חינם! 🎮
            </span>
          )}
        </div>
      </div>

      {/* סטטיסטיקות כלליות */}
      <div className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 shadow">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold">{correct}</span>
            <span className="text-gray-500">/</span>
            <span className="text-blue-600 font-bold">{total}</span>
          </div>
          <span className="text-gray-600">({accuracy}%)</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Trophy className="text-yellow-600" size={14} />
          <span className="font-bold text-yellow-700">{trophies}</span>
        </div>
      </div>
    </div>
  );
}