import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Gamepad2, Crown, Trophy } from 'lucide-react';

interface GameInvite {
  id: string;
  from_profile_id: string;
  from_name: string;
  competition_id: string;
  timestamp: number;
}

export default function GlobalGameInviteListener() {
  const { selectedProfile } = useAuth();
  const navigate = useNavigate();
  const [incomingInvite, setIncomingInvite] = React.useState<GameInvite | null>(null);
  const inviteChannelRef = useRef<any>(null);
  const competitionChannelRef = useRef<any>(null);

  // Listen for incoming invites globally
  useEffect(() => {
    if (!selectedProfile?.id) return;

    console.log(`🎧 Setting up global invite listener for ${selectedProfile.name} (${selectedProfile.id})`);

    // Create a wildcard channel that listens to all invite channels for this profile
    const channelName = `global_invites_${selectedProfile.id}`;
    
    inviteChannelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'game_invite' }, (payload) => {
        console.log('🎮 Received game invite broadcast:', payload);
        
        // Check if this invite is for the current profile
        if (payload.payload && payload.payload.from_profile_id !== selectedProfile.id) {
          const invite: GameInvite = {
            id: payload.payload.invite_id || payload.payload.competition_id,
            from_profile_id: payload.payload.from_profile_id,
            from_name: payload.payload.from_name,
            competition_id: payload.payload.competition_id,
            timestamp: payload.payload.timestamp || Date.now(),
          };

          console.log('📨 Processing invite for current profile:', invite);

          // Show toast notification
          toast.info(`🎮 הזמנה למשחק מ${invite.from_name}!`, {
            description: 'לחץ כאן כדי לראות את ההזמנה',
            duration: 8000,
            action: {
              label: 'פתח',
              onClick: () => setIncomingInvite(invite),
            },
          });

          // Also set the invite state to show the dialog
          setIncomingInvite(invite);
        }
      })
      .subscribe((status) => {
        console.log(`📡 Global invite channel status for ${selectedProfile.name}:`, status);
      });

    // Also listen to a specific channel for this profile
    const specificChannelName = `invite_${selectedProfile.id}`;
    const specificChannel = supabase
      .channel(specificChannelName)
      .on('broadcast', { event: 'game_invite' }, (payload) => {
        console.log('🎯 Received specific game invite:', payload);
        
        if (payload.payload) {
          const invite: GameInvite = {
            id: payload.payload.invite_id || payload.payload.competition_id,
            from_profile_id: payload.payload.from_profile_id,
            from_name: payload.payload.from_name,
            competition_id: payload.payload.competition_id,
            timestamp: payload.payload.timestamp || Date.now(),
          };

          console.log('📨 Processing specific invite:', invite);

          // Show toast notification
          toast.info(`🎮 הזמנה למשחק מ${invite.from_name}!`, {
            description: 'לחץ כאן כדי לראות את ההזמנה',
            duration: 8000,
            action: {
              label: 'פתח',
              onClick: () => setIncomingInvite(invite),
            },
          });

          // Set the invite state to show the dialog
          setIncomingInvite(invite);
        }
      })
      .subscribe();

    return () => {
      console.log(`🎧 Cleaning up global invite listener for ${selectedProfile.name}`);
      if (inviteChannelRef.current) {
        supabase.removeChannel(inviteChannelRef.current);
        inviteChannelRef.current = null;
      }
      if (specificChannel) {
        supabase.removeChannel(specificChannel);
      }
    };
  }, [selectedProfile?.id, selectedProfile?.name]);

  // Listen for competition status changes (for the sender)
  useEffect(() => {
    if (!selectedProfile?.id) return;

    const channelName = `competition_status_${selectedProfile.id}`;
    competitionChannelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'online_competitions',
          filter: `player1_id=eq.${selectedProfile.id}`,
        },
        (payload) => {
          console.log('🏆 Competition status changed:', payload);
          const newData = payload.new;
          
          // If competition became active, navigate to game
          if (newData.status === 'active' && newData.started_at) {
            toast.success('ההזמנה התקבלה! מתחיל משחק...', {
              duration: 3000,
            });
            setTimeout(() => {
              navigate(`/online-game/${newData.id}`);
            }, 1000);
          }
          
          // If competition was cancelled, show notification
          if (newData.status === 'cancelled') {
            toast.info('ההזמנה נדחתה על ידי השחקן השני', {
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (competitionChannelRef.current) {
        supabase.removeChannel(competitionChannelRef.current);
        competitionChannelRef.current = null;
      }
    };
  }, [selectedProfile?.id, navigate]);

  const handleInviteResponse = async (accepted: boolean) => {
    if (!incomingInvite || !selectedProfile) return;

    try {
      console.log(`🎯 Responding to invite: ${accepted ? 'ACCEPTED' : 'DECLINED'}`);

      // Update invitation status
      const { error: updateError } = await supabase
        .from('competition_invitations')
        .update({ status: accepted ? 'accepted' : 'declined' })
        .eq('competition_id', incomingInvite.competition_id);

      if (updateError) {
        throw updateError;
      }

      if (accepted) {
        // Update competition status to active
        const { error: competitionError } = await supabase
          .from('online_competitions')
          .update({ 
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('id', incomingInvite.competition_id);

        if (competitionError) {
          throw competitionError;
        }

        toast.success('הזמנה התקבלה! מתחיל משחק...', {
          duration: 3000,
        });
        
        // Navigate to game
        setTimeout(() => {
          navigate(`/online-game/${incomingInvite.competition_id}`);
        }, 1000);
      } else {
        // Update competition status to cancelled
        await supabase
          .from('online_competitions')
          .update({ status: 'cancelled' })
          .eq('id', incomingInvite.competition_id);

        toast.info('הזמנה נדחתה');
      }
    } catch (error: any) {
      console.error('❌ Error responding to invite:', error);
      toast.error('שגיאה בתגובה להזמנה: ' + error.message);
    } finally {
      setIncomingInvite(null);
    }
  };

  return (
    <Dialog open={!!incomingInvite} onOpenChange={() => setIncomingInvite(null)}>
      <DialogContent className="bg-gradient-to-r from-blue-100 to-purple-100 border-4 border-blue-400 rounded-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-blue-900 flex items-center gap-2">
            <Gamepad2 size={28} className="text-blue-600" />
            <Trophy size={28} className="text-yellow-500" />
            הזמנה למשחק תחרותי!
          </DialogTitle>
          <DialogDescription className="text-blue-800 text-lg">
            <strong>{incomingInvite?.from_name}</strong> מזמין אותך למשחק תחרותי מרגש!
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 text-center">
          <div className="text-6xl mb-4">🎮🏆</div>
          <div className="bg-white/80 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-blue-900 mb-2">חוקי המשחק:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>🎯 המטרה: להיות הראשון שפותר 15 תרגילים נכון</p>
              <p>🏆 הזוכה מקבל משחק חינם!</p>
              <p>📚 תרגילי מתמטיקה מעורבים</p>
            </div>
          </div>
          <p className="text-blue-700 font-medium">
            מוכן להתחרות ולהוכיח שאתה אלוף המתמטיקה?
          </p>
        </div>

        <DialogFooter className="gap-3">
          <Button
            onClick={() => handleInviteResponse(false)}
            variant="outline"
            className="flex-1 border-2 border-red-300 text-red-700 hover:bg-red-50 min-h-[44px]"
          >
            לא הפעם
          </Button>
          <Button
            onClick={() => handleInviteResponse(true)}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold min-h-[44px]"
          >
            <Crown size={20} className="ml-2" />
            בואו נתחרה!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}