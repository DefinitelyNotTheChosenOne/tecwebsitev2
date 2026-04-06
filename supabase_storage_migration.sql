-- Identity Storage Protocol (Avatars)

-- 1. Create the 'avatars' storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- 2. Authorization: Allow tutors to upload their own headshots
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Authorization: Allow tutors to update their own headshots
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Visibility: Allow anyone to view public dossiers
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');
