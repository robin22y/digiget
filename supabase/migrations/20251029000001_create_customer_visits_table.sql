/*
  # Create customer_visits table
  
  1. New Tables
    - customer_visits for tracking customer check-ins with geolocation
  
  2. Security
    - Enable RLS
    - Public can insert (for customer check-ins)
    - Shop owners can view and manage
*/

CREATE TABLE IF NOT EXISTS customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  location_name TEXT,
  device_type TEXT,
  distance_from_shop DECIMAL(10, 2), -- in meters
  
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT CHECK (status IN ('approved', 'pending')) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

-- Allow public to insert visits (for customer check-ins)
CREATE POLICY "Public can insert visits"
  ON customer_visits FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view own visits"
  ON customer_visits FOR SELECT
  USING (true);

-- Shop owners can view and manage all visits for their shop
CREATE POLICY "Shop owners can manage visits"
  ON customer_visits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_visits.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_customer_visits_customer_id ON customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_shop_id ON customer_visits(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_check_in_time ON customer_visits(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_customer_visits_status ON customer_visits(status);

