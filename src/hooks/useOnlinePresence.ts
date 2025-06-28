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
      console.log(`🔄 Updating presence for ${currentProfile.name}: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      await supabase
        .from('user_presence')
        .upsert({
          profile_id: currentProfile.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      console.log(`✅ Presence updated: ${currentProfile.name} is ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('❌ Error updating presence:', error);
    }
  }, [currentProfile?.id, currentProfile?.name]);

  const fetchOnlineUsers = useCallback(async () => {
    if (!currentProfile?.id) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`📊 Fetching online users (excluding ${currentProfile.name})`);
      
      // Get all users who were active in the last 2 minutes (more lenient)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('profile_id, is_online, last_seen')
        .eq('is_online', true)
        .gte('last_seen', twoMinutesAgo)
        .neq('profile_id', currentProfile.id);

      if (presenceError) {
        throw presenceError;
      }

      console.log(`📊 Found ${presenceData?.length || 0} presence records`);

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

      console.log(`👥 Found ${combinedData.length} online users:`, combinedData.map(u => u.profile.name));
      setOnlineUsers(combinedData);
    } catch (err: any) {
      console.error('❌ Error fetching online users:', err);
      setError('שגיאה בטעינת משתמשים מחוברים: ' + err.message);
      setOnlineUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id, currentProfile?.name]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!currentProfile?.id) return;

    console.log(`🔄 Setting up presence tracking for ${currentProfile.name}`);

    // Set user as online when component mounts
    updatePresence(true);

    // Subscribe to presence changes with a unique channel name
    const channelName = `presence_${currentProfile.id}_${Date.now()}`;
    presenceChannelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          console.log('👥 Presence change detected:', payload);
          // Refetch online users when presence changes
          setTimeout(() => {
            fetchOnlineUsers();
          }, 500); // Small delay to ensure DB is updated
        }
      )
      .subscribe((status) => {
        console.log(`📡 Presence channel status for ${currentProfile.name}:`, status);
      });

    // Set up heartbeat to keep presence alive - every 10 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence(true);
    }, 10000);

    // Initial fetch
    fetchOnlineUsers();

    // Cleanup function
    return () => {
      console.log(`🔄 Cleaning up presence tracking for ${currentProfile.name}`);
      
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
  }, [currentProfile?.id, currentProfile?.name, updatePresence, fetchOnlineUsers]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden - keeping online (user might be switching tabs)');
        // Don't set offline immediately - user might just be switching tabs
      } else {
        console.log('📱 Page visible - ensuring online status');
        updatePresence(true);
        fetchOnlineUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence, fetchOnlineUsers]);

  // Handle beforeunload to set offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🚪 Page unloading - setting offline');
      updatePresence(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updatePresence]);

  const sendGameInvite = useCallback(async (targetProfileId: string) => {
    if (!currentProfile?.id) {
      toast.error('שגיאה: לא נמצא פרופיל פעיל');
      return false;
    }

    try {
      console.log(`🎮 Sending game invite from ${currentProfile.name} to profile ${targetProfileId}`);

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

      console.log('🏆 Competition created:', competition.id);

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

      console.log('📨 Invitation created in database');

      // Send real-time notification using a dedicated channel
      const inviteChannelName = `invite_${targetProfileId}_${Date.now()}`;
      console.log(`📡 Creating invite channel: ${inviteChannelName}`);
      
      const inviteChannel = supabase.channel(inviteChannelName);
      
      // Subscribe first, then send
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Channel subscription timeout')), 5000);
        
        inviteChannel.subscribe((status) => {
          console.log(`📡 Invite channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve(status);
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Channel subscription failed'));
          }
        });
      });

      // Now send the broadcast
      console.log('📤 Sending broadcast message...');
      const broadcastResult = await inviteChannel.send({
        type: 'broadcast',
        event: 'game_invite',
        payload: {
          from_profile_id: currentProfile.id,
          from_name: currentProfile.name,
          competition_id: competition.id,
          invite_id: competition.id,
          timestamp: Date.now(),
        }
      });

      console.log('📡 Broadcast result:', broadcastResult);

      // Clean up the channel after a delay
      setTimeout(() => {
        console.log('🧹 Cleaning up invite channel');
        supabase.removeChannel(inviteChannel);
      }, 2000);

      return true;
    } catch (error: any) {
      console.error('❌ Error sending game invite:', error);
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