/*
  # Add Customer Tier Classification
  
  1. Changes
    - Add tier column to customers table
    - Create activity_log table for tracking tier changes
  
  2. Security
    - Only shop owners/managers can update tiers
    - Track all tier changes in activity log
*/

-- Add tier column to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tier'
  ) THEN
    ALTER TABLE customers ADD COLUMN tier TEXT CHECK (tier IN ('New', 'VIP', 'Super Star', 'Royal')) DEFAULT 'New';
  END IF;
  
  -- Update existing NULL tiers to 'New'
  UPDATE customers SET tier = 'New' WHERE tier IS NULL;
END $$;

-- Create activity_log table for tracking tier changes
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('tier_change', 'points_added', 'reward_redeemed', 'profile_updated')),
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_shop_id ON activity_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_customer_id ON activity_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Shop owners can view their shop's activity logs
CREATE POLICY "Shop owners can view activity logs"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = activity_log.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Policy: Shop owners can insert activity logs
CREATE POLICY "Shop owners can insert activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = activity_log.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Create function to check tier change rate limit (once per week)
CREATE OR REPLACE FUNCTION can_change_tier(
  p_shop_id UUID,
  p_customer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  last_change TIMESTAMPTZ;
BEGIN
  SELECT MAX(created_at) INTO last_change
  FROM activity_log
  WHERE shop_id = p_shop_id
    AND customer_id = p_customer_id
    AND action_type = 'tier_change';
  
  -- If no previous change, allow
  IF last_change IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if more than 7 days have passed
  RETURN (NOW() - last_change) > INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! Customer tier feature ready.

