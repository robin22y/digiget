# Migration Run Order for Fixing Shop Creation Errors

## Critical: Run these migrations in Supabase SQL Editor IN THIS ORDER:

### 1. `20250131000002_create_user_shop_access.sql`
Creates the user_shop_access table for multi-location support.

### 2. `20250131000004_enable_rls_and_policies.sql` 
Enables RLS on all tables and creates policies (but has some issues that get fixed in later migrations).

### 3. `20250131000007_fix_user_shop_access_recursion.sql`
Removes the recursive "Shop owners see their shop access" policy.

### 4. `20250131000008_fix_shops_rls_recursion.sql`
Fixes the shops SELECT policy to only check user_id (simplified to avoid recursion).

### 5. `20250131000009_create_shop_access_function.sql`
Creates a SECURITY DEFINER function to check shop access without recursion.

### 6. `20250131000010_fix_user_shop_access_super_admin_policy.sql`
Fixes super admin policy to use auth.jwt() instead of auth.users.

### 7. `20250131000011_fix_shops_insert_update_policies.sql` ⚠️ **MOST IMPORTANT**
Adds the missing INSERT and UPDATE policies for shops table, plus fixes super admin policy using auth.jwt().

---

## Quick Fix Script (Copy & Paste into Supabase SQL Editor)

```sql
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

CREATE POLICY "Users see their own access"
  ON user_shop_access FOR SELECT
  USING (user_id = auth.uid());

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

-- 2. Ensure shops table has user_id
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
```

After running this script, try creating a shop again. The INSERT policy is what was missing!

