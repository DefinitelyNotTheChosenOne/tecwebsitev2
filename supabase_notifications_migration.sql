-- Signal Intelligence Infrastructure
-- This table archives and broadcasts all tactical updates across the network

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'MESSAGE', 'ACCEPTED', 'SCHEDULED', 'STARTING'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Security Policies (Users see only their own signals)
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. Enable Real-time broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 4. Notification Triggers (Automated Intelligence)
-- Notify student when a tutor accepts their request
CREATE OR REPLACE FUNCTION notify_tutor_accept()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        INSERT INTO notifications (user_id, type, title, content, link)
        VALUES (
            NEW.student_id,
            'ACCEPTED',
            'Mission Accepted',
            'A specialist has accepted your operational request. Open discussion now.',
            '/sessions'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tutor_accept_trigger
AFTER UPDATE ON tutoring_sessions
FOR EACH ROW EXECUTE FUNCTION notify_tutor_accept();

-- Notify user when they receive a message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    sender_name TEXT;
BEGIN
    -- Find the other person in the room
    SELECT 
        CASE 
            WHEN chat_rooms.student_id = NEW.sender_id THEN chat_rooms.tutor_id
            ELSE chat_rooms.student_id
        END,
        profiles.full_name
    INTO recipient_id, sender_name
    FROM chat_rooms
    JOIN profiles ON profiles.id = NEW.sender_id
    WHERE chat_rooms.id = NEW.room_id;

    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
        recipient_id,
        'MESSAGE',
        'Incoming Signal',
        sender_name || ' sent you a message.',
        CASE 
            WHEN recipient_id IN (SELECT id FROM profiles WHERE role = 'user') THEN '/sessions'
            ELSE '/dashboard/session'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER new_message_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- Notify student when a class is scheduled
CREATE OR REPLACE FUNCTION notify_new_schedule()
RETURNS TRIGGER AS $$
DECLARE
    student_id UUID;
BEGIN
    SELECT chat_rooms.student_id INTO student_id FROM chat_rooms WHERE chat_rooms.id = NEW.room_id;

    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
        student_id,
        'SCHEDULED',
        'Mission Locked',
        'A specialist has scheduled a live session for you. Review the timeline.',
        '/sessions'
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER new_schedule_trigger
AFTER INSERT ON scheduled_classes
FOR EACH ROW EXECUTE FUNCTION notify_new_schedule();
