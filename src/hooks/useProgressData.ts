
import { useState, useEffect, useCallback } from 'react';
import { getUserProgress, updateUserProgress, UserProgress } from '@/lib/progressUtils';

export const useProgressData = (profileId: string | null) => {
  const [progress, setProgress] = useState<UserProgress>({ correct: 0, total: 0, trophies: 0, coins: 0, free_games: 0 });
  const [sessionCorrectAnswers, setSessionCorrectAnswers] = useState(0); // Session-based counter that resets on refresh
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const progressData = await getUserProgress(profileId);
      setProgress(progressData);
      // Reset session counter when fetching fresh data
      setSessionCorrectAnswers(0);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = useCallback(async (newProgress: UserProgress) => {
    if (!profileId) return;
    
    try {
      await updateUserProgress(profileId, newProgress);
      setProgress(newProgress);
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress data');
    }
  }, [profileId]);

  const incrementSessionCorrectAnswers = useCallback(() => {
    setSessionCorrectAnswers(prev => prev + 1);
  }, []);

  const resetSessionCorrectAnswers = useCallback(() => {
    setSessionCorrectAnswers(0);
  }, []);

  return {
    progress,
    sessionCorrectAnswers,
    loading,
    error,
    refetch: fetchProgress,
    updateProgress,
    incrementSessionCorrectAnswers,
    resetSessionCorrectAnswers,
  };
};
