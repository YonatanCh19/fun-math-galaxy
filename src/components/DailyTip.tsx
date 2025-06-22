import React, { useState, useEffect } from 'react';
import { tips } from '@/lib/tips';

export default function DailyTip({ onClose }: { onClose: () => void }) {
  console.log("Rendering: DailyTip");
  
  const [countdown, setCountdown] = useState(10);
  const [randomTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center font-varela p-4 animate-scale-in">
      <div className="bg-orangeKid/95 rounded-3xl shadow-2xl p-6 sm:p-10 max-w-2xl w-full text-right border-4 border-pinkKid">
        <h1 className="text-2xl sm:text-4xl font-bold text-pinkKid mb-4 text-center">💡 טיפ יומי 💡</h1>
        <h2 className="text-lg sm:text-2xl font-bold text-blueKid mb-3">{randomTip.title}</h2>
        <p className="text-base sm:text-lg text-blue-900 leading-relaxed">{randomTip.content}</p>
        <div className="mt-6 text-center text-xl sm:text-2xl font-bold text-turquoiseKid">
          ממשיכים בעוד... {countdown}
        </div>
      </div>
    </div>
  );
}
