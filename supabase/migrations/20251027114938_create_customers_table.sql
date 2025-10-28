/*
  # Create customers table
  
  1. New Tables
    - customers for loyalty program tracking
  
  2. Security
    - Enable RLS
    - Shop owners can manage customers
    - Public can view customer by phone (for balance checker)
*/

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  phone TEXT NOT NULL,
  name TEXT,
  
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  
  active BOOLEAN DEFAULT true,
  
  first_visit_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customers.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view customer by phone"
  ON customers FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_shop_phone_unique ON customers(shop_id, phone);