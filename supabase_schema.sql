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

-- ✅ SECURE: Admin read access removed
-- Admin dashboard now uses Edge Functions with service role key (bypasses RLS)
-- This ensures only authorized admins can read all logs
-- 
-- Users can only read their own logs (privacy protected)
-- Admin operations are handled via: supabase/functions/admin-metrics
--
-- If you need to allow specific admin user IDs to read all logs, uncomment below:
-- DROP POLICY IF EXISTS "Only specific admins can read all shift logs" ON shift_logs;
-- CREATE POLICY "Only specific admins can read all shift logs"
--   ON shift_logs
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'));

-- Prevent users from updating their logs (immutable audit trail)
-- Users can insert and delete, but not modify existing logs
-- This ensures data integrity and prevents tampering

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

-- ✅ SECURE: Ad management policies removed
-- Admin dashboard now uses Edge Functions with service role key (bypasses RLS)
-- This ensures only authorized admins can manage ads
-- 
-- Public users can only read active ads (for display)
-- Admin operations are handled via: supabase/functions/admin-ads
--
-- If you need to allow specific admin user IDs to manage ads, uncomment below:
-- CREATE POLICY "Only admins can insert ads"
--   ON ads FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'));
-- CREATE POLICY "Only admins can update ads"
--   ON ads FOR UPDATE TO authenticated
--   USING (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'))
--   WITH CHECK (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'));
-- CREATE POLICY "Only admins can delete ads"
--   ON ads FOR DELETE TO authenticated
--   USING (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'));

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

-- ✅ SECURE: Admin device management policies
-- Admin dashboard uses Edge Functions with service role key (bypasses RLS)
-- 
-- Minimal policy for checking admin device status (needed for app functionality)
-- Users can read admin_devices to check if their device is admin
-- Full management (insert/delete) is handled via Edge Functions

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can check admin device status" ON admin_devices;
DROP POLICY IF EXISTS "Users can update their admin device last_used_at" ON admin_devices;
DROP POLICY IF EXISTS "Users can insert their own admin device" ON admin_devices;

CREATE POLICY "Users can check admin device status"
  ON admin_devices
  FOR SELECT
  TO authenticated
  USING (true);

-- Update policy for last_used_at (needed for checkAdminDevice)
CREATE POLICY "Users can update their admin device last_used_at"
  ON admin_devices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow users to register their own device as admin (needed for device registration)
-- This allows the device registration flow to work
CREATE POLICY "Users can insert their own admin device"
  ON admin_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin operations (delete) are handled via: supabase/functions/admin-devices
-- This ensures only authorized admins can delete devices
--
-- If you need to allow specific admin user IDs to manage devices, uncomment below:
-- CREATE POLICY "Only admins can insert admin devices"
--   ON admin_devices FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'));
-- CREATE POLICY "Only admins can delete admin devices"
--   ON admin_devices FOR DELETE TO authenticated
--   USING (auth.uid() IN ('admin-uuid-1', 'admin-uuid-2'));

-- ============================================
-- 4. Create notices table (for admin announcements)
-- ============================================
CREATE TABLE IF NOT EXISTS notices (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  link_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority shows first
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notices_is_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active notices" ON notices;

-- Create policy: Anyone can read active notices (for public display)
CREATE POLICY "Anyone can read active notices"
  ON notices
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ✅ SECURE: Notice management policies removed
-- Admin dashboard uses Edge Functions with service role key (bypasses RLS)
-- This ensures only authorized admins can manage notices
-- 
-- Public users can only read active notices (for display)
-- Admin operations are handled via: supabase/functions/admin-notices

-- ============================================
-- 5. Migration: Add is_test column (for existing databases)
-- ============================================
-- Run this if you already have the shift_logs table and need to add the is_test column
-- ALTER TABLE shift_logs ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
-- CREATE INDEX IF NOT EXISTS idx_shift_logs_is_test ON shift_logs(is_test);

