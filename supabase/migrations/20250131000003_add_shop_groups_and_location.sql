/*
  # Add multi-location support
  
  1. New Tables
    - shop_groups: For chains/multi-location businesses
    
  2. Changes
    - Add group_id and location_name to shops table
*/

-- Create shop_groups table
CREATE TABLE IF NOT EXISTS shop_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shop_groups ENABLE ROW LEVEL SECURITY;

-- Owners can see their own groups
CREATE POLICY "Owners see their groups"
  ON shop_groups FOR SELECT
  USING (owner_id = auth.uid());

-- Super admins see all groups
CREATE POLICY "Super admins see all groups"
  ON shop_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Add columns to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN group_id UUID REFERENCES shop_groups(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'location_name'
  ) THEN
    ALTER TABLE shops ADD COLUMN location_name TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shops_group_id ON shops(group_id);

