-- Add cancellation tracking fields to shops table
-- Only add columns that don't already exist
DO $$
BEGIN
  -- Add subscription_end_date (TIMESTAMPTZ to match other timestamp columns)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE shops ADD COLUMN subscription_end_date TIMESTAMPTZ;
    COMMENT ON COLUMN shops.subscription_end_date IS 'Date when subscription access ends (for cancelled subscriptions, 30 days from cancellation)';
  END IF;

  -- Add cancellation_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE shops ADD COLUMN cancellation_reason VARCHAR(100);
    COMMENT ON COLUMN shops.cancellation_reason IS 'Reason selected by owner when cancelling (too_expensive, not_using, etc.)';
  END IF;

  -- Add cancellation_feedback
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'cancellation_feedback'
  ) THEN
    ALTER TABLE shops ADD COLUMN cancellation_feedback TEXT;
    COMMENT ON COLUMN shops.cancellation_feedback IS 'Optional free-text feedback provided by owner when cancelling';
  END IF;

  -- Note: subscription_status and cancelled_at already exist in the shops table
  -- from the initial schema, so we don't need to add them here
END $$;

