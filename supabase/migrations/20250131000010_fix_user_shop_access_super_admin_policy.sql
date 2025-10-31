/*
  # Fix super admin policy on user_shop_access
  
  The policy was trying to query auth.users which isn't accessible from RLS.
  Replace it with auth.jwt() checks like other super admin policies.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admins see all access" ON user_shop_access;

-- Recreate using auth.jwt() instead of querying auth.users
CREATE POLICY "Super admins see all access"
  ON user_shop_access FOR ALL
  USING (
    -- Allow super admin emails (@digiget.uk)
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR
    -- Allow users with super role in metadata
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR
    -- Allow users with is_super_admin flag
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

