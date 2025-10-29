-- =====================================================
-- Create Customer Ratings Table
-- Run this in Supabase SQL Editor if the migration hasn't been applied
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  device_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Public can insert ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Public can view ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Shop owners can view ratings" ON customer_ratings;

-- Allow anonymous users to insert ratings (for customer self-rating)
CREATE POLICY "Anonymous can insert ratings"
  ON customer_ratings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert ratings (for shop staff/owners)
CREATE POLICY "Authenticated can insert ratings"
  ON customer_ratings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow public to view ratings (for display purposes)
CREATE POLICY "Public can view ratings"
  ON customer_ratings FOR SELECT
  USING (true);

-- Shop owners can view all ratings for their shop
CREATE POLICY "Shop owners can view ratings"
  ON customer_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_ratings.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_ratings_shop_id ON customer_ratings(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_customer_id ON customer_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_created_at ON customer_ratings(created_at DESC);

