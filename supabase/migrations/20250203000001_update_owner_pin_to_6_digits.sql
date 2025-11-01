-- Migration: Update owner/console PIN from 4 digits to 6 digits for better security
-- Date: 2025-02-03
-- 
-- IMPORTANT: This migration ONLY affects the owner_pin (console PIN) in the shops table.
-- Staff PINs in the employees table remain 4 digits and are NOT affected by this migration.

-- Step 1: Add constraint check for existing 4-digit PINs (if any)
-- First, update any 4-digit PINs to 6 digits by padding with '00' prefix
UPDATE shops 
SET owner_pin = LPAD(owner_pin, 6, '0')
WHERE owner_pin IS NOT NULL 
  AND LENGTH(owner_pin) < 6
  AND owner_pin ~ '^[0-9]+$';

-- Step 2: Set default for any NULL values
UPDATE shops 
SET owner_pin = '000000'
WHERE owner_pin IS NULL;

-- Step 3: Update column to enforce 6-digit format
-- Note: PostgreSQL TEXT columns don't have length limits, but we'll add a constraint
ALTER TABLE shops 
DROP CONSTRAINT IF EXISTS owner_pin_format;

ALTER TABLE shops 
ADD CONSTRAINT owner_pin_format 
CHECK (owner_pin ~ '^[0-9]{6}$');

-- Step 4: Update default value
ALTER TABLE shops 
ALTER COLUMN owner_pin SET DEFAULT '000000';

-- Step 5: Ensure all existing PINs are 6 digits
-- Pad any that are still shorter than 6 digits
UPDATE shops 
SET owner_pin = LPAD(owner_pin, 6, '0')
WHERE LENGTH(owner_pin) < 6;

-- Verify: All PINs should now be exactly 6 digits
-- This will fail if any PIN is not 6 digits:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM shops 
    WHERE owner_pin IS NULL 
       OR LENGTH(owner_pin) != 6 
       OR owner_pin !~ '^[0-9]{6}$'
  ) THEN
    RAISE EXCEPTION 'Migration failed: Some owner_pin values are not 6 digits';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN shops.owner_pin IS 'Owner/Console PIN for accessing shop settings. Must be exactly 6 digits. Default is 000000 and should be changed on first use. NOTE: Staff PINs (in employees table) remain 4 digits and are not affected by this change.';

