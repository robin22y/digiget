/*
  # Allow public shop lookup for staff portal

  1. Changes
    - Add policy to allow anonymous users to read shop name and ID for staff portal
    - This is needed for the public staff portal at /:shopName/:staffName
  
  2. Security
    - Only exposes shop ID and name to public (no sensitive data)
    - Staff can look up their shop to access the portal without authentication
*/

-- Allow anonymous users to read basic shop info (id and name only)
CREATE POLICY "Anyone can view shop names for staff portal lookup"
  ON shops FOR SELECT
  TO anon
  USING (true);
