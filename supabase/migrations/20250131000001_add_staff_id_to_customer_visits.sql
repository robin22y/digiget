/*
  # Add staff_id and reward fields to customer_visits
  
  1. Changes
    - Add staff_id column (nullable) to track who checked in customer
    - Add points_earned column (default 1)
    - Add is_reward_redeemed column (default false)
    - Rename check_in_time to visit_date for consistency
*/

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

