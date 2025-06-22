import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GAME_DURATION = 120; // 2 minutes
const COLORS = [
  '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
  '#ff00ff', '#00ffff', '#ffa500', '#800080', '#a52a2a'
];

export default function DrawingBoardGame() {
  console.log("Rendering: DrawingBoardGame");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas size based on container to avoid scaling issues
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = 5;
        contextRef.current = context;
      }
    }
  }, []);

  useEffect(() => {
    if (contextRef.current) {
        contextRef.current.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          toast.info('הזמן נגמר! חוזרים לדף התרגול.');
          setTimeout(() => nav('/practice'), 2000);
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
  }, [nav]);

  const getEventCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const { x, y } = getEventCoordinates(event);
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const finishDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getEventCoordinates(event);
    if (contextRef.current) {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-kidGradient font-varela p-4">
      <h1 className="text-4xl font-bold mb-4 text-blueKid drop-shadow">לוח ציור</h1>
      <div className="w-full flex justify-between items-center text-xl font-bold mb-4 z-10 max-w-4xl">
        <div className="text-pinkKid bg-white/70 px-4 py-2 rounded-lg shadow-md">ציירו בחופשיות!</div>
        <div className="text-blueKid bg-white/70 px-4 py-2 rounded-lg shadow-md">
          זמן נותר: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl h-[60vh]">
        <div className="flex flex-row md:flex-col items-center justify-center gap-2 p-2 bg-white/80 rounded-2xl shadow-lg">
          {COLORS.map(c => (
            <button
              key={c}
              style={{ backgroundColor: c }}
              className={`w-10 h-10 rounded-full cursor-pointer border-4 transition-transform ${color === c ? 'border-blueKid scale-110' : 'border-transparent'}`}
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
          className="bg-white rounded-2xl shadow-2xl cursor-crosshair w-full h-full touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="mt-4 flex gap-4">
        <Button onClick={clearCanvas} className="bg-greenKid text-white text-lg px-6 py-3 rounded-xl hover:bg-green-500">
          נקה הכל
        </Button>
      </div>
    </div>
  );
}
