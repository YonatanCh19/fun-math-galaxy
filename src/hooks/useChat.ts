import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type ChatMessage = {
  id: string;
  conversation_id: string;
  from_profile_id: string;
  to_profile_id: string;
  message: string;
  created_at: string;
  read_at?: string;
  from_profile?: {
    name: string;
    avatar_character?: string;
  };
};

export type ChatConversation = {
  id: string;
  profile1_id: string;
  profile2_id: string;
  last_message_at: string;
  created_at: string;
  other_profile?: Profile;
  unread_count?: number;
  last_message?: string;
};

export function useChat(currentProfile: Profile | null) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const conversationsChannelRef = useRef<any>(null);
  const messagesChannelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (conversationsChannelRef.current) {
      try {
        supabase.removeChannel(conversationsChannelRef.current);
      } catch (error) {
        console.error('Error removing conversations channel:', error);
      }
      conversationsChannelRef.current = null;
    }
    
    if (messagesChannelRef.current) {
      try {
        supabase.removeChannel(messagesChannelRef.current);
      } catch (error) {
        console.error('Error removing messages channel:', error);
      }
      messagesChannelRef.current = null;
    }
    
    isSubscribedRef.current = false;
  }, []);

  // Fetch conversations for current profile
  const fetchConversations = useCallback(async () => {
    if (!currentProfile?.id) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      
      // Get conversations where current profile participates
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`profile1_id.eq.${currentProfile.id},profile2_id.eq.${currentProfile.id}`)
        .order('last_message_at', { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setUnreadCount(0);
        return;
      }

      // Get other profiles info
      const otherProfileIds = conversationsData.map(conv => 
        conv.profile1_id === currentProfile.id ? conv.profile2_id : conv.profile1_id
      );

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_character')
        .in('id', otherProfileIds);

      if (profilesError) {
        throw profilesError;
      }

      // Get unread message counts and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        conversationsData.map(async (conv) => {
          const otherProfileId = conv.profile1_id === currentProfile.id ? conv.profile2_id : conv.profile1_id;
          const otherProfile = profilesData?.find(p => p.id === otherProfileId);

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('to_profile_id', currentProfile.id)
            .is('read_at', null);

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('chat_messages')
            .select('message')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            other_profile: otherProfile,
            unread_count: unreadCount || 0,
            last_message: lastMessageData?.message || '',
          };
        })
      );

      setConversations(conversationsWithDetails);
      
      // Calculate total unread count
      const totalUnread = conversationsWithDetails.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(totalUnread);

    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      // Don't show toast error for every fetch
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!currentProfile?.id) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          from_profile:profiles!chat_messages_from_profile_id_fkey(name, avatar_character)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(messagesData || []);
      setActiveConversation(conversationId);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('to_profile_id', currentProfile.id)
        .is('read_at', null);

      // Refresh conversations to update unread counts
      fetchConversations();

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('שגיאה בטעינת ההודעות');
    }
  }, [currentProfile?.id, fetchConversations]);

  // Send a message
  const sendMessage = useCallback(async (toProfileId: string, message: string) => {
    if (!currentProfile?.id || !message.trim()) return false;

    try {
      // Find or create conversation
      let conversationId: string;
      
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id')
        .or(`and(profile1_id.eq.${currentProfile.id},profile2_id.eq.${toProfileId}),and(profile1_id.eq.${toProfileId},profile2_id.eq.${currentProfile.id})`)
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            profile1_id: currentProfile.id,
            profile2_id: toProfileId,
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // Send message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          from_profile_id: currentProfile.id,
          to_profile_id: toProfileId,
          message: message.trim(),
        });

      if (messageError) throw messageError;

      // Update conversation last_message_at
      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('שגיאה בשליחת ההודעה');
      return false;
    }
  }, [currentProfile?.id]);

  // Start a new conversation
  const startConversation = useCallback(async (otherProfileId: string) => {
    if (!currentProfile?.id) return null;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id')
        .or(`and(profile1_id.eq.${currentProfile.id},profile2_id.eq.${otherProfileId}),and(profile1_id.eq.${otherProfileId},profile2_id.eq.${currentProfile.id})`)
        .single();

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('chat_conversations')
        .insert({
          profile1_id: currentProfile.id,
          profile2_id: otherProfileId,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Refresh conversations
      fetchConversations();
      
      return newConv.id;

    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error('שגיאה ביצירת שיחה');
      return null;
    }
  }, [currentProfile?.id, fetchConversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentProfile?.id || isSubscribedRef.current) return;

    // Cleanup any existing subscriptions first
    cleanup();

    try {
      // Subscribe to conversations changes
      conversationsChannelRef.current = supabase
        .channel(`chat_conversations_${currentProfile.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_conversations',
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Conversations channel subscribed successfully');
          }
        });

      // Subscribe to messages changes
      messagesChannelRef.current = supabase
        .channel(`chat_messages_${currentProfile.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            
            // If message is for current conversation, add it to messages
            if (newMessage.conversation_id === activeConversation) {
              setMessages(prev => [...prev, newMessage]);
            }
            
            // If message is to current profile, show notification and update unread count
            if (newMessage.to_profile_id === currentProfile.id) {
              setUnreadCount(prev => prev + 1);
              
              // Show toast notification if not in active conversation
              if (newMessage.conversation_id !== activeConversation) {
                toast.info('הודעה חדשה התקבלה!', {
                  description: 'יש לך הודעה חדשה בצ\'אט',
                  duration: 3000,
                });
              }
            }
            
            // Refresh conversations to update last message and unread counts
            fetchConversations();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Messages channel subscribed successfully');
          }
        });

      isSubscribedRef.current = true;

      // Initial fetch
      fetchConversations();

    } catch (error) {
      console.error('Error setting up chat subscriptions:', error);
    }

    return cleanup;
  }, [currentProfile?.id, activeConversation, fetchConversations, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    unreadCount,
    fetchMessages,
    sendMessage,
    startConversation,
    setActiveConversation,
  };
}