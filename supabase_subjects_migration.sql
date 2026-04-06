-- Subject Taxonomy Schema for TutorMatch

CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read available subjects
CREATE POLICY "Public can read categories"
ON categories FOR SELECT
TO public
USING (true);

-- Only admins can insert/update/delete (You will enforce this via application logic or extended admin policies)
CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Seed with initial top configurations just in case
INSERT INTO categories (name, slug) VALUES 
('Advanced Calculus', 'advanced-calculus'),
('Computer Science', 'computer-science'),
('Pre-Med & Nursing', 'pre-med-nursing'),
('Constitutional Law', 'constitutional-law'),
('Organic Chemistry', 'organic-chemistry'),
('Physics & Engineering', 'physics-engineering')
ON CONFLICT DO NOTHING;
