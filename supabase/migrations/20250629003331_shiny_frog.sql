/*
  # Chat System Database Setup

  1. Tables
    - `chat_conversations` - stores conversation metadata between two profiles
    - `chat_messages` - stores individual messages within conversations
  
  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own conversations and messages
    - Users can only see conversations they participate in
    - Users can only send messages from their own profiles
  
  3. Performance
    - Add indexes for conversation lookups and message ordering
    - Enable realtime subscriptions for live chat
  
  4. Cleanup
    - Function to automatically delete messages older than 24 hours
*/

-- Create chat_conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile1_id uuid NOT NULL,
  profile2_id uuid NOT NULL,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile1_id, profile2_id)
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  from_profile_id uuid NOT NULL,
  to_profile_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone NULL
);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
  -- Drop chat_conversations policies
  DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.chat_conversations;
  DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
  DROP POLICY IF EXISTS "Users can update their conversations" ON public.chat_conversations;
  
  -- Drop chat_messages policies
  DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
  DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
  DROP POLICY IF EXISTS "Users can update messages they received" ON public.chat_messages;
END $$;

-- Create RLS Policies for chat_conversations
CREATE POLICY "Users can view conversations they participate in" 
  ON public.chat_conversations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE (profiles.id = profile1_id OR profiles.id = profile2_id) 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" 
  ON public.chat_conversations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = profile1_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their conversations" 
  ON public.chat_conversations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE (profiles.id = profile1_id OR profiles.id = profile2_id) 
      AND profiles.user_id = auth.uid()
    )
  );

-- Create RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE (profiles.id = from_profile_id OR profiles.id = to_profile_id) 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = from_profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages they received" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = to_profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Create or replace function to clean up old messages (24+ hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_messages 
  WHERE created_at < now() - interval '24 hours';
END;
$$;

-- Enable realtime for the tables (safe to run multiple times)
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication safely
DO $$
BEGIN
  -- Add chat_conversations to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  EXCEPTION 
    WHEN duplicate_object THEN 
      NULL; -- Table already in publication, ignore error
  END;

  -- Add chat_messages to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION 
    WHEN duplicate_object THEN 
      NULL; -- Table already in publication, ignore error
  END;
END $$;

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_profiles ON public.chat_conversations(profile1_id, profile2_id);