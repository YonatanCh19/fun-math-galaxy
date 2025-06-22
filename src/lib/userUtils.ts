
import { supabase } from '@/integrations/supabase/client';
import { UserProgress } from './progressUtils';

// This combines profile data with their progress.
export type UserWithProgress = {
  id: string; // This is the profile_id (UUID)
  name: string | null;
  progress: UserProgress | null;
};

const handleUserUtilsError = async (error: any) => {
  console.error('UserUtils error:', error);
  
  // Check for auth-related errors that require re-login
  if (error?.code === '401' || 
      error?.code === '400' || 
      error?.code === '406' ||
      error?.message?.includes('refresh_token') ||
      error?.message?.includes('JWT expired') ||
      error?.message?.includes('Invalid JWT')) {
    
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Error during sign out:', signOutError);
    }
    
    window.location.href = '/auth';
    return;
  }
};

export async function getUsersWithProgress(): Promise<UserWithProgress[]> {
  try {
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name');

    if (profilesError) {
      await handleUserUtilsError(profilesError);
      console.error('Error fetching profiles:', profilesError);
      return [];
    }
    if (!profiles) {
      return [];
    }

    // Fetch all progress data
    const { data: progresses, error: progressError } = await supabase
      .from('user_progress')
      .select('*');

    if (progressError) {
      await handleUserUtilsError(progressError);
      console.error('Error fetching user progress:', progressError);
      // We can continue without progress data, it will just be null
    }

    const progressMap = new Map<string, UserProgress>();
    if (progresses) {
      for (const p of progresses) {
        if (p.profile_id) {
          progressMap.set(p.profile_id, p);
        }
      }
    }

    const usersWithProgress: UserWithProgress[] = profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      progress: progressMap.get(profile.id) ?? null,
    }));

    return usersWithProgress;
  } catch (error: any) {
    await handleUserUtilsError(error);
    return [];
  }
}
