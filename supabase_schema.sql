-- Supabase Database Schema for Digiget
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Create shift_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS shift_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  items_checked INTEGER NOT NULL DEFAULT 0,
  skipped_items TEXT[] DEFAULT '{}',
  shift_type TEXT NOT NULL DEFAULT 'Unspecified',
  location JSONB,
  is_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shift_logs_user_id ON shift_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_logs_created_at ON shift_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shift_logs_is_test ON shift_logs(is_test);

-- Enable Row Level Security
ALTER TABLE shift_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can insert their own shift logs" ON shift_logs;
DROP POLICY IF EXISTS "Users can read their own shift logs" ON shift_logs;
DROP POLICY IF EXISTS "Users can delete their own shift logs" ON shift_logs;

-- Create policy: Users can only insert their own logs
CREATE POLICY "Users can insert their own shift logs"
  ON shift_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can read their own logs
CREATE POLICY "Users can read their own shift logs"
  ON shift_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own logs
CREATE POLICY "Users can delete their own shift logs"
  ON shift_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy: Admins can read all shift logs (for admin dashboard metrics)
-- This allows authenticated users to read all logs for analytics
-- Note: In production, you may want to restrict this to specific admin users
DROP POLICY IF EXISTS "Admins can read all shift logs" ON shift_logs;
CREATE POLICY "Admins can read all shift logs"
  ON shift_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 2. Create ads table
-- ============================================
CREATE TABLE IF NOT EXISTS ads (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  link TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_city TEXT,
  target_region TEXT,
  target_shifts TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for ads
CREATE INDEX IF NOT EXISTS idx_ads_is_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);

-- Enable Row Level Security for ads
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Anyone can read active ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can insert ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can update ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can delete ads" ON ads;

-- Create policy: Anyone can read active ads (for public display)
CREATE POLICY "Anyone can read active ads"
  ON ads
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create policy: Authenticated users can insert ads (for admin dashboard)
CREATE POLICY "Authenticated users can insert ads"
  ON ads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy: Authenticated users can update ads
CREATE POLICY "Authenticated users can update ads"
  ON ads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy: Authenticated users can delete ads
CREATE POLICY "Authenticated users can delete ads"
  ON ads
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 3. Create admin_devices table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_devices (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  user_agent TEXT,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_devices_device_id ON admin_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_admin_devices_last_used ON admin_devices(last_used_at DESC);

-- Enable Row Level Security
ALTER TABLE admin_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read all admin devices" ON admin_devices;
DROP POLICY IF EXISTS "Authenticated users can insert admin devices" ON admin_devices;
DROP POLICY IF EXISTS "Authenticated users can delete admin devices" ON admin_devices;

-- Create policy: Authenticated users can read all admin devices (for admin dashboard)
CREATE POLICY "Authenticated users can read all admin devices"
  ON admin_devices
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: Authenticated users can insert admin devices
CREATE POLICY "Authenticated users can insert admin devices"
  ON admin_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy: Authenticated users can delete admin devices
CREATE POLICY "Authenticated users can delete admin devices"
  ON admin_devices
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 4. Migration: Add is_test column (for existing databases)
-- ============================================
-- Run this if you already have the shift_logs table and need to add the is_test column
-- ALTER TABLE shift_logs ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
-- CREATE INDEX IF NOT EXISTS idx_shift_logs_is_test ON shift_logs(is_test);

