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

-- Recreate shops policies - check user_id directly
-- NOTE: For multi-location support via user_shop_access, see migration 20250131000009
-- which creates a SECURITY DEFINER function to avoid recursion
CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    -- Check direct ownership (fast path)
    (user_id = auth.uid())
  );

-- Keep public access for staff portal
CREATE POLICY "Anyone can view shop names for staff portal lookup"
  ON shops FOR SELECT
  TO anon
  USING (true);

