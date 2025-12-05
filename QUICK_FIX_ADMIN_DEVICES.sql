-- Quick Fix: Drop and recreate admin_devices policies
-- Run this in Supabase SQL Editor if you get "policy already exists" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can check admin device status" ON admin_devices;
DROP POLICY IF EXISTS "Users can update their admin device last_used_at" ON admin_devices;
DROP POLICY IF EXISTS "Authenticated users can read all admin devices" ON admin_devices;
DROP POLICY IF EXISTS "Authenticated users can insert admin devices" ON admin_devices;
DROP POLICY IF EXISTS "Authenticated users can delete admin devices" ON admin_devices;
DROP POLICY IF EXISTS "Users can insert their own admin device" ON admin_devices;
DROP POLICY IF EXISTS "Users can read admin devices" ON admin_devices;
DROP POLICY IF EXISTS "Users can delete admin devices" ON admin_devices;

-- Create the secure policies
CREATE POLICY "Users can check admin device status"
  ON admin_devices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their admin device last_used_at"
  ON admin_devices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);



