-- Policy Migration for real-time communication
-- This unlocks the chat_messages table for specialized handshakes

-- 1. Allow authenticated users to view messages in rooms they belong to
CREATE POLICY "Users can view messages in their rooms"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (chat_rooms.student_id = auth.uid() OR chat_rooms.tutor_id = auth.uid())
        )
    );

-- 2. Allow authenticated users to send messages to rooms they belong to
CREATE POLICY "Users can insert messages into their rooms"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (chat_rooms.student_id = auth.uid() OR chat_rooms.tutor_id = auth.uid())
        )
        AND auth.uid() = sender_id
    );

-- 3. Also ensure chat_rooms are readable
CREATE POLICY "Users can view their own chat rooms"
    ON chat_rooms FOR SELECT
    USING (auth.uid() = student_id OR auth.uid() = tutor_id);
