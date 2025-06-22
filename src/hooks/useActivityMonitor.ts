
import { useEffect, useCallback, useRef, useState } from 'react';

const INACTIVITY_THRESHOLD = 120000; // 2 minutes
const FREEZE_DETECTION_THRESHOLD = 5000; // 5 seconds

export const useActivityMonitor = () => {
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowRefreshPrompt(false);
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    inactivityTimeoutRef.current = setTimeout(() => {
      setShowRefreshPrompt(true);
    }, INACTIVITY_THRESHOLD);
  }, []);

  const checkForFreeze = useCallback(() => {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;
    
    if (timeSinceLastHeartbeat > FREEZE_DETECTION_THRESHOLD) {
      console.warn(`Potential freeze detected: ${timeSinceLastHeartbeat}ms since last heartbeat`);
      setShowRefreshPrompt(true);
    }
    
    lastHeartbeatRef.current = now;
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowRefreshPrompt(false);
    updateActivity();
  }, [updateActivity]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Heartbeat to detect freezes
    heartbeatIntervalRef.current = setInterval(checkForFreeze, 1000);

    // Initial timeout
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [updateActivity, checkForFreeze]);

  return {
    showRefreshPrompt,
    handleRefresh,
    dismissPrompt,
  };
};
