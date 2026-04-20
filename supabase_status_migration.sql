-- Run this in your Supabase SQL Editor to add Messenger-style status columns

-- 1. Add the column to the pre-payment chat tunnel
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' 
CHECK (status IN ('sending', 'sent', 'delivered', 'seen'));

-- 2. Add the column to the live class chat system
ALTER TABLE live_class_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' 
CHECK (status IN ('sending', 'sent', 'delivered', 'seen'));

-- 3. Optional: Backfill old messages so they don't break the UI
UPDATE chat_messages 
SET status = 'seen' 
WHERE status IS NULL;

UPDATE live_class_messages 
SET status = 'seen' 
WHERE status IS NULL;
