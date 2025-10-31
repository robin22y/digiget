/*
  # Fix infinite recursion in user_shop_access RLS policy
  
  This migration fixes the "Shop owners see their shop access" policy
  that was causing infinite recursion by querying user_shop_access within itself.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Shop owners see their shop access" ON user_shop_access;

-- Recreate it without the recursive query
CREATE POLICY "Shop owners see their shop access"
  ON user_shop_access FOR SELECT
  USING (
    -- Check if user owns the shop directly via shops.user_id (avoids recursion)
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

