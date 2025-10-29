/*
  # Fix customer_ratings RLS policies
  
  Allow both anonymous and authenticated users to insert ratings
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Public can insert ratings" ON customer_ratings;

-- Allow anonymous users to insert ratings (for customer self-rating from public pages)
CREATE POLICY "Anonymous can insert ratings"
  ON customer_ratings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert ratings (for shop staff/owners)
CREATE POLICY "Authenticated can insert ratings"
  ON customer_ratings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure authenticated users can view ratings
DROP POLICY IF EXISTS "Shop owners can view ratings" ON customer_ratings;

-- Shop owners can view all ratings for their shop (both authenticated)
CREATE POLICY "Shop owners can view their shop ratings"
  ON customer_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_ratings.shop_id
      AND shops.user_id = auth.uid()
    )
  );

