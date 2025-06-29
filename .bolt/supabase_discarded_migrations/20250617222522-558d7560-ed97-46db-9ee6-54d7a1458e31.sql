
-- Add avatar_character column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_character TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.profiles.avatar_character IS 'Avatar character identifier (cat, dog, unicorn, etc.)';
