-- Run this in your Supabase SQL Editor to support persistent Messenger-style status tracking

-- 1. Support read/delivered timestamps in pre-payment chat
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 2. Support read/delivered timestamps in live class archive
ALTER TABLE live_class_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 3. Sync existing 'seen' statuses if they exist (backfill)
UPDATE chat_messages 
SET read_at = created_at 
WHERE status = 'seen' AND read_at IS NULL;

UPDATE live_class_messages 
SET read_at = created_at 
WHERE status = 'seen' AND read_at IS NULL;

-- 4. Reload PostgREST to ensure columns are visible
NOTIFY pgrst, 'reload schema';
