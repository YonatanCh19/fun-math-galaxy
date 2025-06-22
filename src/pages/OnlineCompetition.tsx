import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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

const OnlineCompetition = () => {
  const { user, selectedProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitations, setInvitations] = useState<CompetitionInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSameEmail, setFilterSameEmail] = useState(false);

  // לוג בסיסי
  console.log('OnlineCompetition render', { user, selectedProfile, users, isLoading });

  // לוגים ל-debug
  console.log('[OnlineCompetition] users:', users);

  // תנאי טעינה בסיסיים
  if (!user || !selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
        <LoadingSpinner message="טוען משתמש..." />
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
        <LoadingSpinner message="טוען משתמשים מחוברים..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 font-varela">
        <div className="bg-white p-6 rounded-xl shadow text-red-700 text-center">
          <h2 className="text-xl font-bold mb-2">שגיאה בטעינת משתמשים</h2>
          <div className="mb-2">{error}</div>
          <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-4 py-2 rounded">רענן דף</button>
        </div>
      </div>
    );
  }

  // סינון משתמשים בסיסי
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    // אין סינון מתקדם כרגע
    return matchesSearch;
  });

  // 2. החזר לוגיקה מלאה של שליחת הזמנה
  async function sendInvitation(toProfileId: string) {
    if (!selectedProfile || !toProfileId) return;
    setLoading(true);
    try {
      // צור תחרות חדשה
      const { data: competition, error: compError } = await supabase
        .from('online_competitions')
        .insert({
          player1_id: selectedProfile.id,
          player2_id: toProfileId,
          player1_score: 0,
          player2_score: 0,
          status: 'pending',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (compError || !competition) {
        toast.error('שגיאה ביצירת תחרות');
        setLoading(false);
        return;
      }
      // שלח הזמנה
      const { error: invError } = await supabase
        .from('competition_invitations')
        .insert({
          from_profile_id: selectedProfile.id,
          to_profile_id: toProfileId,
          competition_id: competition.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      if (invError) {
        toast.error('שגיאה בשליחת הזמנה');
        setLoading(false);
        return;
      }
      toast.success('ההזמנה נשלחה! ממתין לאישור...');
      // שמור מזהה תחרות לניווט אוטומטי
      localStorage.setItem('currentCompetitionId', competition.id);
      // נווט אוטומטית אם אתה השולח
      navigate(`/online-game/${competition.id}`);
    } catch (e) {
      toast.error('שגיאה בשליחת הזמנה');
    } finally {
      setLoading(false);
    }
  }

  // 3. סנכרון הזמנות (Realtime + Polling)
  useEffect(() => {
    if (!selectedProfile) return;
    let pollingActive = true;
    let pollInvitations: NodeJS.Timeout | null = null;
    let navigated = false;

    // מאזין להזמנות שהתקבלו או נשלחו
    const subscribeToInvitations = () => {
      const uniqueChannelName = `invitations-${selectedProfile.id}-${Date.now()}`;
      const channel = supabase
        .channel(uniqueChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'competition_invitations',
          filter: `from_profile_id=eq.${selectedProfile.id},to_profile_id=eq.${selectedProfile.id}`
        }, (payload) => {
          const invitation = payload.new as CompetitionInvitation | undefined;
          if (invitation && invitation.status === 'accepted' && invitation.competition_id && !navigated) {
            navigated = true;
            localStorage.setItem('currentCompetitionId', invitation.competition_id);
            navigate(`/online-game/${invitation.competition_id}`);
          }
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // fallback polling
            startPolling();
          }
        });
      return channel;
    };

    // fallback polling
    const startPolling = () => {
      if (pollInvitations) return;
      pollInvitations = setInterval(async () => {
        const { data, error } = await supabase
          .from('competition_invitations')
          .select('*')
          .or(`from_profile_id.eq.${selectedProfile.id},to_profile_id.eq.${selectedProfile.id}`)
          .eq('status', 'accepted');
        if (data && data.length > 0 && !navigated) {
          const invitation = data[0] as CompetitionInvitation;
          if (invitation.competition_id) {
            navigated = true;
            localStorage.setItem('currentCompetitionId', invitation.competition_id);
            navigate(`/online-game/${invitation.competition_id}`);
            if (pollInvitations) clearInterval(pollInvitations);
          }
        }
      }, 2000);
    };

    const channel = subscribeToInvitations();
    // fallback: אם תוך 5 שניות אין חיבור realtime, התחל polling
    setTimeout(() => {
      if (!navigated && pollingActive) startPolling();
    }, 5000);

    return () => {
      pollingActive = false;
      if (pollInvitations) clearInterval(pollInvitations);
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedProfile, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*');
        setUsers(data || []);
        setIsLoading(false);
      } catch (err) {
        setError(err?.message || 'שגיאה בטעינת משתמשים');
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
            משתמשים ({filteredUsers.length})
          </h2>
          <div className="text-sm text-gray-500 mb-2">נמצאו {users.length} משתמשים (לפני סינון)</div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">לא נמצאו משתמשים מתאימים</p>
              <p className="text-sm">נסה לשנות את הסינון או החיפוש</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3">
                    {renderAvatarByType(user.avatar_character as AvatarCharacter, 'sm')}
                    <div>
                      <p className="font-bold text-blue-900">{user.name}</p>
                    </div>
                  </div>
                  {/* כפתור דמו בלבד */}
                  <button
                    disabled
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold opacity-50 cursor-not-allowed w-full sm:w-auto"
                  >
                    הזמן לתחרות
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineCompetition;
