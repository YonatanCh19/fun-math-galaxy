import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { renderAvatarByType, AvatarCharacter } from '@/components/AvatarSelector';
import { Users, Search, Send, Trophy, ArrowLeft, Crown, Gamepad2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const OnlineCompetition = () => {
  const { user, selectedProfile, loading: authLoading } = useAuth();
  const { onlineUsers, loading, error, sendGameInvite, refetch } = useOnlinePresence(selectedProfile);
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  // Redirect if no profile selected
  useEffect(() => {
    if (!authLoading && user && !selectedProfile) {
      navigate('/profile-selection');
    }
  }, [authLoading, user, selectedProfile, navigate]);

  const handleSendInvite = async (targetProfileId: string) => {
    setSendingInvite(targetProfileId);
    
    try {
      console.log(`🎮 Attempting to send invite to profile: ${targetProfileId}`);
      
      // Create competition first
      const { data: competition, error: competitionError } = await supabase
        .from('online_competitions')
        .insert({
          player1_id: selectedProfile!.id,
          player2_id: targetProfileId,
          status: 'pending',
        })
        .select()
        .single();

      if (competitionError) {
        throw competitionError;
      }

      console.log('🏆 Competition created:', competition.id);

      // Create invitation
      const { error: inviteError } = await supabase
        .from('competition_invitations')
        .insert({
          from_profile_id: selectedProfile!.id,
          to_profile_id: targetProfileId,
          competition_id: competition.id,
          status: 'pending',
        });

      if (inviteError) {
        throw inviteError;
      }

      console.log('📨 Invitation created in database');

      // Send real-time notification using multiple channels for better delivery
      const targetUser = onlineUsers.find(u => u.profile_id === targetProfileId);
      
      // Channel 1: Specific to target profile
      const specificChannelName = `invite_${targetProfileId}`;
      console.log(`📡 Sending to specific channel: ${specificChannelName}`);
      
      const specificChannel = supabase.channel(specificChannelName);
      await specificChannel.subscribe();
      
      await specificChannel.send({
        type: 'broadcast',
        event: 'game_invite',
        payload: {
          from_profile_id: selectedProfile!.id,
          from_name: selectedProfile!.name,
          competition_id: competition.id,
          invite_id: competition.id,
          timestamp: Date.now(),
        }
      });

      // Channel 2: Global channel
      const globalChannelName = `global_invites_${targetProfileId}`;
      console.log(`📡 Sending to global channel: ${globalChannelName}`);
      
      const globalChannel = supabase.channel(globalChannelName);
      await globalChannel.subscribe();
      
      await globalChannel.send({
        type: 'broadcast',
        event: 'game_invite',
        payload: {
          from_profile_id: selectedProfile!.id,
          from_name: selectedProfile!.name,
          competition_id: competition.id,
          invite_id: competition.id,
          timestamp: Date.now(),
        }
      });

      console.log('📡 Invites sent on both channels');

      // Clean up channels
      setTimeout(() => {
        supabase.removeChannel(specificChannel);
        supabase.removeChannel(globalChannel);
      }, 2000);

      toast.success(`הזמנה נשלחה ל${targetUser?.profile.name || 'שחקן'}!`, {
        description: 'ההזמנה נשלחה בזמן אמת - ממתין לתגובה...',
        duration: 5000,
      });

    } catch (error: any) {
      console.error('❌ Error sending invite:', error);
      toast.error('שגיאה בשליחת הזמנה: ' + error.message);
    } finally {
      setSendingInvite(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
        <LoadingSpinner message="טוען..." size="lg" />
      </div>
    );
  }

  if (!selectedProfile) {
    return null;
  }

  const filteredUsers = onlineUsers.filter((u) => 
    u.profile.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-kidGradient font-varela p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/practice')}
              variant="ghost"
              className="bg-white/80 text-blue-800 hover:bg-white hover:scale-105 transition-transform"
            >
              <ArrowLeft size={20} className="ml-2" />
              חזרה לתרגול
            </Button>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-pinkKid flex items-center gap-3">
            <Trophy size={32} className="text-yellow-500" />
            תחרות אונליין
            <Gamepad2 size={32} className="text-blue-500" />
          </h1>
          
          <div className="text-blue-900 text-lg font-bold bg-white/90 rounded-full px-4 py-2 shadow-lg border-2 border-blue-200">
            <Users size={20} className="inline ml-2" />
            {onlineUsers.length} מחוברים
          </div>
        </div>

        {/* Current Player Info */}
        <Card className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {renderAvatarByType(selectedProfile.avatar_character as AvatarCharacter, 'md')}
              <div>
                <h2 className="text-xl font-bold text-blue-900">שלום, {selectedProfile.name}!</h2>
                <p className="text-blue-700">מוכן לתחרות? בחר יריב מהרשימה למטה</p>
                <p className="text-sm text-green-600 font-medium">✅ אתה מחובר ונראה לכל השחקנים האחרים</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="חפש שחקן..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-white/90 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner message="טוען שחקנים מחוברים..." size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 bg-red-100 border-2 border-red-300">
            <CardContent className="p-4 text-center">
              <p className="text-red-700 font-bold mb-2">שגיאה</p>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refetch} className="bg-red-500 hover:bg-red-600 text-white">
                נסה שוב
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Online Users List */}
        {!loading && !error && (
          <>
            {onlineUsers.length === 0 ? (
              <Card className="bg-white/90 border-2 border-gray-300">
                <CardContent className="p-8 text-center">
                  <Users size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">אין שחקנים מחוברים כרגע</h3>
                  <p className="text-gray-500 mb-4">
                    נסה לרענן בעוד מספר דקות, או הזמן חבר להצטרף למשחק!
                  </p>
                  <p className="text-sm text-blue-600 mb-4">
                    💡 טיפ: שחקנים נראים כמחוברים גם כשהם בדף התרגול או במשחקים
                  </p>
                  <Button onClick={refetch} className="bg-blue-500 hover:bg-blue-600 text-white">
                    רענן רשימה
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <Card
                      key={user.profile_id}
                      className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {renderAvatarByType(user.profile.avatar_character as AvatarCharacter, 'md')}
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-bold text-blue-900 text-lg">{user.profile.name}</div>
                            <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              מחובר עכשיו
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleSendInvite(user.profile_id)}
                            disabled={!!sendingInvite}
                            className={`${
                              sendingInvite === user.profile_id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                            } text-white font-bold px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 min-h-[44px]`}
                          >
                            {sendingInvite === user.profile_id ? (
                              <>
                                <LoadingSpinner size="sm" />
                                שולח...
                              </>
                            ) : (
                              <>
                                <Send size={16} />
                                הזמן למשחק
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full bg-white/90 border-2 border-gray-300">
                    <CardContent className="p-8 text-center">
                      <Search size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-bold text-gray-600 mb-2">לא נמצאו שחקנים</h3>
                      <p className="text-gray-500">אין שחקנים בשם "{search}"</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* Game Rules */}
        <Card className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
              <Crown size={24} />
              חוקי המשחק
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-orange-700">
              <div>
                <p className="font-semibold mb-2">🎯 המטרה:</p>
                <p className="text-sm">להיות הראשון שפותר 15 תרגילי מתמטיקה נכון</p>
              </div>
              <div>
                <p className="font-semibold mb-2">🏆 הפרס:</p>
                <p className="text-sm">הזוכה מקבל מטבע משחק חינם!</p>
              </div>
              <div>
                <p className="font-semibold mb-2">📚 סוגי תרגילים:</p>
                <p className="text-sm">חיבור, חיסור, כפל וחילוק מעורבים</p>
              </div>
              <div>
                <p className="font-semibold mb-2">⚡ זמן:</p>
                <p className="text-sm">ללא הגבלת זמן - דיוק חשוב יותר ממהירות</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white/60 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                💡 <strong>חדש!</strong> הזמנות מגיעות בזמן אמת לכל השחקנים, גם אם הם בדף התרגול או במשחקים!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnlineCompetition;