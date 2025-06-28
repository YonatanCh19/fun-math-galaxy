import { supabase } from '@/integrations/supabase/client';

export type UserProgress = {
    correct: number;
    total: number;
    trophies: number;
    coins: number;
    free_games: number; // Now directly from database
};

const handleProgressError = async (error: any) => {
  console.error('Progress error:', error);
  
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

export async function getUserProgress(profileId: string): Promise<UserProgress> {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('correct, total, trophies, coins, free_games')
            .eq('profile_id', profileId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
            await handleProgressError(error);
            console.error('Error fetching user progress:', error);
        }
        
        if (data) {
            return data;
        }

        // If no progress exists, create one
        const { data: newProgress, error: insertError } = await supabase
            .from('user_progress')
            .insert({ profile_id: profileId })
            .select('correct, total, trophies, coins, free_games')
            .maybeSingle();

        if (insertError) {
            await handleProgressError(insertError);
            console.error('Error creating user progress:', insertError);
            return { correct: 0, total: 0, trophies: 0, coins: 0, free_games: 0 };
        }
        
        return newProgress || { correct: 0, total: 0, trophies: 0, coins: 0, free_games: 0 };
    } catch (error: any) {
        await handleProgressError(error);
        return { correct: 0, total: 0, trophies: 0, coins: 0, free_games: 0 };
    }
}

export async function updateUserProgress(profileId: string, newProgress: Partial<UserProgress>) {
    try {
        // First, check if a progress record exists
        const { data: existingProgress, error: selectError } = await supabase
            .from('user_progress')
            .select('id')
            .eq('profile_id', profileId)
            .maybeSingle();

        if (selectError && selectError.code !== 'PGRST116') {
            await handleProgressError(selectError);
            console.error('Error checking existing progress:', selectError);
            return;
        }

        if (existingProgress) {
            // Update existing record
            const { error: updateError } = await supabase
                .from('user_progress')
                .update({ 
                    ...newProgress, 
                    updated_at: new Date().toISOString() 
                })
                .eq('profile_id', profileId);

            if (updateError) {
                await handleProgressError(updateError);
                console.error('Error updating user progress:', updateError);
            }
        } else {
            // Insert new record
            const { error: insertError } = await supabase
                .from('user_progress')
                .insert({ 
                    profile_id: profileId, 
                    ...newProgress,
                    updated_at: new Date().toISOString() 
                });

            if (insertError) {
                await handleProgressError(insertError);
                console.error('Error inserting user progress:', insertError);
            }
        }
    } catch (error: any) {
        await handleProgressError(error);
        console.error('Error in updateUserProgress:', error);
    }
}

// New function to award free game for winning online competition
export async function awardFreeGame(profileId: string): Promise<boolean> {
    try {
        console.log('Awarding free game to profile:', profileId);
        
        // Get current progress
        const currentProgress = await getUserProgress(profileId);
        const newFreeGames = currentProgress.free_games + 1;
        
        // Update with new free game count
        await updateUserProgress(profileId, { 
            ...currentProgress,
            free_games: newFreeGames 
        });
        
        console.log('Free game awarded successfully. New count:', newFreeGames);
        return true;
    } catch (error) {
        console.error('Error awarding free game:', error);
        return false;
    }
}

// New function to use a free game
export async function useFreeGame(profileId: string): Promise<boolean> {
    try {
        console.log('Using free game for profile:', profileId);
        
        // Get current progress
        const currentProgress = await getUserProgress(profileId);
        
        if (currentProgress.free_games <= 0) {
            console.log('No free games available');
            return false;
        }
        
        const newFreeGames = currentProgress.free_games - 1;
        
        // Update with decremented free game count
        await updateUserProgress(profileId, { 
            ...currentProgress,
            free_games: newFreeGames 
        });
        
        console.log('Free game used successfully. Remaining count:', newFreeGames);
        return true;
    } catch (error) {
        console.error('Error using free game:', error);
        return false;
    }
}

// New function to use 3 coins for a free game
export async function useCoinsForGame(profileId: string): Promise<boolean> {
    try {
        console.log('Using 3 coins for game for profile:', profileId);
        
        // Get current progress
        const currentProgress = await getUserProgress(profileId);
        
        if (currentProgress.coins < 3) {
            console.log('Not enough coins available. Current coins:', currentProgress.coins);
            return false;
        }
        
        const newCoins = currentProgress.coins - 3;
        
        // Update with decremented coin count
        await updateUserProgress(profileId, { 
            ...currentProgress,
            coins: newCoins 
        });
        
        console.log('3 coins used successfully. Remaining coins:', newCoins);
        return true;
    } catch (error) {
        console.error('Error using coins for game:', error);
        return false;
    }
}