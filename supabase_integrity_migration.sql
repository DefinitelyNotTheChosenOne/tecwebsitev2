-- Migration: Admin & Marketplace Integrity
-- Tables: orders (altered), disputes, flagged_content

-- 1. ENUMS & ALTERATIONS
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');

ALTER TABLE orders 
ADD COLUMN commission_amount NUMERIC,
ADD COLUMN escrow_status escrow_status DEFAULT 'held';

-- 2. DISPUTES TABLE
CREATE TABLE disputes (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  admin_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FLAGGED CONTENT TABLE (Anti-Leakage)
CREATE TABLE flagged_content (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS POLICIES (Admin Only)
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

-- Disputes: Only Admin can view and manage
CREATE POLICY "Admin only select/update disputes" ON disputes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Flagged Content: Only Admin can view and manage
CREATE POLICY "Admin only select/update flagged_content" ON flagged_content
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. ESCROW CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- 20% Commission Calculation
  NEW.commission_amount := NEW.amount * 0.20;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_commission
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_commission();
