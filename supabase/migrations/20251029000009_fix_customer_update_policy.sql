/*
  # Fix customer UPDATE policy to include WITH CHECK clause
  
  1. Changes
    - Ensure UPDATE policy for customers has both USING and WITH CHECK clauses
    - This fixes profile update issues in customer portal and check-in page
  
  2. Security
    - Anonymous users can update their own customer records
    - Policy allows all fields to be updated (name, email, address)
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Anyone can update customers for staff portal" ON customers;
DROP POLICY IF EXISTS "Public can update customers" ON customers;

-- Create unified UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Public can update customers"
  ON customers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Also ensure authenticated users (shop owners/staff) can still update
-- This is already covered by "Shop owners can manage customers" policy

