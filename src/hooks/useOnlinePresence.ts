import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type OnlineUser = {
  profile_id: string;
  profile: Profile & {
    email_preview?: string;
    is_same_user?: boolean;
  };
  is_online: boolean;
  last_seen: string;
  user_id: string;
};

export function useOnlinePresence(currentProfile: Profile | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presenceChannelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!currentProfile?.id) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          profile_id: currentProfile.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [currentProfile?.id]);

  const fetchOnlineUsers = useCallback(async () => {
    if (!currentProfile?.id) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Get all online users except current user
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('profile_id, is_online, last_seen')
        .eq('is_online', true)
        .neq('profile_id', currentProfile.id);

      if (presenceError) {
        throw presenceError;
      }

      if (!presenceData || presenceData.length === 0) {
        setOnlineUsers([]);
        setLoading(false);
        return;
      }

      // Get profile details for online users
      const profileIds = presenceData.map(p => p.profile_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_character, user_id')
        .in('id', profileIds);

      if (profilesError) {
        throw profilesError;
      }

      // Combine presence and profile data
      const combinedData: OnlineUser[] = presenceData
        .map(presence => {
          const profile = profilesData?.find(p => p.id === presence.profile_id);
          if (!profile) return null;
          
          return {
            profile_id: presence.profile_id,
            profile: {
              ...profile,
              is_same_user: false,
            },
            is_online: presence.is_online,
            last_seen: presence.last_seen,
            user_id: profile.user_id,
          };
        })
        .filter(Boolean) as OnlineUser[];

      setOnlineUsers(combinedData);
    } catch (err: any) {
      console.error('Error fetching online users:', err);
      setError('שגיאה בטעינת משתמשים מחוברים: ' + err.message);
      setOnlineUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!currentProfile?.id) return;

    // Set user as online when component mounts
    updatePresence(true);

    // Subscribe to presence changes
    presenceChannelRef.current = supabase
      .channel('user_presence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          // Refetch online users when presence changes
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Set up heartbeat to keep presence alive
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence(true);
    }, 30000); // Update every 30 seconds

    // Initial fetch
    fetchOnlineUsers();

    // Cleanup function
    return () => {
      // Set user as offline
      updatePresence(false);
      
      // Cleanup subscriptions
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [currentProfile?.id, updatePresence, fetchOnlineUsers]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false);
      } else {
        updatePresence(true);
        fetchOnlineUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence, fetchOnlineUsers]);

  const sendGameInvite = useCallback(async (targetProfileId: string) => {
    if (!currentProfile?.id) {
      toast.error('שגיאה: לא נמצא פרופיל פעיל');
      return false;
    }

    try {
      // Create a new competition
      const { data: competition, error: competitionError } = await supabase
        .from('online_competitions')
        .insert({
          player1_id: currentProfile.id,
          player2_id: targetProfileId,
          status: 'pending',
        })
        .select()
        .single();

      if (competitionError) {
        throw competitionError;
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('competition_invitations')
        .insert({
          from_profile_id: currentProfile.id,
          to_profile_id: targetProfileId,
          competition_id: competition.id,
          status: 'pending',
        });

      if (inviteError) {
        throw inviteError;
      }

      // Send real-time notification
      const channel = supabase.channel(`invite_${targetProfileId}`);
      await channel.send({
        type: 'broadcast',
        event: 'game_invite',
        payload: {
          from_profile_id: currentProfile.id,
          from_name: currentProfile.name,
          competition_id: competition.id,
          invite_id: competition.id,
        }
      });

      return true;
    } catch (error: any) {
      console.error('Error sending game invite:', error);
      toast.error('שגיאה בשליחת הזמנה: ' + error.message);
      return false;
    }
  }, [currentProfile]);

  return {
    onlineUsers,
    loading,
    error,
    sendGameInvite,
    refetch: fetchOnlineUsers,
  };
}