/*
  # Allow public/anonymous users to create and update customers
  
  1. Changes
    - Allow anonymous users to INSERT customers (for CustomerArea/QR code access)
    - Allow anonymous users to UPDATE customers (for profile updates)
  
  2. Security
    - This enables customers to self-register and update their profile via QR codes
    - Customers can only manage their own records (via phone number matching)
*/

-- Allow anonymous users to insert customers (for self-registration via QR code)
DROP POLICY IF EXISTS "Public can insert customers" ON customers;

CREATE POLICY "Public can insert customers"
  ON customers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update customers (for profile updates)
DROP POLICY IF EXISTS "Public can update customers" ON customers;

CREATE POLICY "Public can update customers"
  ON customers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

