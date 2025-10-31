/*
  # Create helper function for shop access to avoid RLS recursion
  
  This function checks if a user has access to a shop either via:
  1. Direct ownership (shops.user_id = user_id)
  2. Via user_shop_access table
  
  We use SECURITY DEFINER to bypass RLS checks when querying user_shop_access
  from within the shops RLS policy, preventing infinite recursion.
*/

CREATE OR REPLACE FUNCTION public.user_has_shop_access(p_shop_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN := false;
BEGIN
  -- Check direct ownership first (fast path, no recursion)
  SELECT EXISTS(
    SELECT 1 FROM shops
    WHERE id = p_shop_id AND user_id = p_user_id
  ) INTO v_has_access;
  
  -- If not direct owner, check user_shop_access
  IF NOT v_has_access THEN
    SELECT EXISTS(
      SELECT 1 FROM user_shop_access
      WHERE shop_id = p_shop_id AND user_id = p_user_id
    ) INTO v_has_access;
  END IF;
  
  RETURN v_has_access;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_shop_access(UUID, UUID) TO authenticated;

-- Now update shops policy to use this function
DROP POLICY IF EXISTS "Users see only their shops" ON shops;

CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    -- Use function to check access (avoids recursion by using SECURITY DEFINER)
    public.user_has_shop_access(shops.id, auth.uid())
  );

