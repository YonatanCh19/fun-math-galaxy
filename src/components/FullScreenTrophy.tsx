import React, { useEffect } from 'react';
import AnimatedTrophy from './AnimatedTrophy';

const soundUrl = 'https://actions.google.com/sounds/v1/alarms/tada.ogg';

export default function FullScreenTrophy({ onEnd }: { onEnd: () => void }) {
  console.log("Rendering: FullScreenTrophy");
  
  useEffect(() => {
    try {
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.error("Error playing sound:", e));
    } catch (e) {
      console.error("Could not play audio:", e);
    }
    
    const timer = setTimeout(() => {
      onEnd();
    }, 2500); // Duration of the animation + sound

    return () => clearTimeout(timer);
  }, [onEnd]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="animate-trophy-bounce">
         <AnimatedTrophy size={256} />
      </div>
    </div>
  );
}
