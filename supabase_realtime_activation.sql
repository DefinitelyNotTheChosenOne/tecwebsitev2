-- Enable Realtime for the chat system
-- This allows the database to 'broadcast' new messages to all connected listeners

-- 1. Check if the publication exists (usually does in Supabase)
-- 2. Add our tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_classes;
