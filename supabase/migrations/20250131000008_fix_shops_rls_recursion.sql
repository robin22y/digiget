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

-- Recreate shops policies - ONLY check user_id to completely avoid recursion
-- NOTE: We cannot query user_shop_access here because that causes recursion when
-- user_shop_access queries shops with shops(*) join
CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    -- ONLY check direct ownership to avoid recursion
    (user_id = auth.uid())
  );

-- Keep public access for staff portal
CREATE POLICY "Anyone can view shop names for staff portal lookup"
  ON shops FOR SELECT
  TO anon
  USING (true);

