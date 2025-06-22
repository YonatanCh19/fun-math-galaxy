
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/hooks/useAuth';

export type OnlineUser = {
  profile_id: string;
  profile: Profile & {
    email_preview?: string;
    is_same_user?: boolean;
  };
  is_online: boolean;
  last_seen: string;
  user_id?: string;
};

export const useOnlinePresence = (currentProfile: Profile | null) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!currentProfile) return;

    try {
      console.log('Updating presence for profile:', currentProfile.id, 'to:', isOnline);
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          profile_id: currentProfile.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating presence:', error);
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [currentProfile]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching online users from all emails');
      
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('is_online', true);

      if (presenceError) {
        console.error('Error fetching presence:', presenceError);
        return;
      }

      console.log('Presence data:', presenceData);

      if (presenceData && presenceData.length > 0) {
        const profileIds = presenceData.map(p => p.profile_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        console.log('Profiles data:', profilesData);

        // Get user emails for preview
        const userIds = profilesData?.map(p => p.user_id).filter(Boolean) || [];
        const { data: usersData } = await supabase.auth.admin.listUsers();
        
        const usersWithPresence: OnlineUser[] = presenceData.map(presence => {
          const profile = profilesData?.find(p => p.id === presence.profile_id);
          if (!profile) return null;
          
          const user = usersData?.users?.find(u => u.id === profile.user_id);
          const emailPreview = user?.email ? user.email.split('@')[0] + '@...' : undefined;
          const isSameUser = profile.user_id === currentProfile?.user_id;
          
          return {
            profile_id: presence.profile_id,
            profile: {
              ...profile,
              email_preview: emailPreview,
              is_same_user: isSameUser,
            } as Profile & { email_preview?: string; is_same_user?: boolean },
            is_online: presence.is_online,
            last_seen: presence.last_seen,
            user_id: profile?.user_id,
          };
        }).filter(Boolean) as OnlineUser[];

        // Filter out current profile
        const filteredUsers = usersWithPresence.filter(user => 
          user.profile_id !== currentProfile?.id
        );

        console.log('Online users from all emails:', filteredUsers);
        setOnlineUsers(filteredUsers);
      } else {
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      try {
        console.log('Cleaning up existing presence channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentProfile) return;

    console.log('Setting up online presence for profile:', currentProfile.id);

    // Set user as online when component mounts
    updatePresence(true);
    fetchOnlineUsers();

    // Clean up existing channel before creating new one
    cleanupChannel();

    // Create new channel with unique name
    if (!isSubscribed) {
      const uniqueChannelName = `user-presence-all-${currentProfile.id}-${Date.now()}`;
      console.log('Creating new presence channel:', uniqueChannelName);
      
      try {
        channelRef.current = supabase
          .channel(uniqueChannelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_presence'
            },
            (payload) => {
              console.log('Presence change detected:', payload);
              fetchOnlineUsers();
            }
          )
          .subscribe((status) => {
            console.log('Presence channel subscription status:', status);
            if (status === 'SUBSCRIBED') {
              setIsSubscribed(true);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel subscription error');
              setIsSubscribed(false);
            }
          });
      } catch (error) {
        console.error('Error creating presence channel:', error);
      }
    }

    // Set up interval to keep presence updated
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
    }
    
    presenceIntervalRef.current = setInterval(() => {
      updatePresence(true);
    }, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page visible, updating presence to online');
        updatePresence(true);
      } else {
        console.log('Page hidden, updating presence to offline');
        updatePresence(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up online presence');
      updatePresence(false);
      
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      cleanupChannel();
    };
  }, [currentProfile, updatePresence, fetchOnlineUsers, cleanupChannel, isSubscribed]);

  return {
    onlineUsers,
    loading,
    updatePresence,
    refetch: fetchOnlineUsers
  };
};
