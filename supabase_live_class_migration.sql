-- Live Class High-Persistence Archive
-- This table stores all interaction data during active academic sessions

CREATE TABLE live_class_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Enable RLS
ALTER TABLE live_class_messages ENABLE ROW LEVEL SECURITY;

-- 2. Security Policies (Student/Tutor access only)
CREATE POLICY "Users can view live messages in their rooms"
    ON live_class_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = live_class_messages.room_id
            AND (chat_rooms.student_id = auth.uid() OR chat_rooms.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert live messages into their rooms"
    ON live_class_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = live_class_messages.room_id
            AND (chat_rooms.student_id = auth.uid() OR chat_rooms.tutor_id = auth.uid())
        )
        AND auth.uid() = sender_id
    );

-- 3. Enable Real-time broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE live_class_messages;
