import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const GAME_DURATION = 45;

type Balloon = {
  id: number;
  x: number;
  color: string;
  size: number;
  speed: number;
};

const colors = ['#ff72a6', '#fff685', '#77e7a6', '#6feaff', '#55aaff', '#ffae72'];

export default function BalloonPopGame() {
  console.log("Rendering: BalloonPopGame");
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const balloonIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBalloons([]);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver) {
      redirectTimeoutRef.current = setTimeout(() => nav('/practice'), 2500);
    }
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [gameOver, nav]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    balloonIntervalRef.current = setInterval(() => {
      const newBalloon: Balloon = {
        id: Date.now(),
        x: Math.random() * 90,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 40 + 40,
        speed: Math.random() * 3 + 4, // 4 to 7 seconds
      };
      setBalloons(prev => [...prev, newBalloon]);
    }, 700);

    return () => {
      if (balloonIntervalRef.current) {
        clearInterval(balloonIntervalRef.current);
        balloonIntervalRef.current = null;
      }
    };
  }, [gameStarted, gameOver]);

  const popBalloon = (id: number) => {
    if (gameOver) return;
    setBalloons(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 10);
  };

  const handleBalloonAnimationEnd = (id: number) => {
     setBalloons(prev => prev.filter(b => b.id !== id));
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-6 text-center">
        <h1 className="text-5xl font-extrabold text-blueKid mb-4 drop-shadow-lg">פיצוץ בלונים!</h1>
        <p className="text-xl text-pinkKid mb-8">פוצצו כמה שיותר בלונים ב-45 שניות!</p>
        <Button onClick={startGame} className="bg-greenKid text-white text-2xl px-8 py-4 rounded-2xl hover:bg-green-500 transform hover:scale-105 transition-transform duration-200">
          התחל משחק
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-kidGradient font-varela p-6 text-center relative overflow-hidden select-none">
      <div className="w-full flex justify-between items-center text-2xl font-bold mb-4 z-10">
        <div className="text-pinkKid bg-white/70 px-4 py-2 rounded-lg shadow-md">ניקוד: {score}</div>
        <div className="text-blueKid bg-white/70 px-4 py-2 rounded-lg shadow-md">זמן: {timeLeft}</div>
      </div>

      <div className="w-full h-[80vh] relative">
        {balloons.map(balloon => (
          <div
            key={balloon.id}
            className="absolute bottom-[-150px] animate-rise cursor-pointer"
            style={{
              left: `${balloon.x}%`,
              width: `${balloon.size}px`,
              height: `${balloon.size * 1.3}px`,
              animationDuration: `${balloon.speed}s`,
            }}
            onAnimationEnd={() => handleBalloonAnimationEnd(balloon.id)}
            onClick={() => popBalloon(balloon.id)}
          >
            <div 
              className="w-full h-full rounded-[50%]"
              style={{ backgroundColor: balloon.color, boxShadow: `0 0 10px ${balloon.color}` }}
            />
             <div 
                className="w-2 h-4 absolute bottom-[-5px] left-1/2 -translate-x-1/2"
                style={{
                  backgroundColor: balloon.color,
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  transform: 'rotate(180deg)'
                }}
             />
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-20 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center border-4 border-yellowKid">
            <h2 className="text-4xl font-bold text-greenKid mb-4">הזמן נגמר!</h2>
            <p className="text-2xl text-blue-900 mb-6">כל הכבוד! צברת {score} נקודות!</p>
            <p className="text-lg text-blue-800 animate-pulse">מיד תועברו חזרה לתרגולים...</p>
          </div>
        </div>
      )}
    </div>
  );
}
