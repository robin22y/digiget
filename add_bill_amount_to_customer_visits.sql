-- Add bill_amount and commission_earned columns to customer_visits table
-- Run this in Supabase SQL Editor

-- Check if table exists first
DO $$ 
BEGIN
  -- Add bill_amount column if it doesn't exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_visits') THEN
    ALTER TABLE customer_visits 
    ADD COLUMN IF NOT EXISTS bill_amount DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS checked_in_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

    COMMENT ON COLUMN customer_visits.bill_amount IS 'Total bill amount for this visit';
    COMMENT ON COLUMN customer_visits.commission_earned IS 'Commission earned by staff for this visit';
    COMMENT ON COLUMN customer_visits.checked_in_by_employee_id IS 'Employee who checked in the customer';
    
    RAISE NOTICE 'Columns added to customer_visits table';
  ELSE
    RAISE NOTICE 'customer_visits table does not exist';
  END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customer_visits'
AND column_name IN ('bill_amount', 'commission_earned', 'checked_in_by_employee_id')
ORDER BY column_name;

