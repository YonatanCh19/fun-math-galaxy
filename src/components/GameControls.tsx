import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface GameControlsProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
}

export default function GameControls({ onUp, onDown, onLeft, onRight }: GameControlsProps) {
  console.log("Rendering: GameControls");
  
  const buttonClasses = "bg-yellowKid/80 text-blueKid hover:bg-yellowKid active:scale-95 transition-transform w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center";
  
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-44 h-44 mt-4" style={{ direction: 'ltr' }}>
        <div className="col-start-2 row-start-1 flex justify-center items-center">
            <Button onClick={onUp} className={buttonClasses} aria-label="Up">
                <ArrowUp size={28} />
            </Button>
        </div>
        <div className="col-start-1 row-start-2 flex justify-center items-center">
            <Button onClick={onLeft} className={buttonClasses} aria-label="Left">
                <ArrowLeft size={28} />
            </Button>
        </div>
        <div className="col-start-3 row-start-2 flex justify-center items-center">
            <Button onClick={onRight} className={buttonClasses} aria-label="Right">
                <ArrowRight size={28} />
            </Button>
        </div>
        <div className="col-start-2 row-start-3 flex justify-center items-center">
            <Button onClick={onDown} className={buttonClasses} aria-label="Down">
                <ArrowDown size={28} />
            </Button>
        </div>
    </div>
  );
}
