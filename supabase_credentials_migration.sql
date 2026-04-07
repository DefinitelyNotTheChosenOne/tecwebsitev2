-- Migration: Add Specialist Credentials Support
-- 1. Add resume_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- 2. Create Specialist Credentials Storage Bucket
-- (Note: In a real environment, you'd run this in the Supabase Dashboard, 
-- but we manifest the intent here for the system)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('specialist-credentials', 'specialist-credentials', true);

-- 3. Storage Policies (Public read, Private write)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'specialist-credentials');
-- CREATE POLICY "Specialists can upload credentials" ON storage.objects FOR INSERT 
-- WITH CHECK (bucket_id = 'specialist-credentials' AND auth.uid() = owner);
