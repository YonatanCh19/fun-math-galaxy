import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const GAME_DURATION = 60; // 1 minute
const BALLOON_SPAWN_RATE = 1000; // ms
const BALLOON_SPEED = 2; // pixels per frame

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

const BALLOON_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

export default function BalloonPopGame() {
  console.log("Rendering: BalloonPopGame");
  
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const balloonIdRef = useRef(0);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();

  const spawnBalloon = useCallback(() => {
    if (!gameAreaRef.current) return;
    
    const gameArea = gameAreaRef.current;
    const newBalloon: Balloon = {
      id: balloonIdRef.current++,
      x: Math.random() * (gameArea.offsetWidth - 60),
      y: gameArea.offsetHeight,
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      size: Math.random() * 20 + 40, // 40-60px
    };
    
    setBalloons(prev => [...prev, newBalloon]);
  }, []);

  const popBalloon = useCallback((id: number) => {
    setBalloons(prev => prev.filter(balloon => balloon.id !== id));
    setScore(prev => prev + 10);
  }, []);

  const gameLoop = useCallback(() => {
    setBalloons(prev => 
      prev
        .map(balloon => ({ ...balloon, y: balloon.y - BALLOON_SPEED }))
        .filter(balloon => balloon.y > -100)
    );
    
    if (gameStarted && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBalloons([]);
    
    // Start spawning balloons
    spawnIntervalRef.current = setInterval(spawnBalloon, BALLOON_SPAWN_RATE);
    
    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (gameOver) {
      // Cleanup intervals
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Redirect after 3 seconds
      redirectTimeoutRef.current = setTimeout(() => nav('/practice'), 3000);
    }
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [gameOver, nav]);

  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-6 text-center">
        {/* כפתור חזרה */}
        <div className="w-full max-w-4xl flex justify-start mb-4">
          <Button
            onClick={() => nav("/practice")}
            variant="ghost"
            className="bg-white/80 text-blue-800 hover:bg-white hover:scale-105 transition-transform flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            חזרה לתרגול
          </Button>
        </div>

        <h1 className="text-6xl font-extrabold text-blueKid mb-4 drop-shadow-lg animate-bounce">🎈 פיצוץ בלונים 🎈</h1>
        <p className="text-2xl text-pinkKid mb-8 max-w-md">
          לחצו על הבלונים לפני שהם יברחו! יש לכם דקה אחת לצבור כמה שיותר נקודות!
        </p>
        <Button onClick={startGame} className="bg-greenKid text-white text-2xl px-10 py-5 rounded-full hover:bg-green-500 transform hover:scale-105 transition-transform duration-200 animate-pulse shadow-2xl border-4 border-white">
          🚀 התחל משחק 🚀
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-turquoiseKid/20 text-blueKid font-varela select-none">
      {/* כפתור חזרה */}
      <div className="w-full max-w-4xl flex justify-start mb-4 px-4">
        <Button
          onClick={() => nav("/practice")}
          variant="ghost"
          className="bg-white/80 text-blue-800 hover:bg-white hover:scale-105 transition-transform flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          חזרה לתרגול
        </Button>
      </div>

      <div className="flex justify-between items-center w-full max-w-4xl px-4 mb-4">
        <div className="text-3xl font-bold bg-white/70 text-pinkKid px-4 py-2 rounded-lg shadow-md">ניקוד: {score}</div>
        <div className="text-3xl font-bold bg-white/70 text-blueKid px-4 py-2 rounded-lg shadow-md">זמן: {timeLeft}</div>
      </div>
      
      <div 
        ref={gameAreaRef}
        className="relative w-full max-w-4xl h-[500px] bg-white/50 border-4 border-blueKid rounded-lg shadow-inner overflow-hidden"
      >
        {balloons.map(balloon => (
          <div
            key={balloon.id}
            className="absolute cursor-pointer transform hover:scale-110 transition-transform duration-100"
            style={{
              left: balloon.x,
              bottom: `${500 - balloon.y}px`,
              width: balloon.size,
              height: balloon.size,
              backgroundColor: balloon.color,
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }}
            onClick={() => popBalloon(balloon.id)}
          />
        ))}
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 text-white rounded-md flex flex-col items-center justify-center z-10 animate-fade-in">
            <h2 className="text-6xl font-bold text-yellow-400 mb-4">🎉 כל הכבוד! 🎉</h2>
            <p className="text-3xl mb-4">הניקוד שלך: {score}</p>
            <p className="text-xl text-gray-200 animate-pulse">חוזר לתרגול בעוד 3 שניות...</p>
          </div>
        )}
      </div>
      
      <p className="mt-4 text-blueKid/80">לחצו על הבלונים לפני שהם יברחו!</p>
    </div>
  );
}