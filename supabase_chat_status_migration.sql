-- UNIFIED CHAT STATUS MIGRATION
-- This script standardizes the 'seen' to 'read' transition and enables dynamic delivery tracking.

-- 1. Establish the Enum Type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
        CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
    END IF;
END $$;

-- 2. Update chat_messages table schema
-- If status already exists as text, we might need a type cast.
-- Usually, we drop and recreate or cast. Here we assume we add it correctly.
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS status message_status DEFAULT 'sent';

-- 3. Synchronize existing read/delivered triggers
-- If read_at is set, status is 'read'
-- Else if delivered_at is set, status is 'delivered'
-- Else status is 'sent'
UPDATE chat_messages 
SET status = 'read' 
WHERE read_at IS NOT NULL;

UPDATE chat_messages 
SET status = 'delivered' 
WHERE delivered_at IS NOT NULL AND read_at IS NULL;

-- 4. Standardization: Map legacy 'seen' status string to 'read' if it exists as a column value
-- (In case 'status' was previously a text column)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'status') THEN
        UPDATE chat_messages SET status = 'read' WHERE status::text = 'seen';
    END IF;
END $$;

-- 5. Repeat for live_class_messages to ensure parity
ALTER TABLE live_class_messages 
ADD COLUMN IF NOT EXISTS status message_status DEFAULT 'sent';

UPDATE live_class_messages 
SET status = 'read' 
WHERE read_at IS NOT NULL;

UPDATE live_class_messages 
SET status = 'delivered' 
WHERE delivered_at IS NOT NULL AND read_at IS NULL;

NOTIFY pgrst, 'reload schema';
