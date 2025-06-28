import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tips } from '@/lib/tips';

export default function DailyTip({ onClose }: { onClose: () => void }) {
  console.log("Rendering: DailyTip");
  
  const [countdown, setCountdown] = useState(10);
  const [randomTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasClosedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // יצירת פונקציית סגירה יציבה
  const handleClose = useCallback(() => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    
    // ניקוי הטיימר
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    onClose();
  }, [onClose]);

  // אפקט יחיד שמתחיל את הטיימר פעם אחת בלבד
  useEffect(() => {
    // אם כבר אותחל או נסגר, לא לעשות כלום
    if (isInitializedRef.current || hasClosedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    const startTimer = () => {
      if (hasClosedRef.current) return;

      timerRef.current = setTimeout(() => {
        if (hasClosedRef.current) return;

        setCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            handleClose();
            return 0;
          }
          
          // המשך הטיימר רק אם עדיין לא נסגר
          if (!hasClosedRef.current) {
            startTimer();
          }
          
          return newCount;
        });
      }, 1000);
    };

    startTimer();

    // ניקוי כשהקומפוננט נהרס
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // dependency array ריק - רק פעם אחת!

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