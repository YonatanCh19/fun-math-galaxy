import React, { useEffect, useState, memo, useCallback } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
}

type ConfettiAnimationProps = {
  onComplete: () => void;
};

const ConfettiAnimation = memo(({ onComplete }: ConfettiAnimationProps) => {
  console.log("Rendering: ConfettiAnimation");
  
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const stopAnimation = useCallback(() => {
    setConfetti([]);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const colors = ['#ff72a6', '#fff685', '#77e7a6', '#6feaff', '#fff1c9', '#55aaff'];
    const pieces: ConfettiPiece[] = [];

    // Create 30 confetti pieces (reduced from 50 for better performance)
    for (let i = 0; i < 30; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4, // Slightly smaller pieces
        speedX: (Math.random() - 0.5) * 3,
        speedY: Math.random() * 2 + 1.5,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }

    setConfetti(pieces);

    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      // Stop animation after 1 second
      if (elapsed > 1000) {
        stopAnimation();
        return;
      }

      setConfetti(prevConfetti => 
        prevConfetti.map(piece => ({
          ...piece,
          x: piece.x + piece.speedX,
          y: piece.y + piece.speedY,
          rotation: piece.rotation + piece.rotationSpeed,
          speedY: piece.speedY + 0.08, // Reduced gravity for smoother animation
        })).filter(piece => piece.y < window.innerHeight + 30)
      );

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [stopAnimation]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute will-change-transform"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}
    </div>
  );
});

ConfettiAnimation.displayName = 'ConfettiAnimation';

export default ConfettiAnimation;
