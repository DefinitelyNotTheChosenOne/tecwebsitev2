-- Repair Migration: Granting UPDATE permissions for Presence-Aware Message Status
-- This fix unlocks the ability for recipients to mark messages as 'read' or 'delivered' persistently.

-- 1. chat_messages update policy
-- Allows participants to update status and timestamps on messages they DID NOT send.
CREATE POLICY "Users can update read status of incoming messages"
    ON chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (chat_rooms.student_id = auth.uid() OR chat_rooms.tutor_id = auth.uid())
        )
    )
    WITH CHECK (
        auth.uid() != sender_id 
    );

-- 2. live_class_messages update policy
-- Parity fix for the classroom terminal.
CREATE POLICY "Users can update status of live messages"
    ON live_class_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = live_class_messages.room_id
            AND (chat_rooms.student_id = auth.uid() OR chat_rooms.tutor_id = auth.uid())
        )
    )
    WITH CHECK (
        auth.uid() != sender_id
    );

-- 3. Verify RLS is enabled (Safety check)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_messages ENABLE ROW LEVEL SECURITY;
