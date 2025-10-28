/*
  # Add PIN Expiry and Auto-generation Tracking

  1. Changes to `employees` table
    - Add `pin_expires_at` column to track when PIN expires (30 days from creation/last change)
    - Update existing rows to set initial expiry dates
  
  2. Notes
    - PINs will be auto-generated when staff are created
    - PINs expire after 30 days and staff must create a new one
    - The `last_pin_change_at` column tracks the last time PIN was changed
    - The `pin_expires_at` column stores the exact expiration timestamp
*/

-- Add pin_expires_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'pin_expires_at'
  ) THEN
    ALTER TABLE employees ADD COLUMN pin_expires_at timestamptz;
  END IF;
END $$;

-- Set initial expiry dates for existing employees (30 days from last_pin_change_at or created_at)
UPDATE employees
SET pin_expires_at = COALESCE(
  last_pin_change_at + interval '30 days',
  created_at + interval '30 days'
)
WHERE pin_expires_at IS NULL;