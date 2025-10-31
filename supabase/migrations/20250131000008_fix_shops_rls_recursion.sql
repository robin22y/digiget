/*
  # Fix infinite recursion in shops RLS policy
  
  The shops policy was querying user_shop_access, which queries shops,
  causing infinite recursion. This fixes it by checking user_id first.
*/

-- Drop and recreate the shops SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users see only their shops" ON shops;

CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    -- Check user_id FIRST (avoids recursion - direct ownership check)
    (user_id = auth.uid())
    OR
    -- Only check user_shop_access if user doesn't own shop directly
    (user_id IS NULL OR user_id != auth.uid()) AND EXISTS (
      SELECT 1 FROM user_shop_access
      WHERE user_shop_access.shop_id = shops.id
      AND user_shop_access.user_id = auth.uid()
    )
  );

