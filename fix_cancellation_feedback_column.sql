-- =====================================================
-- Fix Missing cancellation_feedback Column
-- Run this in Supabase SQL Editor to fix the immediate error
-- =====================================================

-- Add cancellation_feedback column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'cancellation_feedback'
  ) THEN
    ALTER TABLE shops ADD COLUMN cancellation_feedback TEXT;
    COMMENT ON COLUMN shops.cancellation_feedback IS 'Optional free-text feedback provided by owner when cancelling';
  END IF;
END $$;

-- Also add cancellation_reason if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE shops ADD COLUMN cancellation_reason VARCHAR(100);
    COMMENT ON COLUMN shops.cancellation_reason IS 'Reason selected by owner when cancelling (too_expensive, not_using, etc.)';
  END IF;
END $$;

-- Also add subscription_end_date if missing (TIMESTAMPTZ to match other timestamps)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE shops ADD COLUMN subscription_end_date TIMESTAMPTZ;
    COMMENT ON COLUMN shops.subscription_end_date IS 'Date when subscription access ends (for cancelled subscriptions, 30 days from cancellation)';
  END IF;
END $$;

-- Done! This will fix the schema cache error.
-- After running this, Supabase should automatically refresh its schema cache.
-- If the error persists, wait a few seconds for the cache to update.

