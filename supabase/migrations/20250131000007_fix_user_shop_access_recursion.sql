/*
  # Fix infinite recursion in user_shop_access RLS policy
  
  This migration removes the "Shop owners see their shop access" policy
  that was causing infinite recursion by querying shops, which queries user_shop_access.
  
  Shop owners can still see their shops via:
  1. Direct ownership: shops.user_id = auth.uid()
  2. Their own access record: user_shop_access.user_id = auth.uid()
  
  The removed policy was for shop owners to see OTHER users' access to their shops,
  which is a less common use case and causes recursion issues.
*/

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Shop owners see their shop access" ON user_shop_access;

