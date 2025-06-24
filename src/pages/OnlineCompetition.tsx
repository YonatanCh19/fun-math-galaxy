import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { renderAvatarByType, AvatarCharacter } from '@/components/AvatarSelector';
import { Users, Search, Send } from 'lucide-react';
import Spinner from '@/components/LoadingSpinner';

// קומפוננטות פנימיות עם ברירות מחדל למקרה שלא קיימות
const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-red-100 text-red-700 p-4 rounded-xl text-center">
    <div className="font-bold mb-2">שגיאה</div>
    <div>{message}</div>
    {onRetry && (
      <button onClick={onRetry} className="mt-2 bg-red-500 text-white px-4 py-2 rounded">נסה שוב</button>
    )}
  </div>
);

const EmptyState = ({ icon, title, message }) => (
  <div className="flex flex-col items-center justify-center text-center py-8">
    <div className="text-5xl mb-4 opacity-50">{icon || "👤"}</div>
    <div className="text-xl font-bold mb-2 text-blue-900">{title}</div>
    <div className="text-gray-600">{message}</div>
  </div>
);


const OnlineCompetition = () => {
  const auth = useAuth();
  const user = auth?.user;
  const selectedProfile = auth?.selectedProfile;
  const loadingAuth = auth?.loading;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [myInvitations, setMyInvitations] = useState<any[]>([]);
  const [inviteModal, setInviteModal] = useState<any>(null);
  const [infoMsg, setInfoMsg] = useState('');
  const navigate = (window as any).navigate || ((path: string) => { window.location.href = path; });

  // הפניה אוטומטית אם אין פרופיל
  useEffect(() => {
    if (!loadingAuth && user && !selectedProfile) {
      navigate('/profile-selection');
    }
  }, [loadingAuth, user, selectedProfile, navigate]);

  // טעינת משתמשים מחוברים
  const loadData = useCallback(async () => {
    if (!user || !selectedProfile) return;
    setLoading(true);
    setError(null);
    try {
      // עדכון נוכחות
      await supabase.from('user_presence').upsert({
        profile_id: selectedProfile.id,
        is_online: true,
        last_seen: new Date().toISOString(),
      });
      // שלב 3: טעינת משתמשים מחוברים אחרים
      const { data: presenceRows, error: presenceError } = await supabase
        .from('user_presence')
        .select('profile_id')
        .eq('is_online', true)
        .neq('profile_id', selectedProfile.id);
      if (presenceError) {
        throw new Error('שגיאה בטעינת נוכחות: ' + presenceError.message);
      }
      const onlineProfileIds = presenceRows.map(row => row.profile_id);
      if (onlineProfileIds.length === 0) {
        setUsers([]);
      } else {
        const { data: onlineProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_character')
          .in('id', onlineProfileIds);
        if (profilesError) {
          throw new Error('שגיאה בטעינת פרופילים: ' + profilesError.message);
        }
        setUsers(onlineProfiles || []);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, selectedProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loadingAuth || !user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }
  // אם אין selectedProfile – לא מציגים כלום (הפניה תתבצע אוטומטית)
  if (!selectedProfile) {
    return null;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <ErrorBanner message={error} onRetry={loadData} />
      </div>
    );
  }
  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()));

  // כאן ממשיך כל הקוד של ה-UI (חלק ה-return) מהקובץ המקורי שלך
  // ... מומלץ להעתיק את כל ה-return מהקוד ששלחת:

  return (
    <div className="online-competition min-h-screen bg-kidGradient font-varela p-4">
      <div className="max-w-3xl mx-auto">
        {/* כותרת */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-pinkKid flex items-center gap-3">
            <Users size={32} />
            תחרות אונליין
          </h1>
          <div className="text-blue-900 text-lg font-bold bg-white/80 rounded-full px-4 py-2 shadow">
            {users.length} משתמשים מחוברים
          </div>
        </div>

        {/* חיפוש */}
        <div className="mb-6 flex items-center gap-2 bg-white/90 rounded-xl px-4 py-2 shadow">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="חפש משתמש..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none px-2 py-2 text-blue-900"
          />
        </div>

        {/* רשימת משתמשים או הודעת "אין משתמשים" */}
        {users.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              icon={<Users size={48} className="mx-auto opacity-50" />} 
              title="אף אחד לא מחובר כרגע" 
              message="נסה לרענן בעוד מספר דקות, או הזמן חבר להצטרף למשחק!" 
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-xl shadow hover:scale-[1.02] transition-transform"
                >
                  {renderAvatarByType(u.avatar_character as AvatarCharacter, 'md')}
                  <div className="flex-1">
                    <div className="font-bold text-blue-900 text-lg">{u.name}</div>
                  </div>
                  <button
                    // disabled={...} // הוסף כאן את הלוגיקה של disabling
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold shadow hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                    שלח הזמנה
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12">
                  <EmptyState 
                    icon={<Search size={48} className="mx-auto opacity-50" />} 
                    title="לא נמצאו משתמשים" 
                    message={`אין שחקנים בשם "${search}"`} 
                  />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineCompetition;
