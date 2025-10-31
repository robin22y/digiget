/*
  # Create user_shop_access table for multi-location support and access control
  
  1. New Tables
    - user_shop_access: Controls who can access which shop with what permissions
    
  2. Security
    - Enable RLS
    - Users can only see their own access records
    - Super admins see all
*/

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

-- Users can see their own access records
CREATE POLICY "Users see their own access"
  ON user_shop_access FOR SELECT
  USING (user_id = auth.uid());

-- Super admins can see all access records
-- Uses auth.jwt() instead of querying auth.users (which isn't accessible from RLS)
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

-- NOTE: Removed "Shop owners see their shop access" policy to prevent recursion
-- Shop owners can see their shops via:
-- 1. Direct ownership: shops.user_id = auth.uid()  
-- 2. Their own access record: user_shop_access.user_id = auth.uid()
-- 
-- If shop owners need to see OTHER users' access to their shops, we'll implement
-- that via a function or different approach that doesn't cause recursion.

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_shop_access_user ON user_shop_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_access_shop ON user_shop_access(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_access_role ON user_shop_access(role);

