
-- Create table for online competitions
CREATE TABLE public.online_competitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id uuid NOT NULL,
  player2_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  player1_score integer NOT NULL DEFAULT 0,
  player2_score integer NOT NULL DEFAULT 0,
  winner_id uuid NULL,
  started_at timestamp with time zone NULL,
  ended_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for competition invitations
CREATE TABLE public.competition_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile_id uuid NOT NULL,
  to_profile_id uuid NOT NULL,
  competition_id uuid NOT NULL REFERENCES public.online_competitions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for user presence (online status)
CREATE TABLE public.user_presence (
  profile_id uuid NOT NULL PRIMARY KEY,
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.online_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for online_competitions
CREATE POLICY "Users can view competitions they participate in" 
  ON public.online_competitions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE (profiles.id = player1_id OR profiles.id = player2_id) 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create competitions" 
  ON public.online_competitions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = player1_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their competitions" 
  ON public.online_competitions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE (profiles.id = player1_id OR profiles.id = player2_id) 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for competition_invitations
CREATE POLICY "Users can view invitations sent to or from them" 
  ON public.competition_invitations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE (profiles.id = from_profile_id OR profiles.id = to_profile_id) 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations" 
  ON public.competition_invitations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = from_profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations they received" 
  ON public.competition_invitations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = to_profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for user_presence
CREATE POLICY "Users can view all presence data" 
  ON public.user_presence 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own presence" 
  ON public.user_presence 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Enable realtime for the tables
ALTER TABLE public.online_competitions REPLICA IDENTITY FULL;
ALTER TABLE public.competition_invitations REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
