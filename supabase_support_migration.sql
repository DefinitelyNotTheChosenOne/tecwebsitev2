-- SUPABASE MIGRATION: ADMIN SUPPORT SYSTEM
-- This script enables cinematic Admin-to-User communication and security.

-- 1. Support Message Infrastructure
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id), -- The non-admin user
    admin_id UUID REFERENCES public.profiles(id), -- Your admin ID
    content TEXT NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Advanced Security Protocol (RLS)
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- 3. COMMAND PRIVILEGE: Admins have unrestricted access to supports
CREATE POLICY "Admins can manage all support messages"
ON public.admin_messages
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- 4. USER PRIVILEGE: Secure tunnel for individuals to talk to High Command
CREATE POLICY "Users can see their own support messages"
ON public.admin_messages
FOR SELECT
USING (auth.uid() = user_id);
