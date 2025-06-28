import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function GlobalGameInviteListener() {
  const { selectedProfile } = useAuth();
  const navigate = useNavigate();
  const competitionChannelRef = useRef<any>(null);

  // Listen for new competitions where this profile is player2
  useEffect(() => {
    if (!selectedProfile?.id) return;

    console.log(`🎧 Setting up competition listener for ${selectedProfile.name} (${selectedProfile.id})`);

    const channelName = `competition_listener_${selectedProfile.id}`;
    
    competitionChannelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'online_competitions',
          filter: `player2_id=eq.${selectedProfile.id}`,
        },
        (payload) => {
          console.log('🏆 New competition detected for current player:', payload);
          
          if (payload.new && payload.new.status === 'active') {
            const competition = payload.new;
            
            // Show notification and navigate to game
            toast.success('🎮 משחק חדש התחיל!', {
              description: 'נכנס למשחק עכשיו...',
              duration: 3000,
            });

            setTimeout(() => {
              navigate(`/online-game/${competition.id}`);
            }, 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Competition listener status for ${selectedProfile.name}:`, status);
      });

    return () => {
      console.log(`🎧 Cleaning up competition listener for ${selectedProfile.name}`);
      if (competitionChannelRef.current) {
        supabase.removeChannel(competitionChannelRef.current);
        competitionChannelRef.current = null;
      }
    };
  }, [selectedProfile?.id, selectedProfile?.name, navigate]);

  return null; // This component doesn't render anything
}