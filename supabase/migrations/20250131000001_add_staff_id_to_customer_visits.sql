/*
  # Add staff_id and reward fields to customer_visits
  
  1. Changes
    - Create customer_visits table if it doesn't exist
    - Add staff_id column (nullable) to track who checked in customer
    - Add points_earned column (default 1)
    - Add is_reward_redeemed column (default false)
    - Add visit_date column for consistency
*/

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  location_name TEXT,
  device_type TEXT,
  distance_from_shop DECIMAL(10, 2),
  
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT CHECK (status IN ('approved', 'pending')) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist (will fail if they exist, which is fine)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_visits' AND policyname = 'Public can insert visits'
  ) THEN
    CREATE POLICY "Public can insert visits"
      ON customer_visits FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_visits' AND policyname = 'Public can view own visits'
  ) THEN
    CREATE POLICY "Public can view own visits"
      ON customer_visits FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_visits' AND policyname = 'Shop owners can manage visits'
  ) THEN
    CREATE POLICY "Shop owners can manage visits"
      ON customer_visits FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM shops
          WHERE shops.id = customer_visits.shop_id
          AND shops.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer_id ON customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_shop_id ON customer_visits(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_check_in_time ON customer_visits(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_customer_visits_status ON customer_visits(status);

-- Now add the new columns
DO $$
BEGIN
  -- Add staff_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_visits' AND column_name = 'staff_id'
  ) THEN
    ALTER TABLE customer_visits ADD COLUMN staff_id UUID REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  -- Add points_earned if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_visits' AND column_name = 'points_earned'
  ) THEN
    ALTER TABLE customer_visits ADD COLUMN points_earned INTEGER DEFAULT 1;
  END IF;

  -- Add is_reward_redeemed if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_visits' AND column_name = 'is_reward_redeemed'
  ) THEN
    ALTER TABLE customer_visits ADD COLUMN is_reward_redeemed BOOLEAN DEFAULT false;
  END IF;

  -- Add visit_date if it doesn't exist (keep check_in_time for backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_visits' AND column_name = 'visit_date'
  ) THEN
    ALTER TABLE customer_visits ADD COLUMN visit_date TIMESTAMPTZ;
    -- Copy check_in_time to visit_date for existing records
    UPDATE customer_visits SET visit_date = check_in_time WHERE visit_date IS NULL;
    -- Set visit_date default to now
    ALTER TABLE customer_visits ALTER COLUMN visit_date SET DEFAULT NOW();
    ALTER TABLE customer_visits ALTER COLUMN visit_date SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_visits_staff_id ON customer_visits(staff_id);

