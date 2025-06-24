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

// Type guard לבדוק אם res הוא אובייקט עם status === 'error'
function isErrorRes(val: unknown): val is { status: string } {
  return typeof val === 'object' && val !== null && 'status' in val && (val as any).status === 'error';
}

const OnlineCompetition = () => {
  const auth = useAuth();
  const user = auth?.user;
  const selectedProfile = auth?.selectedProfile;
  const loadingAuth = auth?.loading;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState('');
  const [incomingInvite, setIncomingInvite] = useState<{ id: string; from: string } | null>(null);
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
          .select('id, name, avatar_character, user_id')
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

  // שליחת הזמנה
  const handleSendInvite = async (targetUserId: string) => {
    setSendingInvite(targetUserId);
    setError(null);
    try {
      // 1. בדיקת תקינות משתמש
      if (!user || !user.id) {
        throw new Error('משתמש לא זמין');
      }
      // 2. יצירת הזמנה ב-Supabase
      const { data: invite, error: inviteError } = await supabase
        .from('game_invites')
        .insert({
          from_user: user.id,
          to_user: targetUserId,
          status: 'pending'
        })
        .select()
        .single();
      if (inviteError) throw inviteError;
      console.log('הזמנה נוצרה:', invite.id);
      // 3. שליחת התראה בזמן אמת
      const channel = supabase.channel(`invite_${targetUserId}`);
      const broadcastRes = await channel.send({
        type: 'broadcast',
        event: 'new_invite',
        payload: {
          from_user: user.id,
          to_user: targetUserId,
          invite_id: invite.id
        }
      });
      // 4. בדיקת תקינות השליחה
      if (broadcastRes === 'error' || (broadcastRes && (broadcastRes as any).status === 'error')) {
        throw new Error('שליחת ההתראה נכשלה');
      }
      // 5. עדכון UI
      setInfoMsg(`הזמנה נשלחה ל${users.find(u => u.id === targetUserId)?.name || 'שחקן'}`);
    } catch (error: any) {
      console.error('פרטי שגיאה:', {
        userId: user?.id,
        targetUserId,
        error
      });
      setError('שליחת ההזמנה נכשלה: ' + error.message);
    } finally {
      setSendingInvite(null);
    }
  };

  // האזנה להזמנות נכנסות
  useEffect(() => {
    if (!user?.id) return;
    // האזנה להזמנות ספציפיות למשתמש הנוכחי
    const channel = supabase.channel(`invite_${user.id}`)
      .on('broadcast', { event: 'new_invite' }, (payload) => {
        console.log('התקבלה הזמנה חדשה:', payload);
        setIncomingInvite({
          id: payload.payload.invite_id,
          from: payload.payload.from_user
        });
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // טיפול בהזמנה נכנסת
  const handleInviteResponse = async (accepted: boolean) => {
    if (!incomingInvite) return;
    try {
      // עדכון סטטוס ההזמנה
      const { error } = await supabase
        .from('game_invites')
        .update({ status: accepted ? 'accepted' : 'declined' })
        .eq('id', incomingInvite.id);
      if (error) throw error;
      if (accepted) {
        // יצירת חדר משחק
        const roomId = Math.random().toString(36).substring(2, 12); // nanoid חלופי
        // הוספת שני השחקנים לחדר
        await supabase.from('game_rooms').insert([
          { room_id: roomId, user_id: user.id },
          { room_id: roomId, user_id: incomingInvite.from },
        ]);
        // נווט לחדר המשחק
        window.location.href = `/game/${roomId}`;
      }
    } catch (error) {
      console.error('שגיאה בתגובה להזמנה:', error);
    } finally {
      setIncomingInvite(null);
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }
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
                    onClick={() => handleSendInvite(u.id)}
                    disabled={!!sendingInvite}
                    className={`bg-blue-500 text-white px-4 py-2 rounded ${sendingInvite === u.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                  >
                    {sendingInvite === u.id ? (
                      <span className="flex items-center">
                        <span className="mr-2"><Spinner size="sm" /></span> טוען...
                      </span>
                    ) : (
                      'שלח הזמנה'
                    )}
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
        {/* פופ-אפ להזמנה נכנסת */}
        {incomingInvite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-md">
              <h2 className="text-xl font-bold mb-4">הזמנה למשחק</h2>
              <p>שחקן מזמין אותך למשחק!</p>
              <div className="flex gap-4 mt-6">
                <button onClick={() => handleInviteResponse(false)} className="flex-1 bg-gray-200 py-2 rounded">דחה</button>
                <button onClick={() => handleInviteResponse(true)} className="flex-1 bg-green-500 text-white py-2 rounded">קבל</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineCompetition;
