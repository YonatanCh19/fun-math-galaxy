import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 60;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GAME_SPEED = 5;
const OBSTACLE_SPAWN_RATE = 1500; // ms

interface Obstacle {
  id: number;
  x: number;
}

export default function EndlessRunnerGame() {
  const [playerY, setPlayerY] = useState(260); // ground level
  const [playerVelY, setPlayerVelY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const obstacleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();

  const gameLoop = useCallback(() => {
    if (gameOver) return;

    // Player physics
    setPlayerVelY(prevVel => {
      const newVel = prevVel + GRAVITY;
      setPlayerY(prevY => {
        let newY = prevY + newVel;
        if (newY >= 260) { // Hit ground
          newY = 260;
        }
        return newY;
      });
      return newVel;
    });

    // Move obstacles
    setObstacles(prevObstacles =>
      prevObstacles
        .map(o => ({ ...o, x: o.x - GAME_SPEED }))
        .filter(o => o.x > -OBSTACLE_WIDTH)
    );
    
    // Increment score
    setScore(prev => prev + 1);

    // Collision detection
    const playerRect = { x: 50, y: playerY, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
    for (const obstacle of obstacles) {
      const obstacleRect = { x: obstacle.x, y: 320 - OBSTACLE_HEIGHT, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT };
      if (
        playerRect.x < obstacleRect.x + obstacleRect.width &&
        playerRect.x + playerRect.width > obstacleRect.x &&
        playerRect.y < obstacleRect.y + obstacleRect.height &&
        playerRect.y + playerRect.height > obstacleRect.y
      ) {
        setGameOver(true);
        break;
      }
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameOver, obstacles, playerY]);
  
  const handleJump = useCallback((e: Event) => {
    e.preventDefault();
    setPlayerY(py => {
      if (py >= 260) { // Only jump from the ground
        setPlayerVelY(JUMP_FORCE);
      }
      return py;
    });
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const jumpHandler = (e: KeyboardEvent) => { if (e.code === 'Space') handleJump(e); };
      const touchHandler = (e: TouchEvent) => handleJump(e);
      const clickHandler = (e: MouseEvent) => handleJump(e);

      window.addEventListener('keydown', jumpHandler);
      window.addEventListener('touchstart', touchHandler);
      window.addEventListener('mousedown', clickHandler);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      return () => {
        window.removeEventListener('keydown', jumpHandler);
        window.removeEventListener('touchstart', touchHandler);
        window.removeEventListener('mousedown', clickHandler);
        if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      };
    }
  }, [gameStarted, gameOver, gameLoop, handleJump]);
  
  useEffect(() => {
    if (gameStarted && !gameOver) {
      obstacleIntervalRef.current = setInterval(() => {
        setObstacles(prev => [...prev, { id: Date.now(), x: gameAreaRef.current?.offsetWidth || 800 }]);
      }, OBSTACLE_SPAWN_RATE);
      
      return () => {
        if (obstacleIntervalRef.current) {
          clearInterval(obstacleIntervalRef.current);
          obstacleIntervalRef.current = null;
        }
      };
    }
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver) {
      if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      toast.error(`הפסדת! הניקוד שלך: ${score}`, {
        description: 'חוזר לתרגול בעוד 3 שניות...',
        duration: 3000,
      });
      redirectTimeoutRef.current = setTimeout(() => nav('/practice'), 3000);
    }
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [gameOver, score, nav]);

  const startGame = () => {
    setPlayerY(260);
    setPlayerVelY(0);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

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

        <h1 className="text-6xl font-extrabold text-blueKid mb-4 drop-shadow-lg animate-bounce">🏃‍♂️ רץ אינסופי 🏃‍♀️</h1>
        <p className="text-2xl text-pinkKid mb-8 max-w-md">
          לחצו על מקש הרווח, או על המסך, כדי לקפוץ מעל המכשולים ולאסוף נקודות!
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

      <div className="text-3xl font-bold mb-4 bg-white/70 text-pinkKid px-4 py-2 rounded-lg shadow-md">ניקוד: {score}</div>
      <div 
        ref={gameAreaRef}
        className="relative w-full max-w-[800px] h-[320px] bg-white/50 border-4 border-blueKid rounded-lg shadow-inner overflow-hidden"
      >
        <div className="absolute bottom-0 left-0 w-full h-5 bg-lime-600" />
        <div
          className="absolute bg-pinkKid rounded-md shadow-lg"
          style={{
            left: '50px',
            bottom: `${320 - playerY - PLAYER_HEIGHT}px`,
            width: `${PLAYER_WIDTH}px`,
            height: `${PLAYER_HEIGHT}px`,
          }}
        />
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className="absolute bg-orange-500"
            style={{
              left: `${obstacle.x}px`,
              bottom: '0px',
              width: `${OBSTACLE_WIDTH}px`,
              height: `${OBSTACLE_HEIGHT}px`,
            }}
          />
        ))}
      </div>
       <p className="mt-4 text-blueKid/80">לחצו על מקש הרווח או על המסך כדי לקפוץ</p>
    </div>
  );
}