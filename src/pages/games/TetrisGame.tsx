import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import GameControls from '@/components/GameControls';
import { ArrowLeft } from 'lucide-react';

// --- Game Constants and Helpers ---

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_CELL_COLOR = '#1f2937'; // dark gray for empty cells

const TETROMINOS = {
  0: { shape: [[0]], color: EMPTY_CELL_COLOR },
  I: {
    shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    color: '#00f0f0',
  },
  J: {
    shape: [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
    color: '#0000f0',
  },
  L: {
    shape: [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    color: '#f0a000',
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: '#f0f000',
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    color: '#00f000',
  },
  T: {
    shape: [[1, 1, 1], [0, 1, 0], [0, 0, 0]],
    color: '#a000f0',
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    color: '#f00000',
  },
};

const createBoard = (): string[][] =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(EMPTY_CELL_COLOR));

const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ';
  const randTetrominoKey = tetrominos[Math.floor(Math.random() * tetrominos.length)] as keyof typeof TETROMINOS;
  return TETROMINOS[randTetrominoKey];
};

// --- Custom Hook for Game Loop ---
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = React.useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};


export default function TetrisGame() {
  const isMobile = useIsMobile();
  const CELL_SIZE = isMobile ? 20 : 25;
  const nav = useNavigate();

  const [isGameRunning, setIsGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const [board, setBoard] = useState(createBoard());
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0],
    collided: false,
  });
  
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [dropTime, setDropTime] = useState<number | null>(null);

  const checkCollision = useCallback((p: typeof player, b: string[][], { x: moveX, y: moveY }: { x: number, y: number }): boolean => {
    for (let y = 0; y < p.tetromino.shape.length; y += 1) {
      for (let x = 0; x < p.tetromino.shape[y].length; x += 1) {
        if (p.tetromino.shape[y][x] !== 0) {
          const newY = y + p.pos.y + moveY;
          const newX = x + p.pos.x + moveX;
          if (
            !b[newY] ||
            !b[newY][newX] ||
            b[newY][newX] !== EMPTY_CELL_COLOR
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const resetPlayer = useCallback((currentBoard: string[][]) => {
    const newTetromino = randomTetromino();
    const newPlayer = {
      pos: { x: BOARD_WIDTH / 2 - 1, y: 0 },
      tetromino: newTetromino,
      collided: false,
    };
    if (checkCollision(newPlayer, currentBoard, { x: 0, y: 0 })) {
      setGameOver(true);
      setDropTime(null);
    } else {
      setPlayer(newPlayer);
    }
  }, [checkCollision]);

  const startGame = useCallback(() => {
    const newBoard = createBoard();
    setBoard(newBoard);
    resetPlayer(newBoard);
    setScore(0);
    setRows(0);
    setLevel(0);
    setGameOver(false);
    setIsGameRunning(true);
    setDropTime(1000);
  }, [resetPlayer]);

  useEffect(() => {
    if (gameOver) {
      setTimeout(() => nav('/practice'), 3000);
    }
  }, [gameOver, nav]);
  
  const movePlayer = useCallback((dir: -1 | 1) => {
    if (!checkCollision(player, board, { x: dir, y: 0 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y },
      }));
    }
  }, [board, checkCollision, player]);

  const drop = useCallback(() => {
    if (rows > (level + 1) * 10) {
      setLevel(prev => prev + 1);
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, board, { x: 0, y: 1 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 },
        collided: false,
      }));
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        return;
      }
      setPlayer(prev => ({ ...prev, collided: true }));
    }
  }, [board, checkCollision, level, player, rows]);
  
  const dropPlayer = useCallback(() => {
    drop();
  },[drop]);

  const rotate = (matrix: number[][]) => {
    const transposed = matrix.map((_, colIndex) => matrix.map(row => row[colIndex]));
    return transposed.map(row => row.reverse());
  };
  
  const playerRotate = useCallback((b: string[][]) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, b, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino.shape[0].length) {
        clonedPlayer.pos.x = pos; // Reset position
        return; // Can't rotate
      }
    }
    setPlayer(clonedPlayer);
  }, [checkCollision, player]);
  
  const handleKeyDown = useCallback(({ key }: KeyboardEvent) => {
    if (!gameOver && isGameRunning) {
      if (key === 'ArrowLeft') {
        movePlayer(-1);
      } else if (key === 'ArrowRight') {
        movePlayer(1);
      } else if (key === 'ArrowDown') {
        dropPlayer();
      } else if (key === 'ArrowUp') {
        playerRotate(board);
      }
    }
  }, [board, dropPlayer, gameOver, isGameRunning, movePlayer, playerRotate]);

  useEffect(() => {
    if (player.collided) {
      const newBoard = [...board];
      player.tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newBoard[y + player.pos.y][x + player.pos.x] = player.tetromino.color;
          }
        });
      });

      // Sweep rows
      const sweptBoard = newBoard.reduce((ack, row) => {
        if (row.every(cell => cell !== EMPTY_CELL_COLOR)) {
          setRows(prev => prev + 1);
          setScore(prev => prev + 10 * (level + 1));
          ack.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL_COLOR));
          return ack;
        }
        ack.push(row);
        return ack;
      }, [] as string[][]);
      
      setBoard(sweptBoard);
      resetPlayer(sweptBoard);
    }
  }, [player.collided, board, level, resetPlayer]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  useInterval(() => {
    if (!gameOver) {
      drop();
    }
  }, dropTime);

  // Create the board for rendering (with the player piece)
  const displayBoard = board.map(row => [...row]);
  if(isGameRunning) {
    player.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + player.pos.y;
          const boardX = x + player.pos.x;
          if (boardY >= 0 && boardX >= 0 && boardY < BOARD_HEIGHT && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = player.tetromino.color;
          }
        }
      });
    });
  }
  
  if (!isGameRunning) {
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

        <h1 className="text-5xl font-extrabold text-blueKid mb-4">טטריס 🧱</h1>
        <p className="text-2xl text-pinkKid mb-8 max-w-md">
            סדרו את הלבנים הנופלות כדי ליצור שורות שלמות. השתמשו בחצים כדי לזוז ולסובב.
        </p>
        <Button onClick={startGame} className="bg-greenKid text-white px-8 py-4 rounded-3xl text-xl drop-shadow hover:bg-green-500 font-bold animate-pulse">
          התחל משחק
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-4 sm:p-6 text-center text-white">
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

      <h1 className="text-4xl sm:text-5xl font-extrabold text-blueKid mb-4">טטריס</h1>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
        <div 
          className="bg-gray-900/80 border-4 border-yellowKid rounded-lg grid relative shadow-2xl"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
            width: `${BOARD_WIDTH * CELL_SIZE}px`,
            height: `${BOARD_HEIGHT * CELL_SIZE}px`,
            direction: 'ltr',
          }}
        >
          {displayBoard.map((row, y) =>
            row.map((color, x) => (
              <div
                key={`${y}-${x}`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: color,
                  border: color !== EMPTY_CELL_COLOR ? '1px solid #374151' : 'none',
                }}
              />
            ))
          )}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 text-white rounded-md flex flex-col items-center justify-center z-10 animate-fade-in">
              <h2 className="text-4xl font-bold text-red-500 mb-2">נפסלת!</h2>
              <p className="text-xl mb-4">ניקוד סופי: {score}</p>
              <p className="text-lg text-gray-200 animate-pulse">חוזר לתרגול בעוד 3 שניות...</p>
            </div>
          )}
        </div>
        <aside className="w-48 bg-blueKid/50 p-4 rounded-xl border-2 border-yellowKid text-lg">
          <h2 className="font-bold text-2xl mb-4">מידע</h2>
          <div className="space-y-3 text-right">
              <p>ניקוד: {score}</p>
              <p>שורות: {rows}</p>
              <p>שלב: {level}</p>
          </div>
        </aside>
      </div>
      {isMobile && isGameRunning && !gameOver && (
        <GameControls
          onUp={() => playerRotate(board)}
          onDown={() => dropPlayer()}
          onLeft={() => movePlayer(-1)}
          onRight={() => movePlayer(1)}
        />
      )}
    </div>
  );
}