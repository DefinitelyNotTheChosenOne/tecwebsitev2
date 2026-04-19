-- Allow users to insert reports into flagged_content
CREATE POLICY "Users can insert reports" ON flagged_content
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);
