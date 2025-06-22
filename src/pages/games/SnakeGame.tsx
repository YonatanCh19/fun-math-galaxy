import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import GameControls from '@/components/GameControls';

const GRID_SIZE = 20;
const INITIAL_GAME_SPEED_MS = 200;
const SPEED_INCREMENT = 5;

const getRandomCoord = (snakeBody: number[][] = []): [number, number] => {
  let newFood: [number, number];
  do {
    newFood = [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE),
    ];
  } while (snakeBody.some(seg => seg[0] === newFood[0] && seg[1] === newFood[1]));
  return newFood;
};

export default function SnakeGame() {
  const getInitialSnake = () => [[8, 10], [8, 9], [8, 8]];
  
  const isMobile = useIsMobile();
  const CELL_SIZE = isMobile ? 16 : 20;

  const [snake, setSnake] = useState(getInitialSnake());
  const [food, setFood] = useState(() => getRandomCoord(getInitialSnake()));
  const [direction, setDirection] = useState([0, 1]); // [y, x] - right
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_GAME_SPEED_MS);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    switch (e.key) {
      case 'ArrowUp':
        if (direction[0] !== 1) setDirection([-1, 0]);
        break;
      case 'ArrowDown':
        if (direction[0] !== -1) setDirection([1, 0]);
        break;
      case 'ArrowLeft':
        if (direction[1] !== 1) setDirection([0, -1]);
        break;
      case 'ArrowRight':
        if (direction[1] !== -1) setDirection([0, 1]);
        break;
      default:
        break;
    }
  }, [direction]);

  useEffect(() => {
    if (!isGameRunning || isGameOver) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGameRunning, isGameOver, handleKeyDown]);

  const resetGame = () => {
    const initialSnake = getInitialSnake();
    setSnake(initialSnake);
    setFood(getRandomCoord(initialSnake));
    setDirection([0, 1]);
    setIsGameOver(false);
    setIsGameRunning(true);
    setScore(0);
    setSpeed(INITIAL_GAME_SPEED_MS);
  };

  useEffect(() => {
    if (isGameOver) {
      redirectTimeoutRef.current = setTimeout(() => nav('/practice'), 2500);
    }
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [isGameOver, nav]);

  useEffect(() => {
    if (!isGameRunning || isGameOver) return;

    gameIntervalRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = [newSnake[0][0] + direction[0], newSnake[0][1] + direction[1]];

        // Wall collision
        if (
          head[0] < 0 || head[0] >= GRID_SIZE ||
          head[1] < 0 || head[1] >= GRID_SIZE
        ) {
          setIsGameOver(true);
          return prevSnake;
        }

        // Self collision
        for (const segment of newSnake.slice(1)) {
          if (head[0] === segment[0] && head[1] === segment[1]) {
            setIsGameOver(true);
            return prevSnake;
          }
        }
        
        newSnake.unshift(head);

        // Food collision
        if (head[0] === food[0] && head[1] === food[1]) {
          setScore(s => s + 10);
          setSpeed(s => Math.max(50, s - SPEED_INCREMENT)); // Increase speed
          setFood(getRandomCoord(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
    };
  }, [snake, direction, food, isGameRunning, isGameOver, speed]);
  
  const startGame = () => {
      setIsGameRunning(true);
      resetGame();
  }

  if (!isGameRunning) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-6 text-center">
        <h1 className="text-5xl font-extrabold text-blueKid mb-4">סנייק 🐍</h1>
        <p className="text-2xl text-pinkKid mb-8 max-w-md">
          השתמשו במקשי החצים כדי להזיז את הנחש, לאכול את הפירות ולהיזהר לא להתנגש בקירות או בעצמכם!
        </p>
        <Button onClick={startGame} className="bg-greenKid text-white px-8 py-4 rounded-3xl text-xl drop-shadow hover:bg-green-500 font-bold animate-pulse">
          התחל משחק
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-4 sm:p-6 text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-blueKid mb-2">סנייק</h1>
      <div className="text-xl sm:text-2xl text-pinkKid font-bold mb-4">ניקוד: {score}</div>
      
      <div 
        className="bg-orangeKid/50 border-4 border-yellowKid rounded-lg grid relative"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          direction: 'ltr',
        }}
      >
        {isGameOver && (
          <div 
            className="absolute inset-0 bg-black/70 text-white rounded-md flex flex-col items-center justify-center z-10 animate-fade-in"
          >
            <h2 className="text-4xl font-bold text-red-500 mb-2">אופס! נפסלת</h2>
            <p className="text-xl mb-4">הניקוד שלך: {score}</p>
            <p className="text-lg text-gray-200 animate-pulse">מיד תועברו חזרה לתרגולים...</p>
          </div>
        )}
        {snake.map(([y, x], index) => (
          <div
            key={index}
            className={`rounded-sm ${index === 0 ? 'bg-green-700' : 'bg-green-500'}`}
            style={{ gridRow: y + 1, gridColumn: x + 1, boxShadow: index === 0 ? '0 0 5px #fff' : 'none' }}
          />
        ))}
        <div
          className="bg-red-500 rounded-full animate-pulse"
          style={{ gridRow: food[0] + 1, gridColumn: food[1] + 1 }}
        />
      </div>
      {isMobile && isGameRunning && !isGameOver && (
        <GameControls
          onUp={() => { if (direction[0] !== 1) setDirection([-1, 0]); }}
          onDown={() => { if (direction[0] !== -1) setDirection([1, 0]); }}
          onLeft={() => { if (direction[1] !== 1) setDirection([0, -1]); }}
          onRight={() => { if (direction[1] !== -1) setDirection([0, 1]); }}
        />
      )}
    </div>
  );
}
