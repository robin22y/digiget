/*
  # Fix infinite recursion in shops RLS policy
  
  The shops policy was querying user_shop_access, which queries shops,
  causing infinite recursion. This fixes it by using a simpler approach.
*/

-- Drop all existing shops policies that might cause recursion
DROP POLICY IF EXISTS "Users see only their shops" ON shops;
DROP POLICY IF EXISTS "Users can view own shop" ON shops;
DROP POLICY IF EXISTS "Public can view shops" ON shops;
DROP POLICY IF EXISTS "Anyone can view shop names for staff portal lookup" ON shops;

-- Recreate shops policies - check user_id FIRST to avoid recursion
CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    -- Primary check: user owns shop directly (avoids recursion completely)
    (user_id = auth.uid())
    OR
    -- Secondary check: user has access via user_shop_access
    -- This uses the simple "Users see their own access" policy which doesn't query shops
    EXISTS (
      SELECT 1 FROM user_shop_access usa
      WHERE usa.shop_id = shops.id
      AND usa.user_id = auth.uid()
    )
  );

-- Keep public access for staff portal
CREATE POLICY "Anyone can view shop names for staff portal lookup"
  ON shops FOR SELECT
  TO anon
  USING (true);

