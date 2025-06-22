import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { renderAvatarByType, AvatarCharacter } from '@/components/AvatarSelector';
import { Users, Search, Send } from 'lucide-react';

const getCurrentProfile = () => {
  // נסה להביא את הפרופיל הנבחר מה-localStorage או context (פשטות)
  try {
    const profile = localStorage.getItem('selectedProfile');
    return profile ? JSON.parse(profile) : null;
  } catch {
    return null;
  }
};

const OnlineCompetition = () => {
  // לוג בסיסי
  console.log('OnlineCompetition render');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState<string | null>(null); // id של משתמש שנשלחת אליו הזמנה
  const [inviteModal, setInviteModal] = useState(null); // {from_profile, invitation_id, competition_id}
  const [waitingForAccept, setWaitingForAccept] = useState<string | null>(null); // competition_id
  const [infoMsg, setInfoMsg] = useState('');
  const [polling, setPolling] = useState(false);
  const [myInvitations, setMyInvitations] = useState([]);

  const currentProfile = getCurrentProfile();

  // 1. טען רק משתמשים מחוברים (is_online=true)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) setError(error.message);
        else {
          // טען רק משתמשים שמחוברים (is_online=true)
          const { data: presence } = await supabase.from('user_presence').select('*').eq('is_online', true);
          const onlineIds = (presence || []).map(p => p.profile_id);
          setUsers((data || []).filter(u => onlineIds.includes(u.id) && (!currentProfile || u.id !== currentProfile.id)));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentProfile]);

  // 2. Polling להזמנות נכנסות/יוצאות
  useEffect(() => {
    if (!currentProfile) return;
    setPolling(true);
    let pollInterval = setInterval(async () => {
      // בדוק הזמנות נכנסות
      const { data: incoming } = await supabase
        .from('competition_invitations')
        .select('*')
        .eq('to_profile_id', currentProfile.id)
        .eq('status', 'pending');
      if (incoming && incoming.length > 0) {
        // הבא רק את ההזמנה האחרונה
        const invitation = incoming[0];
        // הבא פרטי שולח
        const { data: fromProfile } = await supabase.from('profiles').select('*').eq('id', invitation.from_profile_id).single();
        setInviteModal({
          from_profile: fromProfile,
          invitation_id: invitation.id,
          competition_id: invitation.competition_id
        });
      } else {
        setInviteModal(null);
      }
      // בדוק הזמנות ששלחתי
      const { data: outgoing } = await supabase
        .from('competition_invitations')
        .select('*')
        .eq('from_profile_id', currentProfile.id)
        .eq('status', 'pending');
      setMyInvitations(outgoing || []);
      // בדוק אם יש הזמנה שאושרה
      const { data: accepted } = await supabase
        .from('competition_invitations')
        .select('*')
        .or(`from_profile_id.eq.${currentProfile.id},to_profile_id.eq.${currentProfile.id}`)
        .eq('status', 'accepted');
      if (accepted && accepted.length > 0) {
        const compId = accepted[0].competition_id;
        setInfoMsg('מתחיל משחק...');
        setTimeout(() => {
          window.location.href = `/online-game/${compId}`;
        }, 1000);
      }
    }, 3000);
    return () => {
      setPolling(false);
      clearInterval(pollInterval);
    };
  }, [currentProfile]);

  // 3. שליחת הזמנה אמיתית
  const handleSendInvitation = async (toProfileId: string) => {
    console.log('Sending invitation to:', toProfileId);
    if (!currentProfile) {
      alert('שגיאה: לא נמצא משתמש נוכחי');
      return;
    }
    setSending(toProfileId);
    setInfoMsg('שולח הזמנה...');
    try {
      // צור competition חדש
      const { data: comp, error: compErr } = await supabase
        .from('online_competitions')
        .insert({
          player1_id: currentProfile.id,
          player2_id: toProfileId,
          player1_score: 0,
          player2_score: 0,
          status: 'pending',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      console.log('Competition created:', comp, compErr);
      if (compErr || !comp) throw new Error(compErr?.message || 'שגיאה ביצירת משחק');
      // שלח הזמנה
      const { data: invitation, error: invErr } = await supabase
        .from('competition_invitations')
        .insert({
          from_profile_id: currentProfile.id,
          to_profile_id: toProfileId,
          competition_id: comp.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      console.log('Invitation sent:', invitation, invErr);
      if (invErr) throw new Error(invErr.message);
      setInfoMsg('הזמנה נשלחה - ממתין לאישור...');
      alert('הזמנה נשלחה!');
    } catch (err) {
      setError(err.message);
      setInfoMsg('שגיאה בשליחת הזמנה');
      alert('שגיאה בשליחת הזמנה: ' + err.message);
      console.error('Error sending invitation:', err);
    } finally {
      setSending(null);
      setTimeout(() => setInfoMsg(''), 2000);
    }
  };

  // 4. אישור/דחיית הזמנה
  const handleAccept = async () => {
    if (!inviteModal) return;
    setInfoMsg('מאשר הזמנה...');
    try {
      await supabase
        .from('competition_invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteModal.invitation_id);
      setInfoMsg('מתחיל משחק...');
      setTimeout(() => {
        window.location.href = `/online-game/${inviteModal.competition_id}`;
      }, 1000);
    } catch (err) {
      setError(err.message);
      setInfoMsg('שגיאה באישור הזמנה');
    }
  };
  const handleReject = async () => {
    if (!inviteModal) return;
    setInfoMsg('דוחה הזמנה...');
    try {
      await supabase
        .from('competition_invitations')
        .update({ status: 'rejected' })
        .eq('id', inviteModal.invitation_id);
      setInviteModal(null);
      setInfoMsg('ההזמנה נדחתה');
      setTimeout(() => setInfoMsg(''), 2000);
    } catch (err) {
      setError(err.message);
      setInfoMsg('שגיאה בדחיית הזמנה');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
        <div className="text-xl text-blue-800 animate-pulse">טוען משתמשים...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 font-varela">
        <div className="bg-white p-6 rounded-xl shadow text-red-700 text-center">
          <h2 className="text-xl font-bold mb-2">שגיאה</h2>
          <div className="mb-2">{error}</div>
          <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-4 py-2 rounded">נסה שוב</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kidGradient font-varela p-4">
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

        {/* הודעות */}
        {infoMsg && (
          <div className="mb-4 text-center text-blue-800 bg-white/80 rounded-lg px-4 py-2 animate-pulse font-bold">
            {infoMsg}
          </div>
        )}

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

        {/* רשימת משתמשים */}
        <div className="grid gap-4 md:grid-cols-2">
          {users.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
            <div className="col-span-2 text-center text-gray-500 py-8">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <div className="text-lg">לא נמצאו משתמשים מתאימים</div>
            </div>
          ) : (
            users.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase())).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-xl shadow hover:scale-[1.02] transition-transform"
              >
                {renderAvatarByType(user.avatar_character as AvatarCharacter, 'md')}
                <div className="flex-1">
                  <div className="font-bold text-blue-900 text-lg">{user.name}</div>
                </div>
                <button
                  onClick={() => handleSendInvitation(user.id)}
                  disabled={sending === user.id || myInvitations.some(inv => inv.to_profile_id === user.id && inv.status === 'pending')}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold shadow hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  {sending === user.id ? 'נשלח...' : myInvitations.some(inv => inv.to_profile_id === user.id && inv.status === 'pending') ? 'הוזמן' : 'שלח הזמנה'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Popup להזמנה נכנסת */}
      {inviteModal && inviteModal.from_profile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center max-w-xs w-full">
            <div className="mb-4 flex flex-col items-center gap-2">
              {renderAvatarByType(inviteModal.from_profile.avatar_character as AvatarCharacter, 'md')}
              <div className="font-bold text-blue-900 text-lg">{inviteModal.from_profile.name}</div>
              <div className="text-blue-700">הזמין אותך למשחק אונליין</div>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <button
                onClick={handleAccept}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition"
              >
                אישור
              </button>
              <button
                onClick={handleReject}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                דחייה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineCompetition;

