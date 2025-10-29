/*
  # Create redemptions table
  
  1. New Tables
    - redemptions for tracking customer reward redemptions (for 24-hour cooldown)
  
  2. Security
    - Enable RLS
    - Public can insert (for customer redemptions)
    - Shop owners can view and manage
*/

CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert redemptions (for customer self-redemption)
CREATE POLICY "Public can insert redemptions"
  ON redemptions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view redemptions"
  ON redemptions FOR SELECT
  TO anon
  USING (true);

-- Shop owners can view and manage all redemptions for their shop
CREATE POLICY "Shop owners can manage redemptions"
  ON redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = redemptions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_redemptions_customer_id ON redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_shop_id ON redemptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_at ON redemptions(redeemed_at DESC);

