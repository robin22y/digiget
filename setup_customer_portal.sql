-- =====================================================
-- Customer Portal & QR Code System Database Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create customer_visits table (track individual check-ins)
CREATE TABLE IF NOT EXISTS customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  -- For customers not yet registered, store phone temporarily
  customer_phone TEXT,
  
  visit_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  points_awarded INTEGER DEFAULT 1,
  
  -- Optional: store check-in source (QR, staff, etc)
  check_in_method TEXT DEFAULT 'qr' CHECK (check_in_method IN ('qr', 'staff', 'app')),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can view customer visits" ON customer_visits;
DROP POLICY IF EXISTS "Public can create customer visits" ON customer_visits;

CREATE POLICY "Shop owners can view customer visits"
  ON customer_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_visits.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Allow anonymous users to create visits (for QR check-ins)
CREATE POLICY "Public can create customer visits"
  ON customer_visits FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_customer_visits_shop_id ON customer_visits(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer_id ON customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_visit_time ON customer_visits(visit_time DESC);
CREATE INDEX IF NOT EXISTS idx_customer_visits_shop_time ON customer_visits(shop_id, visit_time DESC);

-- 2. Create shop_ratings table (5-star ratings with feedback)
CREATE TABLE IF NOT EXISTS shop_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_phone TEXT,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Optional: mark as visible to shop owner (default true, can be hidden)
  visible_to_shop BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE shop_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can view ratings" ON shop_ratings;
DROP POLICY IF EXISTS "Public can create ratings" ON shop_ratings;

CREATE POLICY "Shop owners can view ratings"
  ON shop_ratings FOR SELECT
  USING (
    visible_to_shop = true
    AND EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_ratings.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Allow anonymous users to submit ratings
CREATE POLICY "Public can create ratings"
  ON shop_ratings FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shop_ratings_shop_id ON shop_ratings(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_ratings_customer_id ON shop_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_shop_ratings_created_at ON shop_ratings(created_at DESC);

-- 3. Add columns to shops table if they don't exist (for customer portal)
-- Address fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'address') THEN
    ALTER TABLE shops ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'image_url') THEN
    ALTER TABLE shops ADD COLUMN image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'qr_code_active') THEN
    ALTER TABLE shops ADD COLUMN qr_code_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 4. Update flash_offers RLS to allow public read for active offers
DROP POLICY IF EXISTS "Public can view active flash offers" ON flash_offers;

CREATE POLICY "Public can view active flash offers"
  ON flash_offers FOR SELECT
  USING (
    active = true
    AND (ends_at IS NULL OR ends_at > NOW())
    AND starts_at <= NOW()
  );

-- 5. Update shops RLS to allow public read for active shops
DROP POLICY IF EXISTS "Public can view active shops" ON shops;

CREATE POLICY "Public can view active shops"
  ON shops FOR SELECT
  USING (
    subscription_status IN ('active', 'trial')
    AND qr_code_active = true
  );

-- Done! Customer Portal database setup complete.

