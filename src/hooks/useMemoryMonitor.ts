
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const MEMORY_CHECK_INTERVAL = 60000; // 1 minute
const MEMORY_WARNING_THRESHOLD = 100; // MB (approximate)

export const useMemoryMonitor = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCleanup = useRef<number>(Date.now());

  const cleanupMemory = useCallback(() => {
    // Clear any cached data
    if ('gc' in window && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {
        console.warn('Manual garbage collection not available');
      }
    }

    // Clear audio cache
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (audio.paused) {
        audio.src = '';
        audio.load();
      }
    });

    // Clear image cache for unused images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.offsetParent) {
        img.src = '';
      }
    });

    lastCleanup.current = Date.now();
    console.log('Memory cleanup performed');
  }, []);

  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemoryMB = memInfo.usedJSHeapSize / (1024 * 1024);
      
      console.log(`Memory usage: ${usedMemoryMB.toFixed(2)} MB`);
      
      if (usedMemoryMB > MEMORY_WARNING_THRESHOLD) {
        const timeSinceLastCleanup = Date.now() - lastCleanup.current;
        
        // Only cleanup if it's been more than 2 minutes since last cleanup
        if (timeSinceLastCleanup > 120000) {
          cleanupMemory();
          toast.info('ניקיתי זיכרון כדי לשפר ביצועים', {
            description: 'האפליקציה צריכה לרוץ חלק יותר עכשיו',
            duration: 3000,
          });
        }
      }
    }
  }, [cleanupMemory]);

  useEffect(() => {
    intervalRef.current = setInterval(checkMemoryUsage, MEMORY_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkMemoryUsage]);

  return { cleanupMemory };
};
