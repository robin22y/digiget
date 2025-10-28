/*
  # Create flash_offers table
  
  1. New Tables
    - flash_offers for promotional offers
  
  2. Security
    - Enable RLS
    - Shop owners can manage offers
*/

CREATE TABLE IF NOT EXISTS flash_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  offer_text TEXT NOT NULL,
  offer_type TEXT CHECK (offer_type IN ('percentage', 'fixed_amount', 'free_item')),
  offer_value DECIMAL(10, 2),
  
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE flash_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage offers"
  ON flash_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = flash_offers.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_flash_offers_shop_id ON flash_offers(shop_id);
CREATE INDEX IF NOT EXISTS idx_flash_offers_active ON flash_offers(active) WHERE active = true;