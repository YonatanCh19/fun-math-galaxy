
-- Add free_games column to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN free_games integer NOT NULL DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.user_progress.free_games IS 'Number of free games earned from winning online competitions';
