-- ================================================
-- COMPLETE FIX FOR SHOPS RLS POLICIES
-- Copy and paste this entire script into Supabase SQL Editor
-- ================================================

-- 1. Create user_shop_access table
CREATE TABLE IF NOT EXISTS user_shop_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);

ALTER TABLE user_shop_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own access" ON user_shop_access;
CREATE POLICY "Users see their own access"
  ON user_shop_access FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins see all access" ON user_shop_access;
CREATE POLICY "Super admins see all access"
  ON user_shop_access FOR ALL
  USING (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

CREATE INDEX IF NOT EXISTS idx_user_shop_access_user ON user_shop_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_access_shop ON user_shop_access(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_access_role ON user_shop_access(role);

-- 2. Ensure shops table has user_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Drop all existing conflicting shops policies
DROP POLICY IF EXISTS "Users see only their shops" ON shops;
DROP POLICY IF EXISTS "Users can insert own shop" ON shops;
DROP POLICY IF EXISTS "Users can update own shop" ON shops;
DROP POLICY IF EXISTS "Users can view own shop" ON shops;
DROP POLICY IF EXISTS "Public can view shops" ON shops;
DROP POLICY IF EXISTS "Anyone can view shop names for staff portal lookup" ON shops;
DROP POLICY IF EXISTS "Super admin sees all shops" ON shops;

-- 4. Create shops policies (INSERT is CRITICAL for signup to work!)
CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own shop"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shop"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shop names for staff portal lookup"
  ON shops FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Super admin sees all shops"
  ON shops FOR ALL
  USING (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- ================================================
-- END OF SCRIPT
-- After running this, try creating a shop again!
-- ================================================

