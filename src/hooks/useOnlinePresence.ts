import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile as ImportedProfile } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  avatar_character?: string;
  pin?: string;
}

export type OnlineUser = {
  profile_id: string;
  profile: Profile & {
    email_preview: string;
    is_same_user: boolean;
  };
  is_online: boolean;
  last_seen: string;
  user_id: string;
};

export const useOnlinePresence = (currentProfile: ImportedProfile | null) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presenceChannelRef = useRef<any>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();
  const sentInvitationsChannelRef = useRef<any>(null);
  const receivedInvitationsChannelRef = useRef<any>(null);
  const navigationLockRef = useRef<boolean>(false);

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
      setError(null);
      console.log('Fetching online users from all emails');
      
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('is_online', true);

      if (presenceError) {
        console.error('Error fetching presence:', presenceError);
        setError('Error fetching presence: ' + presenceError.message);
        return;
      }

      console.log('Presence data:', presenceData);

      if (presenceData && presenceData.length > 0 && Array.isArray(presenceData)) {
        const { data: rawProfilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', presenceData.map((p: any) => p?.profile_id).filter(Boolean));
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setError('Error fetching profiles: ' + profilesError.message);
          return;
        }
        const profilesData: Profile[] = Array.isArray(rawProfilesData) ? rawProfilesData as Profile[] : [];
        const validProfiles: Profile[] = profilesData.filter(
          (p): p is Profile =>
            !!p &&
            typeof p === 'object' &&
            typeof p.id === 'string' &&
            typeof p.user_id === 'string' &&
            typeof p.name === 'string' &&
            typeof p.created_at === 'string'
        );
        const userIds = Array.isArray(profilesData) ? profilesData.map(p => p?.user_id).filter(Boolean) : [];
        const { data: usersData } = await supabase.auth.admin.listUsers();
        
        const usersWithPresence: OnlineUser[] = presenceData.map((presence: any) => {
          if (!presence?.profile_id) return null;
          const profile: Profile | undefined = validProfiles.find((p: Profile) => p.id === presence?.profile_id);
          if (!profile) return null;
          const user = usersData?.users?.find((u: any) => u && u.id === profile.user_id);
          const emailPreview = user?.email ? user.email.split('@')[0] + '@...' : '';
          const isSameUser = profile.user_id === currentProfile?.user_id;
          return {
            profile_id: presence.profile_id,
            profile: {
              ...profile,
              email_preview: emailPreview ?? '',
              is_same_user: isSameUser ?? false,
            },
            is_online: presence.is_online ?? false,
            last_seen: presence.last_seen ?? '',
            user_id: profile.user_id ?? '',
          };
        }).filter((u): u is OnlineUser => !!u && typeof u.profile_id === 'string' && typeof u.user_id === 'string' && typeof u.profile.email_preview === 'string' && typeof u.profile.is_same_user === 'boolean');

        // Filter out current profile
        const filteredUsers = usersWithPresence.filter(user => 
          user && user.profile_id && currentProfile?.id ? user.profile_id !== currentProfile.id : true
        );

        console.log('Online users from all emails (after filter):', filteredUsers);
        setOnlineUsers(filteredUsers);
      } else {
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      setError('Error fetching online users: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  const cleanupChannel = useCallback(() => {
    if (presenceChannelRef.current) {
      try {
        console.log('Cleaning up existing presence channel');
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
        setIsSubscribed(false);
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentProfile?.id) return;
    setLoading(true);
    setError(null);

    // ניקוי ערוץ קיים לפני יצירת חדש
    if (presenceChannelRef.current) {
      try {
        supabase.removeChannel(presenceChannelRef.current);
      } catch (e) {
        console.warn('שגיאה בניקוי ערוץ ישן:', e);
      }
      presenceChannelRef.current = null;
    }

    // צור שם ערוץ ייחודי
    const uniqueChannelName = `user-presence-${currentProfile.id}-${Date.now()}`;
    let channel;
    try {
      channel = supabase
        .channel(uniqueChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        }, (payload) => {
          // כאן יש להפעיל fetchOnlineUsers או עדכון סטייט
          // ...
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setLoading(false);
          }
        });
      presenceChannelRef.current = channel;
    } catch (e) {
      setError('שגיאה ביצירת ערוץ: ' + e.message);
      console.error('שגיאה ביצירת ערוץ:', e);
    }

    // דמו: סימולציה של קבלת משתמשים (להחליף בלוגיקה האמיתית)
    setTimeout(() => {
      setOnlineUsers([]); // כאן יש להחזיר את המשתמשים האמיתיים
      setLoading(false);
    }, 1000);

    return () => {
      if (presenceChannelRef.current) {
        try {
          supabase.removeChannel(presenceChannelRef.current);
        } catch (e) {
          console.warn('שגיאה בניקוי ערוץ ביציאה:', e);
        }
        presenceChannelRef.current = null;
      }
    };
  }, [currentProfile?.id]);

  useEffect(() => {
    if (!currentProfile) return;

    // ניקוי ערוצים קודמים
    if (sentInvitationsChannelRef.current) {
      try {
        supabase.removeChannel(sentInvitationsChannelRef.current);
        sentInvitationsChannelRef.current = null;
      } catch (e) { console.error('Error cleaning sentInvitationsChannel:', e); }
    }
    if (receivedInvitationsChannelRef.current) {
      try {
        supabase.removeChannel(receivedInvitationsChannelRef.current);
        receivedInvitationsChannelRef.current = null;
      } catch (e) { console.error('Error cleaning receivedInvitationsChannel:', e); }
    }
    navigationLockRef.current = false;

    // האזנה להזמנות שנשלחו על ידי המשתמש
    sentInvitationsChannelRef.current = supabase
      .channel('sent-invitations')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'competition_invitations',
        filter: `from_profile_id=eq.${currentProfile.id}`
      }, (payload: any) => {
        console.log('[SYNC] Update on sent invitation:', payload);
        if (payload?.new?.status === 'accepted' && payload?.new?.competition_id && !navigationLockRef.current) {
          navigationLockRef.current = true;
          console.log('[SYNC] Navigating (sent) to game:', payload.new.competition_id);
          navigate(`/online-game/${payload.new.competition_id}`);
        }
      })
      .subscribe((status: any) => {
        console.log('[SYNC] sent-invitations channel status:', status);
      });

    // האזנה להזמנות שהתקבלו על ידי המשתמש
    receivedInvitationsChannelRef.current = supabase
      .channel('received-invitations')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'competition_invitations',
        filter: `to_profile_id=eq.${currentProfile.id}`
      }, (payload: any) => {
        console.log('[SYNC] Update on received invitation:', payload);
        if (payload?.new?.status === 'accepted' && payload?.new?.competition_id && !navigationLockRef.current) {
          navigationLockRef.current = true;
          console.log('[SYNC] Navigating (received) to game:', payload.new.competition_id);
          navigate(`/online-game/${payload.new.competition_id}`);
        }
      })
      .subscribe((status: any) => {
        console.log('[SYNC] received-invitations channel status:', status);
      });

    // ניקוי ערוצים ב-unmount
    return () => {
      if (sentInvitationsChannelRef.current) {
        try {
          supabase.removeChannel(sentInvitationsChannelRef.current);
          sentInvitationsChannelRef.current = null;
        } catch (e) { console.error('Error cleaning sentInvitationsChannel:', e); }
      }
      if (receivedInvitationsChannelRef.current) {
        try {
          supabase.removeChannel(receivedInvitationsChannelRef.current);
          receivedInvitationsChannelRef.current = null;
        } catch (e) { console.error('Error cleaning receivedInvitationsChannel:', e); }
      }
      navigationLockRef.current = false;
    };
  }, [currentProfile, navigate]);

  // Error Boundary בסיסי
  if (error) {
    return {
      onlineUsers: [],
      loading: false,
      error,
    };
  }

  return {
    onlineUsers,
    loading,
    error,
    updatePresence,
    refetch: fetchOnlineUsers
  };
};
