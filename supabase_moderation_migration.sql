-- Moderation Engine Architecture for TutorMatch

CREATE TABLE moderation_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID, -- References the specific message, profile, or request ID
    type TEXT NOT NULL, -- 'Flagged Message', 'Disputed Session', 'User Report'
    context TEXT NOT NULL, -- e.g., 'Automated Scan: Policy Violation #14'
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Target User
    content TEXT NOT NULL, -- Raw transmission data for review
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can only see the queue
CREATE POLICY "Admins can manage moderation"
ON moderation_queue FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Real-time analytics view for the Dashboard (Read-only for counting)
CREATE POLICY "Public cannot read moderation"
ON moderation_queue FOR SELECT
TO public
USING (false);
