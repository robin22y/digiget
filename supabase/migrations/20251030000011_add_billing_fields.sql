-- Billing / Grace Period Fields for shops
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='payment_status'
  ) THEN
    ALTER TABLE shops ADD COLUMN payment_status TEXT; -- ok | failed | grace | past_due | cancelled
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='grace_until'
  ) THEN
    ALTER TABLE shops ADD COLUMN grace_until TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='last_payment_failed_at'
  ) THEN
    ALTER TABLE shops ADD COLUMN last_payment_failed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='original_plan_type'
  ) THEN
    ALTER TABLE shops ADD COLUMN original_plan_type TEXT; -- remember previous plan for reinstatement
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='last_reminder_at'
  ) THEN
    ALTER TABLE shops ADD COLUMN last_reminder_at TIMESTAMPTZ;
  END IF;
END $$;
