import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, Users, Trophy, Globe, Shield, Clock, Search, Filter } from 'lucide-react';
import { renderAvatarByType, AvatarCharacter } from '@/components/AvatarSelector';

type CompetitionInvitation = {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  competition_id: string;
  status: string;
  created_at: string;
  from_profile?: {
    id: string;
    name: string;
    avatar_character?: string;
    user_id?: string;
  };
};

export default function OnlineCompetition() {
  const { user, selectedProfile } = useAuth();
  const navigate = useNavigate();
  const { onlineUsers, loading: presenceLoading } = useOnlinePresence(selectedProfile);
  const [invitations, setInvitations] = useState<CompetitionInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSameEmail, setFilterSameEmail] = useState(false);
  const channelRef = useRef<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DEBUGGING
  console.log('OnlineCompetition render', { user, selectedProfile, onlineUsers, presenceLoading, invitations });

  useEffect(() => {
    console.log('OnlineCompetition mounted with profile:', selectedProfile?.id);
    
    if (!user || !selectedProfile) {
      navigate('/practice');
      return;
    }

    fetchInvitations();
    subscribeToInvitations();

    return () => {
      console.log('Cleaning up OnlineCompetition component');
      cleanupChannel();
    };
  }, [user, selectedProfile]);

  const cleanupChannel = () => {
    if (channelRef.current) {
      try {
        console.log('Cleaning up invitations channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      } catch (error) {
        console.error('Error cleaning up invitations channel:', error);
      }
    }
  };

  const fetchInvitations = async () => {
    if (!selectedProfile) return;

    console.log('Fetching invitations for profile:', selectedProfile.id);

    try {
      const { data, error } = await supabase
        .from('competition_invitations')
        .select('*')
        .eq('to_profile_id', selectedProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      console.log('Invitations data:', data);

      if (data && data.length > 0) {
        const profileIds = data.map(inv => inv.from_profile_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_character, user_id')
          .in('id', profileIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setInvitations(data as CompetitionInvitation[]);
          return;
        }

        const invitationsWithProfiles = data.map(invitation => ({
          ...invitation,
          from_profile: profiles?.find(p => p.id === invitation.from_profile_id)
        })) as CompetitionInvitation[];

        console.log('Invitations with profiles:', invitationsWithProfiles);
        setInvitations(invitationsWithProfiles);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const subscribeToInvitations = () => {
    if (!selectedProfile || isSubscribed || channelRef.current) return;

    const uniqueChannelName = `competition-invitations-${selectedProfile.id}-${Date.now()}`;
    console.log('Subscribing to invitations channel:', uniqueChannelName);

    try {
      channelRef.current = supabase
        .channel(uniqueChannelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'competition_invitations',
            filter: `to_profile_id=eq.${selectedProfile.id}|from_profile_id=eq.${selectedProfile.id}`
          },
          (payload) => {
            console.log('Invitation change detected:', payload);
            fetchInvitations();

            const invitation = payload.new as any;
            if (
              invitation &&
              typeof invitation === 'object' &&
              invitation.status === 'accepted' &&
              (invitation.to_profile_id === selectedProfile.id || invitation.from_profile_id === selectedProfile.id)
            ) {
              console.log('Navigating both users to game:', invitation.competition_id);
              localStorage.setItem('currentCompetitionId', invitation.competition_id);
              if (!window.location.pathname.includes(`/online-game/${invitation.competition_id}`)) {
                navigate(`/online-game/${invitation.competition_id}`);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Invitations channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Invitations channel subscription error');
            setIsSubscribed(false);
          }
        });
    } catch (error) {
      console.error('Error creating invitations channel:', error);
    }
  };

  const sendInvitation = async (toProfileId: string) => {
    if (!selectedProfile) return;

    if (toProfileId === selectedProfile.id) {
      toast.error('לא ניתן לשלוח הזמנה לעצמך');
      return;
    }

    const targetUser = onlineUsers.find(u => u.profile_id === toProfileId);
    if (!targetUser || !targetUser.is_online) {
      toast.error('המשתמש אינו מחובר כרגע');
      return;
    }

    console.log('Sending invitation from', selectedProfile.id, 'to', toProfileId);
    setLoading(true);
    
    try {
      const { data: existingInvitations, error: checkError } = await supabase
        .from('competition_invitations')
        .select('id')
        .eq('from_profile_id', selectedProfile.id)
        .eq('to_profile_id', toProfileId)
        .eq('status', 'pending');

      if (checkError) {
        console.error('Error checking existing invitations:', checkError);
        toast.error('שגיאה בבדיקת הזמנות קיימות');
        return;
      }

      if (existingInvitations && existingInvitations.length > 0) {
        toast.error('כבר שלחת הזמנה לאותו משתמש');
        return;
      }

      const { data: competition, error: competitionError } = await supabase
        .from('online_competitions')
        .insert({
          player1_id: selectedProfile.id,
          player2_id: toProfileId,
          status: 'pending'
        })
        .select()
        .single();

      if (competitionError) {
        console.error('Error creating competition:', competitionError);
        toast.error('שגיאה ביצירת התחרות');
        return;
      }

      console.log('Competition created:', competition);

      const { error: invitationError } = await supabase
        .from('competition_invitations')
        .insert({
          from_profile_id: selectedProfile.id,
          to_profile_id: toProfileId,
          competition_id: competition.id,
          status: 'pending'
        });

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        toast.error('שגיאה בשליחת ההזמנה');
        return;
      }

      console.log('Invitation sent successfully');
      toast.success('ההזמנה נשלחה בהצלחה!', {
        description: 'המתן לתשובת השחקן השני',
        icon: '📤',
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('שגיאה בשליחת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, competitionId: string, accept: boolean) => {
    console.log('Responding to invitation:', invitationId, 'competitionId:', competitionId, 'accept:', accept);
    setLoading(true);
    
    try {
      const { error: invitationError } = await supabase
        .from('competition_invitations')
        .update({ 
          status: accept ? 'accepted' : 'declined'
        })
        .eq('id', invitationId);

      if (invitationError) {
        console.error('Error updating invitation:', invitationError);
        toast.error('שגיאה בעדכון ההזמנה');
        return;
      }

      if (accept) {
        console.log('Accepting invitation, updating competition to active');
        const { error: competitionError } = await supabase
          .from('online_competitions')
          .update({ 
            status: 'active',
            started_at: new Date().toISOString()
          })
          .eq('id', competitionId);

        if (competitionError) {
          console.error('Error updating competition:', competitionError);
          toast.error('שגיאה בהתחלת התחרות');
          return;
        }

        console.log('Competition started successfully, navigating to game with ID:', competitionId);
        
        localStorage.setItem('currentCompetitionId', competitionId);
        
        toast.success('התחרות מתחילה!', {
          description: 'מועבר לדף המשחק...',
          icon: '🎮',
        });
        
        setTimeout(() => {
          navigate(`/online-game/${competitionId}`);
        }, 1000);
      } else {
        console.log('Declining invitation, updating competition to cancelled');
        const { error: competitionError } = await supabase
          .from('online_competitions')
          .update({ 
            status: 'cancelled'
          })
          .eq('id', competitionId);

        if (competitionError) {
          console.error('Error cancelling competition:', competitionError);
        }

        toast.success('ההזמנה נדחתה');
      }

      fetchInvitations();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('שגיאה בטיפול בהזמנה');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filter criteria
  console.log('All onlineUsers from hook:', onlineUsers);
  const filteredUsers = onlineUsers.filter(user => {
    const matchesSearch = user.profile.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterSameEmail || user.profile.is_same_user;
    return matchesSearch && matchesFilter;
  });
  console.log('Filtered users:', filteredUsers);

  // fallback UI: אין משתמשים מחוברים כלל
  if (!onlineUsers || onlineUsers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela">
        <Users size={48} className="mb-4 text-gray-400" />
        <p className="text-lg mb-2">אין משתמשים מחוברים כרגע</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => window.location.reload()}>רענן</button>
      </div>
    );
  }

  if (!user || !selectedProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-kidGradient font-varela p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/practice')}
            className="flex items-center gap-2 bg-white/80 text-blue-800 px-4 py-2 rounded-lg shadow hover:scale-105 transition"
          >
            <ArrowLeft size={20} />
            חזרה לתרגילים
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-pinkKid flex items-center gap-3">
            <Trophy size={28} />
            תחרות אונליין
          </h1>
        </div>

        {/* Info Card */}
        <div className="bg-blue-100 rounded-xl p-4 mb-6 border-2 border-blue-300">
          <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Globe size={20} />
            משחקי מיקס תרגילים עד 15 נקודות!
          </h2>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="flex items-center gap-2">
              <Shield size={16} />
              כעת תוכל לשחק עם משתמשים מכל רחבי האתר
            </p>
            <p className="flex items-center gap-2">
              <Clock size={16} />
              המנצח הראשון ל-15 נקודות זוכה במשחק חינם!
            </p>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white/90 rounded-xl p-4 md:p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              📬 הזמנות ממתינות
            </h2>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-yellow-100 p-4 rounded-lg gap-3">
                  <div className="flex items-center gap-3">
                    {invitation.from_profile && (
                      <>
                        {renderAvatarByType(invitation.from_profile.avatar_character as AvatarCharacter, 'sm')}
                        <div>
                          <span className="font-bold text-blue-900 block">
                            {invitation.from_profile.name} מזמין אותך לתחרות!
                          </span>
                          {invitation.from_profile.user_id !== selectedProfile.user_id && (
                            <span className="text-xs text-blue-600">משתמש מחשבון אחר</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToInvitation(invitation.id, invitation.competition_id, true)}
                      disabled={loading}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      ✓ אשר
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, invitation.competition_id, false)}
                      disabled={loading}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      ✗ דחה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white/90 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="חפש משתמש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterSameEmail}
                onChange={(e) => setFilterSameEmail(e.target.checked)}
                className="rounded"
              />
              <Filter size={16} />
              רק מהחשבון שלי
            </label>
          </div>
        </div>

        {/* Online Users */}
        <div className="bg-white/90 rounded-xl p-4 md:p-6 shadow-lg">
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Users size={24} />
            משתמשים מחוברים ({filteredUsers.length})
          </h2>
          <div className="text-sm text-gray-500 mb-2">נמצאו {onlineUsers.length} משתמשים מחוברים (לפני סינון)</div>

          {presenceLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner message="טוען משתמשים מחוברים..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {searchTerm || filterSameEmail ? 'לא נמצאו משתמשים מתאימים' : 'אין משתמשים מחוברים כרגע'}
              </p>
              <p className="text-sm">
                {searchTerm || filterSameEmail ? 'נסה לשנות את הסינון או החיפוש' : 'נסה שוב מאוחר יותר'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.profile_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3">
                    {renderAvatarByType(user.profile.avatar_character as AvatarCharacter, 'sm')}
                    <div>
                      <p className="font-bold text-blue-900">{user.profile.name}</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          זמין למשחק
                        </span>
                        {user.profile.email_preview && (
                          <span className="text-xs text-gray-600">
                            {user.profile.email_preview}
                          </span>
                        )}
                        {user.profile.is_same_user && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full w-fit">
                            מהחשבון שלך
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => sendInvitation(user.profile_id)}
                    disabled={loading || user.profile_id === selectedProfile.id}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {user.profile_id === selectedProfile.id ? 'זה אתה' : 'הזמן לתחרות'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
