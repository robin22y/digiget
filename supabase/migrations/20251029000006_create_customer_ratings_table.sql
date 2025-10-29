/*
  # Create customer_ratings table
  
  1. New Tables
    - customer_ratings for customer feedback and ratings
  
  2. Security
    - Enable RLS
    - Public can insert ratings (for customer self-rating)
    - Shop owners can view all ratings
*/

CREATE TABLE IF NOT EXISTS customer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  device_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_ratings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert ratings (for customer self-rating)
CREATE POLICY "Public can insert ratings"
  ON customer_ratings FOR INSERT
  TO anon
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

CREATE INDEX IF NOT EXISTS idx_customer_ratings_shop_id ON customer_ratings(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_customer_id ON customer_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_created_at ON customer_ratings(created_at DESC);

