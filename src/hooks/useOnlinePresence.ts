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

export function useOnlinePresence(currentProfile) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      if (!currentProfile?.id) {
        setOnlineUsers([]);
        setLoading(false);
        return;
      }
      // שאילתה פשוטה: כל הפרופילים
      (async () => {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        if (profilesError) {
          setError('שגיאה בטעינת פרופילים: ' + profilesError.message);
          setOnlineUsers([]);
        } else {
          setOnlineUsers(
            (data || []).map((profile) => ({
              profile_id: profile.id,
              profile,
              is_online: true,
              last_seen: '',
              user_id: profile.user_id,
            }))
          );
        }
        setLoading(false);
      })();
    } catch (err) {
      console.error('useOnlinePresence error:', err);
      setError('שגיאה כללית: ' + (err?.message || err));
      setOnlineUsers([]);
      setLoading(false);
    }
  }, [currentProfile?.id]);

  if (error) {
    return {
      onlineUsers: [],
      loading: false,
      error,
    };
  }

  return { onlineUsers, loading, error };
}
