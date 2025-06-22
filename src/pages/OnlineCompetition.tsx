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

const OnlineCompetition = () => {
  const { user, selectedProfile } = useAuth();
  const navigate = useNavigate();
  const { onlineUsers, loading: isLoading, error } = useOnlinePresence(selectedProfile);
  const [invitations, setInvitations] = useState<CompetitionInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSameEmail, setFilterSameEmail] = useState(false);

  // לוג בסיסי
  console.log('OnlineCompetition render', { user, selectedProfile, onlineUsers, isLoading });

  // לוגים ל-debug
  console.log('[OnlineCompetition] onlineUsers:', onlineUsers);

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

  // סינון משתמשים
  const filteredUsers = onlineUsers.filter(user => {
    const matchesSearch = user.profile.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterSameEmail || user.profile.is_same_user;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-kidGradient font-varela p-4">
      <div className="max-w-4xl mx-auto">
        {/* Debug info זמני */}
        <div className="mb-4 p-2 bg-yellow-100 rounded text-xs text-gray-700">
          <div>isLoading: {String(isLoading)}</div>
          <div>onlineUsers.length: {onlineUsers.length}</div>
          <div>onlineUsers: {JSON.stringify(onlineUsers)}</div>
        </div>
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
            משתמשים מחוברים ({filteredUsers.length})
          </h2>
          <div className="text-sm text-gray-500 mb-2">נמצאו {onlineUsers.length} משתמשים מחוברים (לפני סינון)</div>

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
                    onClick={() => toast('שליחת הזמנה לאקטיבית (דמו)')}
                    disabled={user.profile_id === selectedProfile.id}
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
};

export default OnlineCompetition;
