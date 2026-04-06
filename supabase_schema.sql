-- Migration: Initial Schema for Fiverr Clone (FreelanceHub)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- 2. PROFILES TABLE (Linked to Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SERVICES TABLE
CREATE TABLE services (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CONVERSATIONS TABLE
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  participant_one UUID REFERENCES profiles(id),
  participant_two UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_one, participant_two)
);

-- 5. MESSAGES TABLE
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ORDERS TABLE
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  status order_status DEFAULT 'pending',
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Services: Everyone can view, sellers can manage their own
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Sellers can manage their own services" ON services FOR ALL USING (auth.uid() = seller_id);

-- Messages: Only participants can read and write
CREATE POLICY "Participants can view their conversations" ON messages FOR SELECT
USING (
  auth.uid() IN (
    SELECT participant_one FROM conversations WHERE id = conversation_id
    UNION
    SELECT participant_two FROM conversations WHERE id = conversation_id
  )
);

