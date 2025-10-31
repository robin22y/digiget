/*
  # Fix shops INSERT and UPDATE policies and super admin policy
  
  Migration 20250131000004 didn't include INSERT and UPDATE policies for shops,
  and super admin policy queries auth.users which isn't accessible from RLS.
*/

-- Drop all conflicting shops policies
DROP POLICY IF EXISTS "Users can insert own shop" ON shops;
DROP POLICY IF EXISTS "Users can update own shop" ON shops;
DROP POLICY IF EXISTS "Super admin sees all shops" ON shops;

-- Recreate INSERT policy
CREATE POLICY "Users can insert own shop"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recreate UPDATE policy
CREATE POLICY "Users can update own shop"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id);

-- Recreate super admin policy using auth.jwt() instead of auth.users
CREATE POLICY "Super admin sees all shops"
  ON shops FOR ALL
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

