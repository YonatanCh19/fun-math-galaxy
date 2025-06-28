import React, { useState, useEffect, useRef } from 'react';
import { tips } from '@/lib/tips';

export default function DailyTip({ onClose }: { onClose: () => void }) {
  console.log("Rendering: DailyTip");
  
  const [countdown, setCountdown] = useState(10);
  const [randomTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasClosedRef = useRef(false);

  useEffect(() => {
    // אם כבר נסגר, לא להתחיל טיימר חדש
    if (hasClosedRef.current) return;

    // ניקוי טיימר קיים אם יש
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // אם הספירה הגיעה לאפס, סגור את הטיפ
    if (countdown <= 0) {
      hasClosedRef.current = true;
      onClose();
      return;
    }

    // הגדרת טיימר חדש
    timerRef.current = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    // ניקוי הטיימר כשהקומפוננט נהרס
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [countdown, onClose]);

  // ניקוי כשהקומפוננט נהרס
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // אם כבר נסגר, לא להציג כלום
  if (hasClosedRef.current) {
    return null;
  }

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