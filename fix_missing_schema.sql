-- =====================================================
-- Fix Missing Schema - Add missing columns and tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add missing columns to employees table
DO $$
BEGIN
  -- Add last_pin_change_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'last_pin_change_at'
  ) THEN
    ALTER TABLE employees ADD COLUMN last_pin_change_at TIMESTAMPTZ;
  END IF;

  -- Add pin_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'pin_expires_at'
  ) THEN
    ALTER TABLE employees ADD COLUMN pin_expires_at TIMESTAMPTZ;
  END IF;

  -- Add pin_change_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'pin_change_required'
  ) THEN
    ALTER TABLE employees ADD COLUMN pin_change_required BOOLEAN DEFAULT false;
  END IF;

  -- Set initial values for existing employees
  UPDATE employees
  SET 
    last_pin_change_at = created_at,
    pin_expires_at = created_at + interval '30 days',
    pin_change_required = false
  WHERE last_pin_change_at IS NULL;
END $$;

-- 2. Create loyalty_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  transaction_type TEXT CHECK (transaction_type IN ('point_added', 'reward_redeemed', 'points_adjusted', 'point_redeemed')),
  points_change INTEGER NOT NULL,
  
  added_by_employee_id UUID REFERENCES employees(id),
  
  balance_after INTEGER NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on loyalty_transactions if not already enabled
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Shop owners can view transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Shop owners can insert transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Public can view transactions" ON loyalty_transactions;

-- Create RLS policies for loyalty_transactions
CREATE POLICY "Shop owners can view transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = loyalty_transactions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can insert transactions"
  ON loyalty_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = loyalty_transactions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Allow public read for tablet interface and customer balance pages
CREATE POLICY "Public can view transactions"
  ON loyalty_transactions FOR SELECT
  USING (true);

-- Create indexes for loyalty_transactions
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_shop_id ON loyalty_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_customer_id ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_employee_id ON loyalty_transactions(added_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_created ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_shop_created ON loyalty_transactions(shop_id, created_at DESC);

-- Done! Refresh your schema cache and try again.

