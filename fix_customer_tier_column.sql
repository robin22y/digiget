-- =====================================================
-- Fix Missing Tier Column in Customers Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add tier column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tier'
  ) THEN
    ALTER TABLE customers ADD COLUMN tier TEXT CHECK (tier IN ('New', 'VIP', 'Super Star', 'Royal')) DEFAULT 'New';
  END IF;
END $$;

-- Update existing NULL tiers to 'New'
UPDATE customers SET tier = 'New' WHERE tier IS NULL;

-- Done! This will fix the schema cache error.

