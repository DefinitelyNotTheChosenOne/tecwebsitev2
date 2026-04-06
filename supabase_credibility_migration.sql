-- Credibility Intelligence Upgrade

-- Add social/professional links to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS public_email TEXT;

-- Verify RLS is already open for profile updates (from previous migration)
