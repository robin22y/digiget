-- =====================================================
-- Make Customer Phone Number Optional
-- Allows creating customers without phone numbers (guests)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop the unique constraint that prevents NULL phones
DROP INDEX IF EXISTS idx_customers_shop_phone_unique;

-- Step 2: Make phone column nullable
ALTER TABLE customers 
ALTER COLUMN phone DROP NOT NULL;

-- Step 3: Create a new unique constraint that allows multiple NULL phones
-- Only enforces uniqueness when phone is NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_shop_phone_unique 
ON customers(shop_id, phone)
WHERE phone IS NOT NULL;

-- Step 4: Add a partial unique index for shop_id alone (for tracking purposes)
-- This ensures we can still query efficiently even with NULL phones
CREATE INDEX IF NOT EXISTS idx_customers_shop_id_phone_null 
ON customers(shop_id) 
WHERE phone IS NULL;

-- Step 5: Update any existing NULL values to be properly handled
-- (No action needed - existing data should be fine)

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
AND column_name = 'phone';

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'customers'
AND indexname LIKE '%phone%';

