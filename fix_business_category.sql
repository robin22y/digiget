-- =====================================================
-- Fix Missing business_category Column
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add business_category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'business_category'
  ) THEN
    ALTER TABLE shops ADD COLUMN business_category TEXT;
  END IF;
END $$;

-- Also ensure postcode column exists (might be missing too)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'postcode'
  ) THEN
    ALTER TABLE shops ADD COLUMN postcode TEXT;
  END IF;
END $$;

-- Done! This will fix the schema cache error.

