/*
  # Allow public employee lookup for staff portal

  1. Changes
    - Add policy to allow anonymous users to read employee data for staff portal
    - This is needed for the public staff portal at /:shopName/:staffName
  
  2. Security
    - Only allows SELECT (read-only) access to anonymous users
    - Staff need to verify their PIN to access sensitive features
    - This enables staff to find their profile and authenticate
*/

-- Allow anonymous users to read employee info for staff portal lookup and PIN verification
CREATE POLICY "Anyone can view employees for staff portal lookup"
  ON employees FOR SELECT
  TO anon
  USING (active = true);
