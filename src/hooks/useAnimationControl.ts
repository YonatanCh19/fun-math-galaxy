
import { useState, useCallback, useRef } from 'react';

const MAX_CONCURRENT_ANIMATIONS = 3;

export const useAnimationControl = () => {
  const [activeAnimations, setActiveAnimations] = useState<Set<string>>(new Set());
  const animationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startAnimation = useCallback((id: string, duration: number = 3000) => {
    setActiveAnimations(prev => {
      if (prev.size >= MAX_CONCURRENT_ANIMATIONS) {
        // Stop oldest animation
        const firstId = Array.from(prev)[0];
        stopAnimation(firstId);
      }
      
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });

    // Auto-stop animation after duration
    const timeout = setTimeout(() => {
      stopAnimation(id);
    }, duration);
    
    animationTimeouts.current.set(id, timeout);
  }, []);

  const stopAnimation = useCallback((id: string) => {
    setActiveAnimations(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    const timeout = animationTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      animationTimeouts.current.delete(id);
    }
  }, []);

  const stopAllAnimations = useCallback(() => {
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    animationTimeouts.current.clear();
    setActiveAnimations(new Set());
  }, []);

  const canStartAnimation = useCallback(() => {
    return activeAnimations.size < MAX_CONCURRENT_ANIMATIONS;
  }, [activeAnimations.size]);

  return {
    activeAnimations,
    startAnimation,
    stopAnimation,
    stopAllAnimations,
    canStartAnimation,
  };
};
