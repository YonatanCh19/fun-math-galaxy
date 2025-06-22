import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  pin?: string;
  avatar_character?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profiles: Profile[] | null;
  selectedProfile: Profile | null;
  selectProfile: (profile: Profile | null) => void;
  refetchProfiles: (() => Promise<void>) | null,
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const selectProfile = (profile: Profile | null) => {
    setSelectedProfile(profile);
    if (profile) {
      localStorage.setItem('selectedProfileId', profile.id);
    } else {
      localStorage.removeItem('selectedProfileId');
    }
  };

  const handleAuthError = async (error: any) => {
    console.error('Auth error:', error);
    
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
      
      // Clear local storage
      localStorage.removeItem('selectedProfileId');
      setProfiles(null);
      selectProfile(null);
      
      // Navigate to auth page
      window.location.href = '/auth';
      return;
    }
  };

  const getProfiles = async (currentUser: User) => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) {
        await handleAuthError(error);
        throw error;
      }

      setProfiles(profilesData || []);

      const storedProfileId = localStorage.getItem('selectedProfileId');
      if (storedProfileId) {
        const profileToSelect = profilesData?.find(p => p.id === storedProfileId);
        if(profileToSelect) {
          setSelectedProfile(profileToSelect);
        } else {
          localStorage.removeItem('selectedProfileId');
          setSelectedProfile(null);
        }
      }
    } catch (error: any) {
      await handleAuthError(error);
      setProfiles([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Using setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(() => {
            getProfiles(currentUser).finally(() => {
              setLoading(false);
            });
          }, 0);
        } else {
          // Handle case where there is no user (e.g., signed out or no initial session)
          setProfiles(null);
          selectProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  const refetchProfiles = user ? async () => {
    try {
      await getProfiles(user);
    } catch (error) {
      console.error('Error refetching profiles:', error);
    }
  } : null;

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      selectProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    profiles,
    selectedProfile,
    selectProfile,
    loading,
    signOut,
    refetchProfiles
  };

  return <AuthContext.Provider value={value}>{!loading ? children : 
    <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
      <p className="text-xl text-pinkKid animate-pulse">טוען...</p>
    </div>
  }</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
