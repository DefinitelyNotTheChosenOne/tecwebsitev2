-- Portfolio Intelligence Upgrade for Profiles

-- Add specialized tutoring meta-data to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 5.0;

-- Update RLS to allow users to update their own meta-data
CREATE POLICY "Users can update their own portfolios" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- (Wait—Admins already have global access from previous migrations)
