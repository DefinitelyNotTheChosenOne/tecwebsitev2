-- Create System Subjects Table
CREATE TABLE IF NOT EXISTS system_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

ALTER TABLE system_subjects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read subjects
CREATE POLICY "Public read generic subjects" ON system_subjects 
FOR SELECT USING (true);

-- Allow Admins to manage subjects
CREATE POLICY "Admin manage subjects" ON system_subjects 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- RPC to easily get ONLY subjects that have at least one active tutor/seller
CREATE OR REPLACE FUNCTION get_active_subjects()
RETURNS TABLE(id UUID, name TEXT, slug TEXT, description TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT s.id, s.name, s.slug, s.description 
  FROM system_subjects s
  WHERE EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.role = 'seller' AND s.name = ANY(p.skills)
  );
$$;
