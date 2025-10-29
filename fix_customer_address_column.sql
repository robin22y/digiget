/*
  # Fix: Add address and email columns to customers table + Fix UPDATE policy
  
  Run this in Supabase SQL Editor to fix the "Could not find the 'address' column" error
  
  This migration:
  1. Adds email and address columns to customers table
  2. Fixes the UPDATE policy to allow profile updates
  
  Safe to run multiple times (uses IF NOT EXISTS)
*/

-- Step 1: Add email and address columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 2: Fix UPDATE policy (drop conflicting policies first)
DROP POLICY IF EXISTS "Anyone can update customers for staff portal" ON customers;
DROP POLICY IF EXISTS "Public can update customers" ON customers;

-- Step 3: Create unified UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Public can update customers"
  ON customers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Verify the columns were added (optional - you can check the result)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('email', 'address');

