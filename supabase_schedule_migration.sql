-- Schedule persistence for TutorMatch
-- This table stores scheduled class times set by tutors

CREATE TABLE scheduled_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY;

-- Students can read their own scheduled classes
CREATE POLICY "Students can view own scheduled classes"
    ON scheduled_classes FOR SELECT
    USING (auth.uid() = student_id);

-- Tutors can read and manage their own scheduled classes
CREATE POLICY "Tutors can view own scheduled classes"
    ON scheduled_classes FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create scheduled classes"
    ON scheduled_classes FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update own scheduled classes"
    ON scheduled_classes FOR UPDATE
    USING (auth.uid() = tutor_id);
