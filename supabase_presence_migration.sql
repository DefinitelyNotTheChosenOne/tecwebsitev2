-- Add presence columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'idle', 'offline'));

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_online_status ON profiles(online_status);
